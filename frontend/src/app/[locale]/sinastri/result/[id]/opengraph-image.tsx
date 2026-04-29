import { ImageResponse } from 'next/og';
import { getOgFonts } from '@/lib/fonts/og-fonts';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'GoldMoodAstro Sinastri';

export default async function OG({ params }: { params: { id: string; locale: string } }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://goldmoodastro.com/api';
  let data;
  try {
    const res = await fetch(`${apiUrl}/synastry/reading/${params.id}`);
    if (!res.ok) throw new Error('API Error');
    const json = await res.json();
    data = json.data;
  } catch (e) {
    data = { result: { score: 0 }, partner_data: { name: 'Partner' } };
  }

  const fonts = await getOgFonts().catch(() => undefined);

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
      }}>
        {/* Header */}
        <div style={{ fontSize: 28, color: '#C9A961', letterSpacing: 4 }}>
          GOLDMOODASTRO · SİNASTRİ
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
            <span style={{ fontSize: 180, fontWeight: 'bold', color: '#C9A961' }}>{data.result?.score ?? 0}</span>
            <span style={{ fontSize: 32, color: '#FAF6EF' }}>/ 100 uyum</span>
          </div>

          {/* Subtitle */}
          <div style={{ fontSize: 42, fontFamily: 'Fraunces', fontStyle: 'italic', color: '#FAF6EF' }}>
            Sen × {data.partner_data?.name ?? 'Partner'}
          </div>
        </div>

        {/* Footer */}
        <div style={{ fontSize: 24, color: '#C9A961', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Kendi raporunu oluştur</span>
          <span style={{ fontFamily: 'Fraunces', fontStyle: 'italic', opacity: 0.8 }}>goldmoodastro.com</span>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
