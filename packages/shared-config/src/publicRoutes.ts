// Web'in herkese açık, locale'e özgü URL slug'ları — mobil paylaşım linkleri
// bu tablodan üretilir (2026-10-03: mobil sabit `/tr/...` ve İngilizce burç
// slug'ı kullanıyordu → EN/DE kullanıcısı TR sayfaya, burç linki 308'e).
//
// KAYNAK: frontend/src/i18n/localizedRoutes.ts. İki tablo
// frontend/tests/public-routes-sync.test.ts ile birebir eşit tutulur; web'de
// slug değişirse bu dosya da değişmeli, test bunu zorlar.

export const PUBLIC_ROUTE_LOCALES = ['tr', 'en', 'de'] as const;
export type PublicRouteLocale = (typeof PUBLIC_ROUTE_LOCALES)[number];
type LocaleMap = Record<PublicRouteLocale, string>;

export const PUBLIC_SEGMENTS: Record<string, LocaleMap> = {
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

export const ZODIAC_SIGNS: Record<string, LocaleMap> = {
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

export const ZODIAC_SUBPAGES: Record<string, LocaleMap> = {
  ask: { tr: 'ask', en: 'love', de: 'liebe' },
  kariyer: { tr: 'kariyer', en: 'career', de: 'karriere' },
  saglik: { tr: 'saglik', en: 'health', de: 'gesundheit' },
  bugun: { tr: 'bugun', en: 'today', de: 'heute' },
  meditasyon: { tr: 'meditasyon', en: 'meditation', de: 'meditation' },
  uyum: { tr: 'uyum', en: 'compatibility', de: 'kompatibilitaet' },
  transit: { tr: 'transit', en: 'transits', de: 'transite' },
};

export function toPublicRouteLocale(locale: unknown): PublicRouteLocale {
  const short = String(locale || '').trim().toLowerCase().split(/[-_]/)[0];
  return (PUBLIC_ROUTE_LOCALES as readonly string[]).includes(short) ? (short as PublicRouteLocale) : 'tr';
}

/** Mantıksal yol (`/kahve-fali/result/:id`, `/burclar/aries`) → locale slug'lı yol (önek hariç). */
export function toLocalizedPublicPath(locale: PublicRouteLocale, pathname: string): string {
  const parts = String(pathname || '/').split(/[?#]/, 1)[0].split('/').filter(Boolean);
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
