import { ImageResponse } from 'next/og';
import { getOgFonts } from '@/lib/fonts/og-fonts';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'GoldMoodAstro Yıldızname';

export default async function OG({ params }: { params: { id: string; locale: string } }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://goldmoodastro.com/api';
  let data;
  try {
    const res = await fetch(`${apiUrl}/yildizname/reading/${params.id}`);
    if (!res.ok) throw new Error('API Error');
    const json = await res.json();
    data = json.data;
  } catch (e) {
    data = { name: 'Kullanıcı', ebced_total: 0, menzil: { name_tr: 'Bilinmiyor', name_ar: '' } };
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
        alignItems: 'center',
      }}>
        {/* Header */}
        <div style={{ fontSize: 24, color: '#C9A961', letterSpacing: 4, width: '100%', textAlign: 'center' }}>
          GOLDMOODASTRO · YILDIZNAME
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 30, alignItems: 'center' }}>
          {/* Ebced Score */}
          <div style={{ fontSize: 140, fontWeight: 'bold', color: '#C9A961', lineHeight: 1 }}>
            {data.ebced_total}
          </div>
          <div style={{ fontSize: 24, letterSpacing: 4, textTransform: 'uppercase', color: '#FAF6EF', opacity: 0.8 }}>
            {data.name} İçin Sayı
          </div>

          {/* Menzil */}
          <div style={{ fontSize: 56, fontFamily: 'Fraunces', fontStyle: 'italic', color: '#FAF6EF', textAlign: 'center' }}>
            Menzilin: <span style={{ color: '#C9A961' }}>{data.menzil?.name_tr}</span>
          </div>
          {data.menzil?.name_ar && (
            <div style={{ fontSize: 32, fontFamily: 'Fraunces', fontStyle: 'italic', opacity: 0.6 }}>
              {data.menzil?.name_ar}
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
