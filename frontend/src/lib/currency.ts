// Tek merkez para birimi formatlama — Wallet/cards/services/credits tutarlılığı için.
// Kullanım: formatCurrency(1234.5) → "₺1.234,50"

const SYMBOLS: Record<string, string> = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' };
const LOCALE_MAP: Record<string, string> = { tr: 'tr-TR', en: 'en-US', de: 'de-DE' };

/**
 * Para birimini sembol + gruplu ondalık ile formatlar (varsayılan ₺ + tr-TR grup).
 * @param amount sayı veya sayısal string
 * @param currency ISO kod (TRY/USD/EUR…)
 * @param opts.locale gruplama locale'i (tr/en/de)
 * @param opts.decimals ondalık hane sayısı (varsayılan 2)
 */
export function formatCurrency(
  amount: string | number | null | undefined,
  currency = 'TRY',
  opts: { locale?: string; decimals?: number } = {},
): string {
  const n = typeof amount === 'number' ? amount : Number(amount ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  const decimals = opts.decimals ?? 2;
  const grouped = safe.toLocaleString(LOCALE_MAP[opts.locale ?? 'tr'] ?? 'tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const sym = SYMBOLS[currency];
  return sym ? `${sym}${grouped}` : `${grouped} ${currency}`;
}
