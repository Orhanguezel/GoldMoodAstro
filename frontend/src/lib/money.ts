// =============================================================
// FILE: src/lib/money.ts
//
// Fiyat GÖSTERİMİ — defter TL, sunum ziyaretçinin diline göre.
//
// Kural (2026-08-17): fiyatlar veritabanında TRY tutulur. TR ziyaretçi ₺ görür.
// /de ve /en ziyaretçisi € görür ve ödeme sayfası da € açılır — çünkü PayPal
// TRY'yi desteklemiyor, yabancı ziyaretçiye PayPal sunmanın tek yolu bu.
//
// Kur TEK KAYNAKTAN gelir: site_settings.platform_currency. Backend ödeme
// oturumunu aynı ayarla çevirir (modules/_shared/currency.ts), böylece ekranda
// yazan tutar ile Stripe'ta tahsil edilen tutar birbirini tutar.
// =============================================================
import { formatCurrency } from './currency';

export interface CurrencyConfig {
  base: string;
  supported: string[];
  rates: Record<string, number>;
}

// Backend'deki DEFAULT_CONFIG ile aynı: 1 EUR = 55.415 TRY (16.08.2026)
export const DEFAULT_CURRENCY_CONFIG: CurrencyConfig = {
  base: 'TRY',
  supported: ['TRY', 'EUR'],
  rates: { EUR: 0.018045 },
};

const LOCALE_CURRENCY: Record<string, string> = { de: 'EUR', en: 'EUR' };

export function parseCurrencyConfig(raw: unknown): CurrencyConfig {
  let value: any = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return DEFAULT_CURRENCY_CONFIG;
    }
  }
  if (!value || typeof value !== 'object') return DEFAULT_CURRENCY_CONFIG;
  const base = String(value.base || 'TRY').toUpperCase().slice(0, 3);
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
  return { base, supported, rates };
}

/** Bu dildeki ziyaretçinin göreceği para birimi. Kur yoksa defterde kalınır. */
export function displayCurrencyFor(locale: string | undefined, config: CurrencyConfig): string {
  const loc = String(locale || '').slice(0, 2).toLowerCase();
  const wanted = LOCALE_CURRENCY[loc];
  if (!wanted || wanted === config.base) return config.base;
  if (!config.supported.includes(wanted) || !config.rates[wanted]) return config.base;
  return wanted;
}

/** TRY tutarını ziyaretçinin para birimine çevirip formatlar. */
export function formatMoney(
  amountBase: string | number | null | undefined,
  locale: string | undefined,
  config: CurrencyConfig = DEFAULT_CURRENCY_CONFIG,
  opts: { decimals?: number } = {},
): string {
  const value = Number(amountBase ?? 0);
  const safe = Number.isFinite(value) ? value : 0;
  const target = displayCurrencyFor(locale, config);
  if (target === config.base) {
    return formatCurrency(safe, config.base, { locale, decimals: opts.decimals ?? 2 });
  }
  const converted = Math.round(safe * (config.rates[target] ?? 1) * 100) / 100;
  return formatCurrency(converted, target, { locale, decimals: opts.decimals ?? 2 });
}
