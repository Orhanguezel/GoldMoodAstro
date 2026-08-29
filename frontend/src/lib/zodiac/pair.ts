/**
 * Burc slug normalizasyonu + "aries-libra" / "koc-terazi" cifti cozumleme.
 *
 * Takma adların tek kaynağı localizedRoutes.ts'tir; proxy, sayfa ve OG aynı
 * normalizasyonu kullanır.
 */
import { normalizeZodiacSignToken } from '@/i18n/localizedRoutes';

/** Dil -> burc anahtari -> etiket. Turkce sayfada Ingilizce etiket gostermek icin degil. */
export const SIGN_LABELS: Record<string, Record<string, string>> = {
  en: {
    aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer',
    leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio',
    sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces',
  },
  tr: {
    aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
    leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
    sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık',
  },
  de: {
    aries: 'Widder', taurus: 'Stier', gemini: 'Zwillinge', cancer: 'Krebs',
    leo: 'Löwe', virgo: 'Jungfrau', libra: 'Waage', scorpio: 'Skorpion',
    sagittarius: 'Schütze', capricorn: 'Steinbock', aquarius: 'Wassermann', pisces: 'Fische',
  },
};

export const SIGN_SYMBOLS: Record<string, string> = {
  aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋',
  leo: '♌', virgo: '♍', libra: '♎', scorpio: '♏',
  sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓',
};

export function normalizeSign(token: string | undefined): string | null {
  return normalizeZodiacSignToken(token);
}

export function parsePair(pair: string | undefined): { signA: string; signB: string } | null {
  if (!pair) return null;
  const parts = pair.split('-');
  if (parts.length !== 2) return null;
  const a = normalizeSign(parts[0]);
  const b = normalizeSign(parts[1]);
  if (!a || !b) return null;
  return { signA: a, signB: b };
}
