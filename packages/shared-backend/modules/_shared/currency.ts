// =============================================================
// FILE: modules/_shared/currency.ts
//
// Para birimi katmanının TEK KAYNAĞI.
//
// KARAR (2026-08-17, kullanıcı): **Defter TL'dir ve TL kalır.** Türkiye'deki
// müşteri ₺ ile, kartla, Stripe üzerinden öder. Danışman fiyatı, hakedişi,
// cüzdanı, sipariş toplamı — hepsi TRY.
//
// EUR yalnızca SUNUM (presentment) katmanındadır: /de ve /en ziyaretçisi
// fiyatları € görür ve ödeme sayfası € açılır. Sebep: PayPal TRY'yi
// desteklemiyor (Stripe'ın PayPal para birimi listesinde TRY yok), yabancı
// ziyaretçiye PayPal sunmanın tek yolu € sunmaktır.
//
// NEDEN DEFTER TEK PARA BİRİMİ: hakediş/komisyon/ödeme mutabakatı iki para
// biriminde tutulursa kur farkıyla kayar. Stripe'ın gerçekten tahsil ettiği
// tutar `payments` satırına kendi para birimiyle yazılır; `orders` TRY kalır.
// İkisi ayrışır ama izlenebilir.
//
// Ayar: site_settings.platform_currency (locale='*'), JSON:
//   {"base":"TRY","supported":["TRY","EUR"],"rates":{"EUR":0.018045}}
//   rates = 1 BASE biriminin hedef para birimindeki karşılığı.
// Ayar yoksa aşağıdaki varsayılan kullanılır (fail-soft; ödeme kilitlenmesin).
// KUR GÜNCELLEME: elle. Panelden platform_currency değeri düzenlenir.
// =============================================================
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { siteSettings } from '../siteSettings/schema';

export interface CurrencyConfig {
  /** Defter para birimi — fiyat, cüzdan, hakediş, sipariş toplamı. */
  base: string;
  /** Ödeme sayfasında sunulabilecek para birimleri. */
  supported: string[];
  /** 1 base biriminin hedefteki karşılığı (ör. TRY tabanında {"EUR":0.018045}). */
  rates: Record<string, number>;
}

// 1 EUR = 55.415 TRY (16.08.2026) → 1 TRY = 0.018045 EUR
const DEFAULT_CONFIG: CurrencyConfig = {
  base: 'TRY',
  supported: ['TRY', 'EUR'],
  rates: { EUR: 0.018045 },
};

/** Hangi dil hangi para birimini görür. TR → defter (₺), diğerleri → EUR. */
const LOCALE_CURRENCY: Record<string, string> = { de: 'EUR', en: 'EUR' };

const CACHE_TTL_MS = 60_000;
let cached: { at: number; value: CurrencyConfig } | null = null;

function parseConfig(raw: unknown): CurrencyConfig {
  let value: any = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return DEFAULT_CONFIG;
    }
  }
  if (!value || typeof value !== 'object') return DEFAULT_CONFIG;

  const base = String(value.base || DEFAULT_CONFIG.base).toUpperCase().slice(0, 3);
  const supportedRaw = Array.isArray(value.supported) && value.supported.length
    ? value.supported.map((c: unknown) => String(c).toUpperCase().slice(0, 3))
    : [base];
  const rates: Record<string, number> = {};
  if (value.rates && typeof value.rates === 'object') {
    for (const [k, v] of Object.entries(value.rates)) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) rates[String(k).toUpperCase().slice(0, 3)] = n;
    }
  }
  return {
    base,
    supported: supportedRaw.includes(base) ? supportedRaw : [base, ...supportedRaw],
    rates,
  };
}

export async function getCurrencyConfig(): Promise<CurrencyConfig> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;
  try {
    const [row] = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(and(eq(siteSettings.key, 'platform_currency'), eq(siteSettings.locale, '*')))
      .limit(1);
    const value = parseConfig(row?.value);
    cached = { at: Date.now(), value };
    return value;
  } catch {
    return DEFAULT_CONFIG;
  }
}

/** Defter para birimi (TRY). Fiyat ve hakediş hep bunda tutulur. */
export async function getBaseCurrency(): Promise<string> {
  return (await getCurrencyConfig()).base;
}

/**
 * Ödeme sayfasının para birimi. TR ziyaretçi defterde (₺) kalır; de/en
 * ziyaretçisi EUR görür — PayPal ancak böyle sunulabilir.
 * Kur tanımlı değilse çevrim yapılamayacağı için base'e düşer.
 */
export async function resolveCheckoutCurrency(locale?: string | null): Promise<string> {
  const cfg = await getCurrencyConfig();
  const loc = String(locale || '').slice(0, 2).toLowerCase();
  const wanted = LOCALE_CURRENCY[loc];
  if (!wanted || wanted === cfg.base) return cfg.base;
  if (!cfg.supported.includes(wanted)) return cfg.base;
  if (!cfg.rates[wanted]) return cfg.base;
  return wanted;
}

/**
 * Defter tutarını sunum para birimine çevirir (2 hane).
 * Kur yoksa çevirmez — uydurma kur yerine base'te kalmak doğru davranıştır.
 */
export async function convertFromBase(
  amount: number,
  currency: string,
): Promise<{ amount: number; currency: string }> {
  const cfg = await getCurrencyConfig();
  const target = String(currency || '').toUpperCase();
  const value = Number(amount) || 0;
  if (!target || target === cfg.base) return { amount: round2(value), currency: cfg.base };
  const rate = cfg.rates[target];
  if (!rate) return { amount: round2(value), currency: cfg.base };
  return { amount: round2(value * rate), currency: target };
}

function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/** Test/seed sonrası önbelleği düşürmek için. */
export function resetCurrencyCache(): void {
  cached = null;
}
