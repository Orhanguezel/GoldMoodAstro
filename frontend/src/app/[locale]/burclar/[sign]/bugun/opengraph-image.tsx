import { ImageResponse } from 'next/og';
import { getOgFonts } from '@/lib/fonts/og-fonts';
import { getOgTheme } from '@/seo/ogTheme';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const SIGN_SYMBOLS: Record<string, string> = {
  aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋',
  leo: '♌', virgo: '♍', libra: '♎', scorpio: '♏',
  sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓',
};

const SIGN_LABELS: Record<string, Record<string, string>> = {
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

/** Baslik kalibi dile gore degisir: "Koç Burcu" / "Aries Zodiac" / "Sternzeichen Widder". */
const TITLE: Record<string, (label: string) => string> = {
  en: (l) => `${l} Zodiac`,
  tr: (l) => `${l} Burcu`,
  de: (l) => `Sternzeichen ${l}`,
};

const EYEBROW: Record<string, string> = {
  en: 'DAILY READING',
  tr: 'GÜNLÜK YORUM',
  de: 'TAGESHOROSKOP',
};

const DATE_LOCALE: Record<string, string> = { en: 'en-US', tr: 'tr-TR', de: 'de-DE' };

export default async function OG({ params }: { params: Promise<{ sign: string; locale: string }> }) {
  const { sign: signParam, locale: localeParam } = await params;
  const sign = (signParam ?? '').toLowerCase();
  const locale = SIGN_LABELS[localeParam ?? ''] ? (localeParam as string) : 'tr';
  const symbol = SIGN_SYMBOLS[sign] || '✨';
  const label = SIGN_LABELS[locale][sign] || sign;
  const today = new Date().toLocaleDateString(DATE_LOCALE[locale], { day: 'numeric', month: 'long', year: 'numeric' });

  const fonts = await getOgFonts().catch(() => undefined);
  const theme = await getOgTheme();

  return new ImageResponse(
    (
      <div style={{
        width: 1200, height: 630,
        background: theme.bg,
        color: theme.text,
        padding: 80,
        fontFamily: 'Cinzel',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* Header */}
        <div style={{ fontSize: 24, color: theme.primary, letterSpacing: 4, width: '100%', textAlign: 'center' }}>
          {`${theme.brandUpper} · ${EYEBROW[locale]}`}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
          {/* Symbol */}
          <div style={{ 
            fontSize: 180, 
            color: theme.primary, 
            lineHeight: 1,
            width: 240,
            height: 240,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: theme.primarySoft,
            border: `2px solid ${theme.primaryBorder}`
          }}>
            {symbol}
          </div>

          {/* Label & Date */}
          <div style={{ fontSize: 64, fontFamily: 'Fraunces', fontStyle: 'italic', color: theme.text }}>
            {TITLE[locale](label)}
          </div>
          <div style={{ fontSize: 32, color: theme.primary, letterSpacing: 2 }}>
            {today}
          </div>
        </div>

        {/* Footer */}
        <div style={{ fontSize: 24, color: theme.primary, display: 'flex', justifyContent: 'center', width: '100%' }}>
          <span style={{ fontFamily: 'Fraunces', fontStyle: 'italic', opacity: 0.8 }}>{theme.domain}</span>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
