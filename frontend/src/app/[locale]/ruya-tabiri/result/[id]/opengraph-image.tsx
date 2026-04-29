import { ImageResponse } from 'next/og';
import { getOgFonts } from '@/lib/fonts/og-fonts';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'GoldMoodAstro Rüya Tabiri';

export default async function OG({ params }: { params: { id: string; locale: string } }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://goldmoodastro.com/api';
  let data;
  try {
    const res = await fetch(`${apiUrl}/dreams/reading/${params.id}`);
    if (!res.ok) throw new Error('API Error');
    const json = await res.json();
    data = json.data;
  } catch (e) {
    data = { symbols: [], interpretation: 'Bilinçaltının sırları...' };
  }

  const fonts = await getOgFonts().catch(() => undefined);
  
  const displaySymbols = data.symbols.slice(0, 4); // Max 4 symbols for grid
  const summary = data.interpretation.split('. ')[0] + '.';

  return new ImageResponse(
    (
      <div style={{
        width: 1200, height: 630,
        background: 'linear-gradient(135deg,#2A2620 0%,#3D2E47 60%,#1A1715 100%)',
        color: '#FAF6EF',
        padding: 60,
        fontFamily: 'Cinzel',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* Header */}
        <div style={{ fontSize: 24, color: '#9B7EC8', letterSpacing: 4, width: '100%', textAlign: 'center' }}>
          GOLDMOODASTRO · RÜYA TABİRİ
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 30, alignItems: 'center', width: '100%', flex: 1, justifyContent: 'center' }}>
          {/* Summary/Excerpt */}
          <div style={{ fontSize: 32, fontFamily: 'Fraunces', fontStyle: 'italic', color: '#FAF6EF', textAlign: 'center', maxWidth: 1000, lineHeight: 1.4, marginBottom: 20 }}>
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
                border: '2px solid rgba(155,126,200,0.5)', 
                borderRadius: 24, 
                backgroundColor: 'rgba(155,126,200,0.1)',
                minWidth: 220,
              }}>
                <div style={{ color: '#9B7EC8', fontSize: 28, textTransform: 'uppercase', marginBottom: 8 }}>
                  {s.name}
                </div>
                <div style={{ color: '#FAF6EF', fontSize: 16, fontFamily: 'Inter', opacity: 0.8 }}>
                  %{Math.round((s.confidence || 0.9) * 100)} Güven
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ fontSize: 24, color: '#9B7EC8', display: 'flex', justifyContent: 'center', width: '100%' }}>
          <span style={{ fontFamily: 'Fraunces', fontStyle: 'italic', opacity: 0.8 }}>goldmoodastro.com</span>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
