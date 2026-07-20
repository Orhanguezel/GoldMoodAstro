/**
 * Ucretsiz arac (hub) sayfalari icin paylasilan OG gorseli.
 *
 * Neden: /tarot, /kahve-fali gibi hub sayfalarinin OG route'u yoktu; sadece
 * sonuc sayfalarinda (result/[id]) vardi. Link paylasiminda onizleme cikmiyor,
 * ayrica sosyal medya otomasyonu Instagram'a gorselsiz gonderi basamiyordu
 * (IG gorselsiz yayin kabul etmez).
 *
 * Desen big-three/opengraph-image.tsx'ten alindi; tema DB'deki design_tokens'tan.
 */
import { ImageResponse } from 'next/og';
import { getOgFonts } from '@/lib/fonts/og-fonts';
import { getOgTheme } from '@/seo/ogTheme';

export const toolOgSize = { width: 1200, height: 630 };

export type ToolOgParams = {
  /** Ust satir, orn. "UCRETSIZ TAROT" */
  eyebrow: string;
  /** Merkezdeki buyuk sembol/emoji */
  symbol: string;
  /** Ana baslik */
  title: string;
  /** Alt aciklama — kisa tut, 2 satiri gecmesin */
  subtitle?: string;
};

export async function createToolOgImage({ eyebrow, symbol, title, subtitle }: ToolOgParams) {
  const fonts = await getOgFonts().catch(() => undefined);
  const theme = await getOgTheme();

  return new ImageResponse(
    (
      <div
        style={{
          width: toolOgSize.width,
          height: toolOgSize.height,
          background: theme.bg,
          color: theme.text,
          padding: 80,
          fontFamily: 'Cinzel',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 24, color: theme.primary, letterSpacing: 4, width: '100%', textAlign: 'center' }}>
          {`${theme.brandUpper} · ${eyebrow}`}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
          <div
            style={{
              fontSize: 150,
              lineHeight: 1,
              width: 220,
              height: 220,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: theme.primarySoft,
              border: `2px solid ${theme.primaryBorder}`,
            }}
          >
            {symbol}
          </div>

          <div
            style={{
              fontSize: 60,
              fontFamily: 'Fraunces',
              fontStyle: 'italic',
              color: theme.text,
              textAlign: 'center',
            }}
          >
            {title}
          </div>

          {subtitle ? (
            <div style={{ fontSize: 30, color: theme.primary, textAlign: 'center', opacity: 0.9, maxWidth: 900 }}>
              {subtitle}
            </div>
          ) : null}
        </div>

        <div style={{ fontSize: 24, color: theme.primary, display: 'flex', justifyContent: 'center', width: '100%' }}>
          <span style={{ fontFamily: 'Fraunces', fontStyle: 'italic', opacity: 0.8 }}>{theme.domain}</span>
        </div>
      </div>
    ),
    { ...toolOgSize, fonts },
  );
}
