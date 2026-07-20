import { ImageResponse } from 'next/og';
import { getOgFonts } from '@/lib/fonts/og-fonts';
import { getOgTheme } from '@/seo/ogTheme';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'GoldMoodAstro Yildizname';

export default async function OG({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://goldmoodastro.com/api';
  let data;
  try {
    const res = await fetch(`${apiUrl}/yildizname/reading/${id}`);
    if (!res.ok) throw new Error('API Error');
    const json = await res.json();
    data = json.data;
  } catch (e) {
    data = { name: 'User', ebced_total: 0, menzil: { name_tr: 'Unknown', name_ar: '' } };
  }

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
          {`${theme.brandUpper} · YILDIZNAME`}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 30, alignItems: 'center' }}>
          {/* Ebced Score */}
          <div style={{ fontSize: 140, fontWeight: 'bold', color: theme.primary, lineHeight: 1 }}>
            {data.ebced_total}
          </div>
          <div style={{ fontSize: 24, letterSpacing: 4, textTransform: 'uppercase', color: theme.text, opacity: 0.8 }}>
            Number for {data.name}
          </div>

          {/* Menzil */}
          <div style={{ fontSize: 56, fontFamily: 'Fraunces', fontStyle: 'italic', color: theme.text, textAlign: 'center' }}>
            Mansion: <span style={{ color: theme.primary }}>{data.menzil?.name_tr}</span>
          </div>
          {data.menzil?.name_ar && (
            <div style={{ fontSize: 32, fontFamily: 'Fraunces', fontStyle: 'italic', opacity: 0.6 }}>
              {data.menzil?.name_ar}
            </div>
          )}
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
