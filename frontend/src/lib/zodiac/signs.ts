import type { ZodiacSign } from '@/types/common';

export type ZodiacElement = 'Ateş' | 'Toprak' | 'Hava' | 'Su';
export type ZodiacModality = 'Öncü' | 'Sabit' | 'Değişken';
export type ZodiacPolarity = 'Yang' | 'Yin';

export type ZodiacSignMeta = {
  key: ZodiacSign;
  label: string;
  date: string;
  symbol: string;
  element: ZodiacElement;
  modality: ZodiacModality;
  polarity: ZodiacPolarity;
  ruler: string;
  accent: string;
  image: string;
};

export const ZODIAC_SIGNS: ZodiacSignMeta[] = [
  { key: 'aries', label: 'Koç', date: '21 Mart - 19 Nisan', symbol: '♈', element: 'Ateş', modality: 'Öncü', polarity: 'Yang', ruler: 'Mars', accent: '#E55B4D', image: '/uploads/zodiac/aries.png' },
  { key: 'taurus', label: 'Boğa', date: '20 Nisan - 20 Mayıs', symbol: '♉', element: 'Toprak', modality: 'Sabit', polarity: 'Yin', ruler: 'Venüs', accent: '#8AA35B', image: '/uploads/zodiac/taurus.png' },
  { key: 'gemini', label: 'İkizler', date: '21 Mayıs - 20 Haziran', symbol: '♊', element: 'Hava', modality: 'Değişken', polarity: 'Yang', ruler: 'Merkür', accent: '#D4AF37', image: '/uploads/zodiac/gemini.png' },
  { key: 'cancer', label: 'Yengeç', date: '21 Haziran - 22 Temmuz', symbol: '♋', element: 'Su', modality: 'Öncü', polarity: 'Yin', ruler: 'Ay', accent: '#6FA8C9', image: '/uploads/zodiac/cancer.png' },
  { key: 'leo', label: 'Aslan', date: '23 Temmuz - 22 Ağustos', symbol: '♌', element: 'Ateş', modality: 'Sabit', polarity: 'Yang', ruler: 'Güneş', accent: '#F0A030', image: '/uploads/zodiac/leo.png' },
  { key: 'virgo', label: 'Başak', date: '23 Ağustos - 22 Eylül', symbol: '♍', element: 'Toprak', modality: 'Değişken', polarity: 'Yin', ruler: 'Merkür', accent: '#9BA66A', image: '/uploads/zodiac/virgo.png' },
  { key: 'libra', label: 'Terazi', date: '23 Eylül - 22 Ekim', symbol: '♎', element: 'Hava', modality: 'Öncü', polarity: 'Yang', ruler: 'Venüs', accent: '#D7A6C8', image: '/uploads/zodiac/libra.png' },
  { key: 'scorpio', label: 'Akrep', date: '23 Ekim - 21 Kasım', symbol: '♏', element: 'Su', modality: 'Sabit', polarity: 'Yin', ruler: 'Mars / Plüton', accent: '#8F3F5E', image: '/uploads/zodiac/scorpio.png' },
  { key: 'sagittarius', label: 'Yay', date: '22 Kasım - 21 Aralık', symbol: '♐', element: 'Ateş', modality: 'Değişken', polarity: 'Yang', ruler: 'Jüpiter', accent: '#C27A3A', image: '/uploads/zodiac/sagittarius.png' },
  { key: 'capricorn', label: 'Oğlak', date: '22 Aralık - 19 Ocak', symbol: '♑', element: 'Toprak', modality: 'Öncü', polarity: 'Yin', ruler: 'Satürn', accent: '#7D8A78', image: '/uploads/zodiac/capricorn.png' },
  { key: 'aquarius', label: 'Kova', date: '20 Ocak - 18 Şubat', symbol: '♒', element: 'Hava', modality: 'Sabit', polarity: 'Yang', ruler: 'Satürn / Uranüs', accent: '#5B9BD5', image: '/uploads/zodiac/aquarius.png' },
  { key: 'pisces', label: 'Balık', date: '19 Şubat - 20 Mart', symbol: '♓', element: 'Su', modality: 'Değişken', polarity: 'Yin', ruler: 'Jüpiter / Neptün', accent: '#7B8ED8', image: '/uploads/zodiac/pisces.png' },
];

export const ZODIAC_META = Object.fromEntries(
  ZODIAC_SIGNS.map((sign) => [sign.key, sign]),
) as Record<ZodiacSign, ZodiacSignMeta>;

export const ZODIAC_LABELS = Object.fromEntries(
  ZODIAC_SIGNS.map((sign) => [sign.key, sign.label]),
) as Record<ZodiacSign, string>;

export function getZodiacMeta(sign: string | undefined): ZodiacSignMeta | null {
  if (!sign || !(sign in ZODIAC_META)) return null;
  return ZODIAC_META[sign as ZodiacSign];
}

// ── i18n: signs.ts sabitleri TR kanonik; en/de gösterim çevirileri ───────────
// element/modality hem mantık anahtarı hem gösterim → key TR kalır, gösterimde çevrilir.
type EnDe = { en: string; de: string };

