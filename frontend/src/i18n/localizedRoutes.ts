export const PUBLIC_LOCALES = ['tr', 'en', 'de'] as const;
export type PublicLocale = (typeof PUBLIC_LOCALES)[number];

type LocaleMap = Record<PublicLocale, string>;

const PUBLIC_SEGMENTS: Record<string, LocaleMap> = {
  about: { tr: 'hakkimizda', en: 'about', de: 'ueber-uns' },
  contact: { tr: 'iletisim', en: 'contact', de: 'kontakt' },
  consultants: { tr: 'danismanlar', en: 'consultants', de: 'berater' },
  pricing: { tr: 'fiyatlandirma', en: 'pricing', de: 'preise' },
  faqs: { tr: 'sss', en: 'faqs', de: 'haeufige-fragen' },
  daily: { tr: 'gunluk', en: 'daily', de: 'tageshoroskop' },
  sinastri: { tr: 'sinastri', en: 'synastry', de: 'synastrie' },
  tarot: { tr: 'tarot', en: 'tarot', de: 'tarot' },
  'kahve-fali': { tr: 'kahve-fali', en: 'coffee-reading', de: 'kaffeesatzlesen' },
  'ruya-tabiri': { tr: 'ruya-tabiri', en: 'dream-interpretation', de: 'traumdeutung' },
  numeroloji: { tr: 'numeroloji', en: 'numerology', de: 'numerologie' },
  yildizname: { tr: 'yildizname', en: 'yildizname', de: 'yildizname' },
  'birth-chart': { tr: 'dogum-haritasi', en: 'birth-chart', de: 'geburtshoroskop' },
  'buyuk-uclu': { tr: 'buyuk-uclu', en: 'big-three', de: 'die-grossen-drei' },
  'burcunu-ogren': { tr: 'burcunu-ogren', en: 'discover-your-zodiac-sign', de: 'sternzeichen-finden' },
  'yukselen-burc-hesaplayici': { tr: 'yukselen-burc-hesaplayici', en: 'rising-sign-calculator', de: 'aszendent-berechnen' },
  'unluler-ve-burclari': { tr: 'unluler-ve-burclari', en: 'celebrities-and-zodiac-signs', de: 'promis-und-sternzeichen' },
  'editorial-policy': { tr: 'editor-politikasi', en: 'editorial-policy', de: 'redaktionsrichtlinie' },
  burclar: { tr: 'burclar', en: 'zodiac-signs', de: 'sternzeichen' },
};

const ZODIAC_SIGNS: Record<string, LocaleMap> = {
  aries: { tr: 'koc', en: 'aries', de: 'widder' },
  taurus: { tr: 'boga', en: 'taurus', de: 'stier' },
  gemini: { tr: 'ikizler', en: 'gemini', de: 'zwillinge' },
  cancer: { tr: 'yengec', en: 'cancer', de: 'krebs' },
  leo: { tr: 'aslan', en: 'leo', de: 'loewe' },
  virgo: { tr: 'basak', en: 'virgo', de: 'jungfrau' },
  libra: { tr: 'terazi', en: 'libra', de: 'waage' },
  scorpio: { tr: 'akrep', en: 'scorpio', de: 'skorpion' },
  sagittarius: { tr: 'yay', en: 'sagittarius', de: 'schuetze' },
  capricorn: { tr: 'oglak', en: 'capricorn', de: 'steinbock' },
  aquarius: { tr: 'kova', en: 'aquarius', de: 'wassermann' },
  pisces: { tr: 'balik', en: 'pisces', de: 'fische' },
};

const ZODIAC_SUBPAGES: Record<string, LocaleMap> = {
  ask: { tr: 'ask', en: 'love', de: 'liebe' },
  kariyer: { tr: 'kariyer', en: 'career', de: 'karriere' },
  saglik: { tr: 'saglik', en: 'health', de: 'gesundheit' },
  bugun: { tr: 'bugun', en: 'today', de: 'heute' },
  meditasyon: { tr: 'meditasyon', en: 'meditation', de: 'meditation' },
  uyum: { tr: 'uyum', en: 'compatibility', de: 'kompatibilitaet' },
  transit: { tr: 'transit', en: 'transits', de: 'transite' },
};

function normalizePath(pathname: string): string {
  const path = String(pathname || '/').split(/[?#]/, 1)[0] || '/';
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return withSlash !== '/' ? withSlash.replace(/\/+$/, '') : '/';
}

function inverseKey(map: Record<string, LocaleMap>, locale: PublicLocale, value: string): string | undefined {
  return Object.entries(map).find(([, labels]) => labels[locale] === value)?.[0];
}

/** Internal App Router path -> public, locale-specific path (locale prefix excluded). */
export function toLocalizedPublicPath(locale: PublicLocale, pathname: string): string {
  const parts = normalizePath(pathname).split('/').filter(Boolean);
  if (!parts.length) return '/';

  const logicalRoot = parts[0];
  const root = PUBLIC_SEGMENTS[logicalRoot];
  if (!root) return `/${parts.join('/')}`;
  parts[0] = root[locale];

  if (logicalRoot === 'burclar') {
    if (parts[1] === 'uyum' || parts[1] === 'transit') {
      parts[1] = ZODIAC_SUBPAGES[parts[1]][locale];
    } else if (parts[1] && ZODIAC_SIGNS[parts[1]]) {
      parts[1] = ZODIAC_SIGNS[parts[1]][locale];
      if (parts[2] && ZODIAC_SUBPAGES[parts[2]]) parts[2] = ZODIAC_SUBPAGES[parts[2]][locale];
    }
  }

  return `/${parts.join('/')}`;
}

/** Public, locale-specific path -> internal App Router path (locale prefix excluded). */
export function toLogicalPublicPath(locale: PublicLocale, pathname: string): string {
  const parts = normalizePath(pathname).split('/').filter(Boolean);
  if (!parts.length) return '/';

  const logicalRoot = inverseKey(PUBLIC_SEGMENTS, locale, parts[0]);
  if (!logicalRoot) return `/${parts.join('/')}`;
  parts[0] = logicalRoot;

  if (logicalRoot === 'burclar') {
    if (parts[1]) {
      const special = inverseKey(ZODIAC_SUBPAGES, locale, parts[1]);
      if (special === 'uyum' || special === 'transit') {
        parts[1] = special;
      } else {
        const sign = inverseKey(ZODIAC_SIGNS, locale, parts[1]);
        if (sign) parts[1] = sign;
        if (parts[2]) {
          const subpage = inverseKey(ZODIAC_SUBPAGES, locale, parts[2]);
          if (subpage) parts[2] = subpage;
        }
      }
    }
  }

  return `/${parts.join('/')}`;
}

/** Accept both a localized public path and a legacy internal path. */
export function canonicalPublicPath(locale: PublicLocale, pathname: string): {
  logicalPath: string;
  publicPath: string;
} {
  const normalized = normalizePath(pathname);
  const localizedLogical = toLogicalPublicPath(locale, normalized);
  const logicalPath = localizedLogical !== normalized ? localizedLogical : normalized;
  return { logicalPath, publicPath: toLocalizedPublicPath(locale, logicalPath) };
}

/** Convert a localized route without knowing its source locale (language switcher). */
export function toLogicalPublicPathAnyLocale(pathname: string): string {
  const normalized = normalizePath(pathname);
  for (const locale of PUBLIC_LOCALES) {
    const logical = toLogicalPublicPath(locale, normalized);
    if (logical !== normalized && toLocalizedPublicPath(locale, logical) === normalized) return logical;
  }
  return normalized;
}
