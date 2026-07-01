// =============================================================
// FILE: src/types/common.ts  (DYNAMIC)
// =============================================================

export type SupportedLocale = string;

/** Multilingual field: locale -> text */
export type TranslatedLabel = Record<string, string>;
export type StrictTranslatedLabel = Record<string, string>;

export function norm(v: unknown): string {
  return String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-');
}

/**
 * Display-only (best-effort) label map.
 * This list is not a decision source; prefer labels from DB when available.
 */
const DISPLAY_LABELS: Record<string, string> = {
  tr: 'Turkish',
  en: 'English',
  de: 'Deutsch',
  fr: 'French',
  es: 'Spanish',
  it: 'Italiano',
};

/**
 * Display-only date format hints.
 * Unknown locale => ISO-like safe format.
 */
const DISPLAY_DATE_FORMATS: Record<string, string> = {
  tr: 'dd.MM.yyyy',
  de: 'dd.MM.yyyy',
  en: 'yyyy-MM-dd',
};

/**
 * Intl locale mapping (best-effort).
 * Unknown locale: try the full tag first, then the short tag, then "en-US".
 */
const DISPLAY_INTL_MAP: Record<string, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
};

export function getLanguageLabel(locale: SupportedLocale, fallback = 'English'): string {
  const lFull = norm(locale);
  const l = lFull.split('-')[0] || '';
  return DISPLAY_LABELS[lFull] || DISPLAY_LABELS[l] || fallback;
}

export function getDateFormatHint(locale: SupportedLocale, fallback = 'yyyy-MM-dd'): string {
  const lFull = norm(locale);
  const l = lFull.split('-')[0] || '';
  return DISPLAY_DATE_FORMATS[lFull] || DISPLAY_DATE_FORMATS[l] || fallback;
}

export function getIntlLocale(locale: SupportedLocale, fallback = 'en-US'): string {
  const lFull = norm(locale);
  const l = lFull.split('-')[0] || '';

  // Try exact match first, then short match.
  const mapped = DISPLAY_INTL_MAP[lFull] || DISPLAY_INTL_MAP[l];
  if (mapped) return mapped;

  // If no map exists, pass the full tag to Intl when possible.
  if (lFull) return lFull;

  return fallback;
}

/**
 * Read fallback from multilingual fields.
 * Fallback order:
 *  1) requested lang (full)
 *  2) requested lang (short)
 *  3) tr
 *  4) en
 *  5) first value
 */
export function getMultiLang(
  obj?: Record<string, string> | null,
  lang?: SupportedLocale | null,
): string {
  if (!obj) return '—';

  const lFull = norm(lang);
  const l = lFull.split('-')[0] || '';

  if (lFull && obj[lFull]) return obj[lFull];
  if (l && obj[l]) return obj[l];

  return obj.tr || obj.en || Object.values(obj)[0] || '—';
}
