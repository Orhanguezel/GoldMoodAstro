import { ImageResponse } from 'next/og';
import { getOgFonts } from '@/lib/fonts/og-fonts';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OG() {
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
          GOLDMOODASTRO · BÜYÜK ÜÇLÜ
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, alignItems: 'center' }}>
          {/* Symbols */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 60 }}>
            <div style={{ fontSize: 100, color: '#C9A961', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               ☀️
               <span style={{ fontSize: 24, fontFamily: 'Inter', opacity: 0.8, marginTop: 10 }}>GÜNEŞ</span>
            </div>
            <div style={{ fontSize: 140, color: '#FAF6EF', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '2px solid rgba(201,169,97,0.3)', borderRadius: '50%', padding: '20px 40px', backgroundColor: 'rgba(201,169,97,0.1)' }}>
               🌅
               <span style={{ fontSize: 32, fontFamily: 'Inter', opacity: 0.8, marginTop: 10, color: '#C9A961' }}>YÜKSELEN</span>
            </div>
            <div style={{ fontSize: 100, color: '#C9A961', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               🌙
               <span style={{ fontSize: 24, fontFamily: 'Inter', opacity: 0.8, marginTop: 10 }}>AY</span>
            </div>
          </div>

          <div style={{ fontSize: 56, fontFamily: 'Fraunces', fontStyle: 'italic', color: '#FAF6EF', textAlign: 'center', marginTop: 20 }}>
            Kozmik Kimliğini Keşfet
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
