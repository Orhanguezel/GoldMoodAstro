import { ImageResponse } from 'next/og';
import { getOgFonts } from '@/lib/fonts/og-fonts';
import { getOgTheme } from '@/seo/ogTheme';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OG() {
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
          {`${theme.brandUpper} · BIG THREE`}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, alignItems: 'center' }}>
          {/* Symbols */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 60 }}>
            <div style={{ fontSize: 100, color: theme.primary, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               ☀️
               <span style={{ fontSize: 24, fontFamily: 'Inter', opacity: 0.8, marginTop: 10 }}>SUN</span>
            </div>
            <div style={{ fontSize: 140, color: theme.text, display: 'flex', flexDirection: 'column', alignItems: 'center', border: `2px solid ${theme.primaryBorder}`, borderRadius: '50%', padding: '20px 40px', backgroundColor: theme.primarySoft }}>
               🌅
               <span style={{ fontSize: 32, fontFamily: 'Inter', opacity: 0.8, marginTop: 10, color: theme.primary }}>RISING</span>
            </div>
            <div style={{ fontSize: 100, color: theme.primary, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               🌙
               <span style={{ fontSize: 24, fontFamily: 'Inter', opacity: 0.8, marginTop: 10 }}>AY</span>
            </div>
          </div>

          <div style={{ fontSize: 56, fontFamily: 'Fraunces', fontStyle: 'italic', color: theme.text, textAlign: 'center', marginTop: 20 }}>
            Discover Your Cosmic Identity
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
