import { ImageResponse } from 'next/og';
import { getOgFonts } from '@/lib/fonts/og-fonts';

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

export default async function OG({ params }: { params: { sign: string; locale: string } }) {
  const sign = params.sign.toLowerCase();
  const symbol = SIGN_SYMBOLS[sign] || '✨';
  const label = SIGN_LABELS[sign] || sign;
  const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

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
          GOLDMOODASTRO · GÜNLÜK YORUM
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
          {/* Symbol */}
          <div style={{ 
            fontSize: 180, 
            color: '#C9A961', 
            lineHeight: 1,
            width: 240,
            height: 240,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: 'rgba(201,169,97,0.1)',
            border: '2px solid rgba(201,169,97,0.3)'
          }}>
            {symbol}
          </div>

          {/* Label & Date */}
          <div style={{ fontSize: 64, fontFamily: 'Fraunces', fontStyle: 'italic', color: '#FAF6EF' }}>
            {label} Burcu
          </div>
          <div style={{ fontSize: 32, color: '#C9A961', letterSpacing: 2 }}>
            {today}
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
