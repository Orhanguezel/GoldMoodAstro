// =============================================================
// FILE: modules/_shared/currency.ts
//
// Platform para biriminin TEK KAYNAĞI.
//
// KARAR (2026-08-16, kullanıcı talimatı): TL kullanılmaz. Fiyatlar, cüzdan ve
// hakedişler EUR ("base") tutulur; ödeme anında İngilizce ziyaretçiye USD
// sunulur. Sebep: PayPal Stripe üzerinden TRY'de sunulamıyor (EUR/USD/GBP…
// listesinde TRY yok) ve satıcı Alman kimliğiyle EUR'ya ödeme alıyor.
//
// Neden defter tek para biriminde: danışman bakiyesi/ödemesi tek para biriminde
// olmazsa hakediş, komisyon ve ödeme mutabakatı kur farkıyla kayar. Bu yüzden
// USD YALNIZ sunum (checkout) katmanındadır; defter daima base'tir.
//
// Ayar: site_settings.platform_currency (locale='*'), JSON:
//   {"base":"EUR","supported":["EUR","USD"],"rates":{"USD":1.16}}
// Ayar okunamazsa fail-soft varsayılan kullanılır (ödeme akışı kilitlenmesin).
// =============================================================
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { siteSettings } from '../siteSettings/schema';

export interface CurrencyConfig {
  /** Defter ve fiyat para birimi (orders.total_amount, wallet, hakediş). */
  base: string;
  /** Checkout'ta sunulabilecek para birimleri. */
  supported: string[];
  /** base → hedef kur (ör. {"USD": 1.16} → 1 EUR = 1.16 USD). */
  rates: Record<string, number>;
}

const DEFAULT_CONFIG: CurrencyConfig = {
  base: 'EUR',
  supported: ['EUR', 'USD'],
  rates: { USD: 1.16 },
};

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
  const supported = Array.isArray(value.supported) && value.supported.length
    ? value.supported.map((c: unknown) => String(c).toUpperCase().slice(0, 3))
    : [base];
  const rates: Record<string, number> = {};
  if (value.rates && typeof value.rates === 'object') {
    for (const [k, v] of Object.entries(value.rates)) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) rates[String(k).toUpperCase().slice(0, 3)] = n;
    }
  }
  return { base, supported: supported.includes(base) ? supported : [base, ...supported], rates };
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

/** Defter para birimi — fiyat, cüzdan, hakediş, sipariş toplamı hep budur. */
export async function getBaseCurrency(): Promise<string> {
  return (await getCurrencyConfig()).base;
}

/**
 * Ödeme sayfasında kullanılacak para birimi.
 * İngilizce ziyaretçi USD, diğerleri base (EUR). Desteklenmeyen istek base'e düşer.
 */
export async function resolveCheckoutCurrency(locale?: string | null): Promise<string> {
  const cfg = await getCurrencyConfig();
  const loc = String(locale || '').slice(0, 2).toLowerCase();
  const wanted = loc === 'en' ? 'USD' : cfg.base;
  return cfg.supported.includes(wanted) ? wanted : cfg.base;
}

/**
 * base tutarı hedef para birimine çevirir (2 hane). Kur yoksa çevirmez —
 * uydurma kur yerine base'te kalmak doğru davranıştır.
 */
export async function convertFromBase(
  amount: number,
  currency: string,
): Promise<{ amount: number; currency: string }> {
  const cfg = await getCurrencyConfig();
  const target = String(currency || '').toUpperCase();
  if (!target || target === cfg.base) return { amount: round2(amount), currency: cfg.base };
  const rate = cfg.rates[target];
  if (!rate) return { amount: round2(amount), currency: cfg.base };
  return { amount: round2(amount * rate), currency: target };
}

function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/** Test/seed sonrası önbelleği düşürmek için. */
export function resetCurrencyCache(): void {
  cached = null;
}
