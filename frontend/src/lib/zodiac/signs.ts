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
