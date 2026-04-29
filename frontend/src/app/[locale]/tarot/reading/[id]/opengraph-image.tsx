import { ImageResponse } from 'next/og';
import { getOgFonts } from '@/lib/fonts/og-fonts';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'GoldMoodAstro Tarot';

export default async function OG({ params }: { params: { id: string; locale: string } }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://goldmoodastro.com/api';
  let data;
  try {
    const res = await fetch(`${apiUrl}/tarot/reading/${params.id}`);
    if (!res.ok) throw new Error('API Error');
    const json = await res.json();
    data = json.data;
  } catch (e) {
    data = { cards: [], spread_type: 'Tarot Açılımı', question: '' };
  }

  const fonts = await getOgFonts().catch(() => undefined);
  
  // Format spread type
  let spreadLabel = 'Tarot Açılımı';
  if (data.spread_type === 'one_card') spreadLabel = 'Tek Kart Açılımı';
  if (data.spread_type === 'three_card_general') spreadLabel = 'Üç Kart (Genel) Açılımı';
  if (data.spread_type === 'three_card_decision') spreadLabel = 'Karar Açılımı';
  if (data.spread_type === 'celtic_cross') spreadLabel = 'Kelt Haçı Açılımı';

  const displayCards = data.cards.slice(0, 3); // Max 3 cards for preview

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
          GOLDMOODASTRO · TAROT
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 30, alignItems: 'center', width: '100%' }}>
          {/* Spread Type */}
          <div style={{ fontSize: 48, fontFamily: 'Fraunces', fontStyle: 'italic', color: '#FAF6EF' }}>
            {spreadLabel}
          </div>

          {/* Cards Representation */}
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
            {displayCards.map((c: any, i: number) => (
              <div key={i} style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '12px 24px', 
                border: '2px solid #C9A961', 
                borderRadius: 16, 
                backgroundColor: 'rgba(201,169,97,0.1)',
                color: '#C9A961', 
                fontSize: 24,
                textTransform: 'uppercase',
                maxWidth: 300,
                textAlign: 'center'
              }}>
                {c.name}
              </div>
            ))}
            {data.cards.length > 3 && (
              <div style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '12px 24px', 
                border: '2px solid rgba(201,169,97,0.5)', 
                borderRadius: 16, 
                color: '#C9A961', 
                fontSize: 24,
              }}>
                +{data.cards.length - 3}
              </div>
            )}
          </div>
          
          {data.question && (
             <div style={{ fontSize: 28, color: '#FAF6EF', opacity: 0.8, textAlign: 'center', maxWidth: 900 }}>
               "{data.question}"
             </div>
          )}
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
