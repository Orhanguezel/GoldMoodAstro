import { ImageResponse } from 'next/og';
import { getOgFonts } from '@/lib/fonts/og-fonts';
import { getOgTheme } from '@/seo/ogTheme';

import brand from '../../../../../../../config/brand.json';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = `${brand.name} Tarot`;

export default async function OG({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? `${brand.public_url}/api`;
  let data;
  try {
    const res = await fetch(`${apiUrl}/tarot/reading/${id}`);
    if (!res.ok) throw new Error('API Error');
    const json = await res.json();
    data = json.data;
  } catch (e) {
    data = { cards: [], spread_type: 'Tarot Spread', question: '' };
  }

  const fonts = await getOgFonts().catch(() => undefined);
  const theme = await getOgTheme();
  
  // Format spread type
  let spreadLabel = 'Tarot Spread';
  if (data.spread_type === 'one_card') spreadLabel = 'One Card Spread';
  if (data.spread_type === 'three_card_general') spreadLabel = 'Three Card General Spread';
  if (data.spread_type === 'three_card_decision') spreadLabel = 'Decision Spread';
  if (data.spread_type === 'celtic_cross') spreadLabel = 'Celtic Cross Spread';

  const displayCards = data.cards.slice(0, 3); // Max 3 cards for preview

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
          {`${brand.name.toUpperCase()} · TAROT`}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 30, alignItems: 'center', width: '100%' }}>
          {/* Spread Type */}
          <div style={{ fontSize: 48, fontFamily: 'Fraunces', fontStyle: 'italic', color: theme.text }}>
            {spreadLabel}
          </div>

          {/* Cards Representation */}
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
            {displayCards.map((c: any, i: number) => (
              <div key={i} style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '12px 24px', 
                border: `2px solid ${theme.primary}`, 
                borderRadius: 16, 
                backgroundColor: theme.primarySoft,
                color: theme.primary, 
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
                border: `2px solid ${theme.primaryBorderStrong}`, 
                borderRadius: 16, 
                color: theme.primary, 
                fontSize: 24,
              }}>
                +{data.cards.length - 3}
              </div>
            )}
          </div>
          
          {data.question && (
             <div style={{ fontSize: 28, color: theme.text, opacity: 0.8, textAlign: 'center', maxWidth: 900 }}>
               "{data.question}"
             </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ fontSize: 24, color: theme.primary, display: 'flex', justifyContent: 'center', width: '100%' }}>
          <span style={{ fontFamily: 'Fraunces', fontStyle: 'italic', opacity: 0.8 }}>{brand.domain}</span>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
