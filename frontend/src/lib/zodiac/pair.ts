/**
 * Burc slug normalizasyonu + "aries-libra" / "koc-terazi" cifti cozumleme.
 *
 * Ayni mantik burclar/uyum/[pair]/page.tsx icinde de var (modul-yerel).
 * Burasi OG route'u gibi sayfa disi tuketiciler icin dısa acik surumu.
 */

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

// DIKKAT: SIGN_LABELS dil->burc seklinde ic ice; Object.keys(SIGN_LABELS) dilleri verir, burclari degil.
// Gecerli burc anahtarlarinin kaynagi SIGN_SYMBOLS (duz harita).
const VALID_SIGNS = new Set(Object.keys(SIGN_SYMBOLS));

/** Turkce slug -> Ingilizce anahtar. URL hem /uyum/aries-libra hem /uyum/koc-terazi kabul eder. */
const TR_TO_EN: Record<string, string> = {
  koc: 'aries', 'koç': 'aries',
  boga: 'taurus', 'boğa': 'taurus',
  ikizler: 'gemini',
  yengec: 'cancer', 'yengeç': 'cancer',
  aslan: 'leo',
  basak: 'virgo', 'başak': 'virgo',
  terazi: 'libra',
  akrep: 'scorpio',
  yay: 'sagittarius',
  oglak: 'capricorn', 'oğlak': 'capricorn',
  kova: 'aquarius',
  balik: 'pisces', 'balık': 'pisces',
};

export function normalizeSign(token: string | undefined): string | null {
  if (!token) return null;
  const lower = token.trim().toLowerCase();
  if (VALID_SIGNS.has(lower)) return lower;
  return TR_TO_EN[lower] ?? null;
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
