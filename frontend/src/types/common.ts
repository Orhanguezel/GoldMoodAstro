// =============================================================
// FILE: src/types/common.ts  (DYNAMIC)
// =============================================================

export type SupportedLocale = string;

/** Çok dilli alan: locale -> text */
export type TranslatedLabel = Record<string, string>;
export type StrictTranslatedLabel = Record<string, string>;

function norm(v: unknown): string {
  return String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-');
}
function short(v: unknown): string {
  return norm(v).split('-')[0] || '';
}

/**
 * Display-only (best-effort) label map.
 * Bu liste karar mekanizması değildir; DB’den gelen label varsa onu kullanın.
 */
const DISPLAY_LABELS: Record<string, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
};

/**
 * Display-only date format hints (opsiyonel).
 * Bilinmeyen locale => ISO benzeri güvenli format.
 */
const DISPLAY_DATE_FORMATS: Record<string, string> = {
  tr: 'dd.MM.yyyy',
  de: 'dd.MM.yyyy',
  en: 'yyyy-MM-dd',
};

/**
 * Intl locale mapping (best-effort).
 * Bilinmeyen locale: önce full tag'ı dene (örn "pt-br"),
 * yoksa kısa tag üstünden üret (örn "pt"),
 * yine yoksa "en-US".
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
  const l = short(lFull);
  return DISPLAY_LABELS[lFull] || DISPLAY_LABELS[l] || fallback;
}

export function getDateFormatHint(locale: SupportedLocale, fallback = 'yyyy-MM-dd'): string {
  const lFull = norm(locale);
  const l = short(lFull);
  return DISPLAY_DATE_FORMATS[lFull] || DISPLAY_DATE_FORMATS[l] || fallback;
}

export function getIntlLocale(locale: SupportedLocale, fallback = 'en-US'): string {
  const lFull = norm(locale);
  const l = short(lFull);

  // önce tam eşleşme, sonra kısa eşleşme
  const mapped = DISPLAY_INTL_MAP[lFull] || DISPLAY_INTL_MAP[l];
  if (mapped) return mapped;

  // hiç map yoksa: full tag’ı Intl’e verilebilir durumda ise onu kullan
  if (lFull) return lFull;

  return fallback;
}

/**
 * Çok dilli alanlarda fallback okuma
 * Fallback sırası:
 *  1) istenen lang (full)
 *  2) istenen lang (short)
 *  3) tr
 *  4) en
 *  5) ilk değer
 */
export function getMultiLang(
  obj?: Record<string, string> | null,
  lang?: SupportedLocale | null,
): string {
  if (!obj) return '—';

  const lFull = norm(lang);
  const l = short(lFull);

  if (lFull && obj[lFull]) return obj[lFull];
  if (l && obj[l]) return obj[l];

  return obj.tr || obj.en || Object.values(obj)[0] || '—';
}

export type ZodiacSign =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

export type PlanetKey =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto';

export interface PlanetPlacement {
  key: PlanetKey;
  name: string;
  symbol: string;
  longitude: number;
  sign: ZodiacSign;
  sign_label: string;
  degree_in_sign: number;
  house: number;
  retrograde: boolean;
}

export interface ChartAspect {
  type: 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';
  planet_a: PlanetKey;
  planet_b: PlanetKey;
  orb: number;
  exact_angle: number;
}

export interface HouseCusp {
  house: number;
  longitude: number;
  sign: ZodiacSign;
  sign_label: string;
  degree_in_sign: number;
}

export interface NatalChart {
  planets: Record<PlanetKey, PlanetPlacement>;
  houses: HouseCusp[];
  ascendant: HouseCusp;
  midheaven: HouseCusp;
  aspects: ChartAspect[];
}

export interface BirthChart {
  id: string;
  name: string;
  dob: string;
  tob: string;
  pob_lat: string;
  pob_lng: string;
  pob_label: string;
  tz_offset: number;
  chart_data: NatalChart;
}

export interface BirthChartCreateInput {
  name: string;
  dob: string;
  tob: string;
  pob_lat: number;
  pob_lng: number;
  pob_label: string;
  tz_offset: number;
}

export interface GeocodeResult {
  q: string;
  lat: number;
  lng: number;
  label: string;
  source: 'cache' | 'nominatim';
}

export interface DailyReading {
  id: string;
  user_id: string;
  chart_id: string;
  reading_date: string;
  content: string;
  transits_snapshot?: unknown;
  model_used?: string | null;
}

export interface DailyReadingResponse {
  reading: DailyReading;
  reused: boolean;
  similarity_max: number;
}

export type BannerPlacement =
  | 'home_hero'
  | 'home_sidebar'
  | 'home_footer'
  | 'home_mid_1'
  | 'home_mid_2'
  | 'home_mid_3'
  | 'consultant_list'
  | 'consultant_detail_top'
  | 'consultant_detail_bottom'
  | 'dashboard_top'
  | 'blog_sidebar'
  | 'blog_inline'
  | 'mobile_welcome'
  | 'mobile_home'
  | 'mobile_call_end';

export interface Banner {
  id: string;
  code: string;
  title_tr?: string | null;
  title_en?: string | null;
  subtitle_tr?: string | null;
  subtitle_en?: string | null;
  image_url: string;
  image_url_mobile?: string | null;
  link_url?: string | null;
  cta_label_tr?: string | null;
  cta_label_en?: string | null;
  placement: BannerPlacement;
  locale: string;
  priority: number;
}
