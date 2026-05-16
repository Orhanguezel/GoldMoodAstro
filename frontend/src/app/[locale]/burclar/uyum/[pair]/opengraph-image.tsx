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

const SIGN_LABELS: Record<string, string> = {
  aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
  leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
  sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık',
};

export default async function OG({ params }: { params: { signA: string; signB: string; locale: string } }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://goldmoodastro.com/api';
  const signA = params.signA.toLowerCase();
  const signB = params.signB.toLowerCase();
  
  let score = 0;
  try {
    const res = await fetch(`${apiUrl}/synastry/quick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sign_a: signA, sign_b: signB })
    });
    if (res.ok) {
      const json = await res.json();
      score = json.data?.love_score || 0;
    }
  } catch (e) {
    // Ignore fetch errors
  }

  const symbolA = SIGN_SYMBOLS[signA] || '✨';
  const symbolB = SIGN_SYMBOLS[signB] || '✨';
  const labelA = SIGN_LABELS[signA] || signA;
  const labelB = SIGN_LABELS[signB] || signB;

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
          {theme.brandUpper} · BURÇ UYUMU
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
             <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, marginTop: 20 }}>
               <span style={{ fontSize: 140, fontWeight: 'bold', color: theme.primary }}>%{score}</span>
               <span style={{ fontSize: 32, fontFamily: 'Fraunces', fontStyle: 'italic', color: theme.text }}>Aşk Uyumu</span>
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