const SIGN_I18N: Record<ZodiacSign, { label: EnDe; date: EnDe }> = {
  aries: { label: { en: 'Aries', de: 'Widder' }, date: { en: '21 March - 19 April', de: '21. März - 19. April' } },
  taurus: { label: { en: 'Taurus', de: 'Stier' }, date: { en: '20 April - 20 May', de: '20. April - 20. Mai' } },
  gemini: { label: { en: 'Gemini', de: 'Zwillinge' }, date: { en: '21 May - 20 June', de: '21. Mai - 20. Juni' } },
  cancer: { label: { en: 'Cancer', de: 'Krebs' }, date: { en: '21 June - 22 July', de: '21. Juni - 22. Juli' } },
  leo: { label: { en: 'Leo', de: 'Löwe' }, date: { en: '23 July - 22 August', de: '23. Juli - 22. August' } },
  virgo: { label: { en: 'Virgo', de: 'Jungfrau' }, date: { en: '23 August - 22 September', de: '23. August - 22. September' } },
  libra: { label: { en: 'Libra', de: 'Waage' }, date: { en: '23 September - 22 October', de: '23. September - 22. Oktober' } },
  scorpio: { label: { en: 'Scorpio', de: 'Skorpion' }, date: { en: '23 October - 21 November', de: '23. Oktober - 21. November' } },
  sagittarius: { label: { en: 'Sagittarius', de: 'Schütze' }, date: { en: '22 November - 21 December', de: '22. November - 21. Dezember' } },
  capricorn: { label: { en: 'Capricorn', de: 'Steinbock' }, date: { en: '22 December - 19 January', de: '22. Dezember - 19. Januar' } },
  aquarius: { label: { en: 'Aquarius', de: 'Wassermann' }, date: { en: '20 January - 18 February', de: '20. Januar - 18. Februar' } },
  pisces: { label: { en: 'Pisces', de: 'Fische' }, date: { en: '19 February - 20 March', de: '19. Februar - 20. März' } },
};

const ELEMENT_I18N: Record<ZodiacElement, EnDe> = {
  'Ateş': { en: 'Fire', de: 'Feuer' },
  'Toprak': { en: 'Earth', de: 'Erde' },
  'Hava': { en: 'Air', de: 'Luft' },
  'Su': { en: 'Water', de: 'Wasser' },
};

const MODALITY_I18N: Record<ZodiacModality, EnDe> = {
  'Öncü': { en: 'Cardinal', de: 'Kardinal' },
  'Sabit': { en: 'Fixed', de: 'Fix' },
  'Değişken': { en: 'Mutable', de: 'Veränderlich' },
};

const POLARITY_I18N: Record<ZodiacPolarity, EnDe> = {
  'Yang': { en: 'Yang', de: 'Yang' },
  'Yin': { en: 'Yin', de: 'Yin' },
};

const RULER_I18N: Record<string, EnDe> = {
  'Merkür': { en: 'Mercury', de: 'Merkur' },
  'Venüs': { en: 'Venus', de: 'Venus' },
  'Mars': { en: 'Mars', de: 'Mars' },
  'Ay': { en: 'Moon', de: 'Mond' },
  'Güneş': { en: 'Sun', de: 'Sonne' },
  'Jüpiter': { en: 'Jupiter', de: 'Jupiter' },
  'Satürn': { en: 'Saturn', de: 'Saturn' },
  'Plüton': { en: 'Pluto', de: 'Pluto' },
  'Uranüs': { en: 'Uranus', de: 'Uranus' },
  'Neptün': { en: 'Neptune', de: 'Neptun' },
  'Mars / Plüton': { en: 'Mars / Pluto', de: 'Mars / Pluto' },
  'Satürn / Uranüs': { en: 'Saturn / Uranus', de: 'Saturn / Uranus' },
  'Jüpiter / Neptün': { en: 'Jupiter / Neptune', de: 'Jupiter / Neptun' },
};

export type LocalizedSign = {
  label: string;
  date: string;
  element: string;
  modality: string;
  polarity: string;
  ruler: string;
};

/** ZodiacSignMeta'nın gösterim alanlarını locale'e göre döndürür (tr fallback). */
export function localizeSign(meta: ZodiacSignMeta, locale?: string): LocalizedSign {
  const l = String(locale ?? 'tr').toLowerCase().split(/[-_]/)[0];
  if (l !== 'en' && l !== 'de') {
    return {
      label: meta.label,
      date: meta.date,
      element: meta.element,
      modality: meta.modality,
      polarity: meta.polarity,
      ruler: meta.ruler,
    };
  }
  const s = SIGN_I18N[meta.key];
  return {
    label: s?.label[l] ?? meta.label,
    date: s?.date[l] ?? meta.date,
    element: ELEMENT_I18N[meta.element]?.[l] ?? meta.element,
    modality: MODALITY_I18N[meta.modality]?.[l] ?? meta.modality,
    polarity: POLARITY_I18N[meta.polarity]?.[l] ?? meta.polarity,
    ruler: RULER_I18N[meta.ruler]?.[l] ?? meta.ruler,
  };
}
