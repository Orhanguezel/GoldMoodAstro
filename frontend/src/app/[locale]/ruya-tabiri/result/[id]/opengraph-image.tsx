import { ImageResponse } from 'next/og';
import { getOgFonts } from '@/lib/fonts/og-fonts';
import { getOgTheme } from '@/seo/ogTheme';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'GoldMoodAstro Dream Interpretation';

export default async function OG({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://goldmoodastro.com/api';
  let data;
  try {
    const res = await fetch(`${apiUrl}/dreams/reading/${id}`);
    if (!res.ok) throw new Error('API Error');
    const json = await res.json();
    data = json.data;
  } catch (e) {
    data = { symbols: [], interpretation: 'Secrets of the subconscious...' };
  }

  const fonts = await getOgFonts().catch(() => undefined);
  const theme = await getOgTheme();
  
  const displaySymbols = data.symbols.slice(0, 4); // Max 4 symbols for grid
  const summary = data.interpretation.split('. ')[0] + '.';

  return new ImageResponse(
    (
      <div style={{
        width: 1200, height: 630,
        background: theme.bg,
        color: theme.text,
        padding: 60,
        fontFamily: 'Cinzel',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* Header */}
        <div style={{ fontSize: 24, color: theme.primary, letterSpacing: 4, width: '100%', textAlign: 'center' }}>
          {`${theme.brandUpper} · DREAM INTERPRETATION`}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 30, alignItems: 'center', width: '100%', flex: 1, justifyContent: 'center' }}>
          {/* Summary/Excerpt */}
          <div style={{ fontSize: 32, fontFamily: 'Fraunces', fontStyle: 'italic', color: theme.text, textAlign: 'center', maxWidth: 1000, lineHeight: 1.4, marginBottom: 20 }}>
            "{summary.length > 150 ? summary.substring(0, 150) + '...' : summary}"
          </div>

          {/* Symbols Grid */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', maxWidth: 1000 }}>
            {displaySymbols.map((s: any, i: number) => (
              <div key={i} style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px', 
                border: `2px solid ${theme.primaryBorderStrong}`, 
                borderRadius: 24, 
                backgroundColor: theme.primarySoft,
                minWidth: 220,
              }}>
                <div style={{ color: theme.primary, fontSize: 28, textTransform: 'uppercase', marginBottom: 8 }}>
                  {s.name}
                </div>
                <div style={{ color: theme.text, fontSize: 16, fontFamily: 'Inter', opacity: 0.8 }}>
                  %{Math.round((s.confidence || 0.9) * 100)} Confidence
                </div>
              </div>
            ))}
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
