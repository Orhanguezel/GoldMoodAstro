import { ImageResponse } from 'next/og';
import { getOgFonts } from '@/lib/fonts/og-fonts';
import { getOgTheme } from '@/seo/ogTheme';
import { SIGN_LABELS, SIGN_SYMBOLS, parsePair } from '@/lib/zodiac/pair';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const SCORE_LABEL: Record<string, string> = {
  en: 'Love Compatibility',
  tr: 'Aşk Uyumu',
  de: 'Liebeskompatibilität',
};

const EYEBROW: Record<string, string> = {
  en: 'ZODIAC COMPATIBILITY',
  tr: 'BURÇ UYUMU',
  de: 'STERNZEICHEN-KOMPATIBILITÄT',
};

export default async function OG({ params }: { params: Promise<{ pair: string; locale: string }> }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://goldmoodastro.com/api';
  // Route segmenti [pair] ("aries-libra" veya "koc-terazi") — signA/signB diye bir param YOK.
  const { pair, locale: localeParam } = await params;
  const parsed = parsePair(pair);
  const signA = parsed?.signA ?? '';
  const signB = parsed?.signB ?? '';
  const locale = EYEBROW[localeParam ?? ''] ? (localeParam as string) : 'tr';

  // DB'den oku (compatibility_readings). Eskiden /synastry/quick cagriliyordu — o bir LLM
  // cagrisi; her sosyal crawler istegi para harciyor ve gorseli yavaslatiyordu.
  let score = 0;
  try {
    const res = await fetch(`${apiUrl}/horoscopes/compatibility?signA=${signA}&signB=${signB}&locale=${locale}`);
    if (res.ok) {
      const json = await res.json();
      score = json.data?.love_score || 0;
    }
  } catch {
    // Skor yoksa gorsel skorsuz cizilir — hata degil.
  }

  const symbolA = SIGN_SYMBOLS[signA] || '✨';
  const symbolB = SIGN_SYMBOLS[signB] || '✨';
  const labelA = SIGN_LABELS[locale]?.[signA] || SIGN_LABELS.en[signA] || signA;
  const labelB = SIGN_LABELS[locale]?.[signB] || SIGN_LABELS.en[signB] || signB;

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 30, alignItems: 'center' }}>
          {/* Symbols */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
            <div style={{ fontSize: 120, color: theme.primary, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               {symbolA}
               <span style={{ fontSize: 24, fontFamily: 'Inter', opacity: 0.8, marginTop: 10 }}>{labelA}</span>
            </div>
            <div style={{ fontSize: 80, color: theme.text, opacity: 0.5 }}>+</div>
            <div style={{ fontSize: 120, color: theme.primary, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               {symbolB}
               <span style={{ fontSize: 24, fontFamily: 'Inter', opacity: 0.8, marginTop: 10 }}>{labelB}</span>
            </div>
          </div>

          {/* Score */}
          {score > 0 && (
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
               <span style={{ fontSize: 104, fontWeight: 'bold', color: theme.primary, lineHeight: 1 }}>{`%${score}`}</span>
               <span style={{ fontSize: 30, fontFamily: 'Fraunces', fontStyle: 'italic', color: theme.text, opacity: 0.85 }}>{SCORE_LABEL[locale]}</span>
             </div>
          )}
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
