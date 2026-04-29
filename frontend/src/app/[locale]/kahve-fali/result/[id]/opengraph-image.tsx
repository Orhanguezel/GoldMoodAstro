import { ImageResponse } from 'next/og';
import { getOgFonts } from '@/lib/fonts/og-fonts';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'GoldMoodAstro Kahve Falı';

export default async function OG({ params }: { params: { id: string; locale: string } }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://goldmoodastro.com/api';
  let data;
  try {
    const res = await fetch(`${apiUrl}/coffee/reading/${params.id}`);
    if (!res.ok) throw new Error('API Error');
    const json = await res.json();
    data = json.data;
  } catch (e) {
    data = { symbols: [], interpretation: 'Fincanınızdaki sırlar...' };
  }

  const fonts = await getOgFonts().catch(() => undefined);
  
  const displaySymbols = data.symbols.slice(0, 5); // Max 5 symbols
  const summary = data.interpretation.split('. ')[0] + '.';

  return new ImageResponse(
    (
      <div style={{
        width: 1200, height: 630,
        background: 'linear-gradient(135deg,#2A2620 0%,#3D2E47 60%,#1A1715 100%)',
        color: '#FAF6EF',
        padding: 80,
        fontFamily: 'Cinzel',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* Header */}
        <div style={{ fontSize: 24, color: '#C9A961', letterSpacing: 4, width: '100%', textAlign: 'center' }}>
          GOLDMOODASTRO · KAHVE FALI
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, alignItems: 'center', width: '100%' }}>
          {/* Symbols */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', maxWidth: 900 }}>
            {displaySymbols.map((s: any, i: number) => (
              <div key={i} style={{ 
                padding: '16px 32px', 
                border: '2px solid #C9A961', 
                borderRadius: 40, 
                color: '#C9A961', 
                fontSize: 32,
                textTransform: 'uppercase',
                backgroundColor: 'rgba(201,169,97,0.1)'
              }}>
                {s.name}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={{ fontSize: 36, fontFamily: 'Fraunces', fontStyle: 'italic', color: '#FAF6EF', textAlign: 'center', maxWidth: 1000, lineHeight: 1.4 }}>
            "{summary.length > 120 ? summary.substring(0, 120) + '...' : summary}"
          </div>
        </div>

        {/* Footer */}
        <div style={{ fontSize: 24, color: '#C9A961', display: 'flex', justifyContent: 'center', width: '100%' }}>
          <span style={{ fontFamily: 'Fraunces', fontStyle: 'italic', opacity: 0.8 }}>goldmoodastro.com</span>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
