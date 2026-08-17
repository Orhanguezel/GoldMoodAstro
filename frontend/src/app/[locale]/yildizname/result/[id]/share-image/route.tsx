// =============================================================
// FILE: app/[locale]/yildizname/result/[id]/share-image/route.tsx
//
// Paylaşılabilir yıldızname kartı — Instagram/Facebook/WhatsApp için.
//   ?format=story   → 1080×1920 (hikâye / reels kapağı)
//   ?format=square  → 1080×1080 (gönderi)
//   ?format=og      → 1200×630  (link önizlemesi)
//
// Neden ayrı rota: kart PNG olarak üretilirse kullanıcı indirip doğrudan
// paylaşabiliyor; ekran görüntüsü almak zorunda kalmıyor ve tipografi her
// cihazda aynı çıkıyor. Renkler site temasından (ogTheme) okunur — tema
// değişince kart da değişir, ikinci bir renk tanımı tutulmaz.
//
// Arka plan görseli: /img/share/yildizname-bg.png varsa kullanılır (Gemini ile
// üretilecek görsel oraya konur), yoksa degrade zemin çizilir. Görsel eksikken
// kart yine de düzgün görünür — bilerek zorunlu tutulmadı.
// =============================================================
import { ImageResponse } from 'next/og';
import { getOgFonts } from '@/lib/fonts/og-fonts';
import { getOgTheme } from '@/seo/ogTheme';

export const runtime = 'edge';

const SIZES = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  og: { width: 1200, height: 630 },
} as const;

type FormatKey = keyof typeof SIZES;

interface Reading {
  name?: string;
  ebced_total?: number;
  menzil_no?: number;
  menzil?: { name_tr?: string; name_ar?: string; short_summary?: string };
  interpretation?: string;
}

function pickFormat(value: string | null): FormatKey {
  return value === 'story' || value === 'square' || value === 'og' ? value : 'story';
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; locale: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);
  const format = pickFormat(url.searchParams.get('format'));
  const { width, height } = SIZES[format];
  const isStory = format === 'story';
  const isWide = format === 'og';

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://goldmoodastro.com/api';
  let data: Reading = {};
  try {
    const res = await fetch(`${apiUrl}/yildizname/reading/${encodeURIComponent(id)}`);
    if (res.ok) data = (await res.json())?.data ?? {};
  } catch {
    /* kart yine de basılsın — boş alanlar gizlenir */
  }

  const [fonts, theme] = await Promise.all([getOgFonts().catch(() => undefined), getOgTheme()]);

  const scale = isStory ? 1 : isWide ? 0.62 : 0.86;
  const px = (n: number) => Math.round(n * scale);

  const menzilName = data.menzil?.name_tr || '';
  const summary = (data.menzil?.short_summary || '').trim();

  return new ImageResponse(
    (
      <div
        style={{
          width,
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: theme.bg,
          color: theme.text,
          fontFamily: 'Cinzel',
          padding: px(90),
          position: 'relative',
        }}
      >
        {/* Dekoratif halkalar — düz degradeyi kırar, marka rengiyle */}
        <div
          style={{
            position: 'absolute',
            top: px(-160),
            right: px(-160),
            width: px(620),
            height: px(620),
            borderRadius: '50%',
            border: `${px(2)}px solid ${theme.goldBorder}`,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: px(-220),
            left: px(-180),
            width: px(760),
            height: px(760),
            borderRadius: '50%',
            border: `${px(2)}px solid ${theme.goldSoft}`,
            display: 'flex',
          }}
        />

        {/* Üst şerit */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: px(16),
            fontSize: px(26),
            letterSpacing: px(8),
            color: theme.gold,
          }}
        >
          {`${theme.brandUpper} · YILDIZNAME`}
        </div>

        {/* Orta blok */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: px(28),
            textAlign: 'center',
            maxWidth: width - px(160),
          }}
        >
          {data.name ? (
            <div style={{ fontSize: px(30), letterSpacing: px(6), opacity: 0.75, display: 'flex' }}>
              {String(data.name).toLocaleUpperCase('tr-TR')}
            </div>
          ) : null}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: px(300),
              height: px(300),
              borderRadius: '50%',
              border: `${px(3)}px solid ${theme.goldBorderStrong}`,
              background: theme.goldSoft,
            }}
          >
            <div style={{ fontSize: px(34), letterSpacing: px(5), opacity: 0.7, display: 'flex' }}>
              MENZİL
            </div>
            <div style={{ fontSize: px(150), lineHeight: 1, color: theme.gold, display: 'flex' }}>
              {data.menzil_no ?? '—'}
            </div>
          </div>

          {menzilName ? (
            <div style={{ fontSize: px(66), color: theme.gold, lineHeight: 1.15, display: 'flex' }}>
              {menzilName}
            </div>
          ) : null}

          {data.menzil?.name_ar ? (
            <div
              style={{
                fontSize: px(32),
                fontFamily: 'Fraunces',
                fontStyle: 'italic',
                opacity: 0.6,
                display: 'flex',
              }}
            >
              {data.menzil.name_ar}
            </div>
          ) : null}

          {summary ? (
            <div
              style={{
                fontSize: px(36),
                fontFamily: 'Fraunces',
                fontStyle: 'italic',
                lineHeight: 1.45,
                opacity: 0.9,
                display: 'flex',
                textAlign: 'center',
              }}
            >
              {summary.length > 120 ? `${summary.slice(0, 117)}…` : summary}
            </div>
          ) : null}

          {typeof data.ebced_total === 'number' && data.ebced_total > 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: px(14),
                fontSize: px(28),
                letterSpacing: px(4),
                color: theme.gold,
                border: `${px(1)}px solid ${theme.goldBorder}`,
                borderRadius: px(999),
                padding: `${px(12)}px ${px(30)}px`,
              }}
            >
              {`EBCED ${data.ebced_total}`}
            </div>
          ) : null}
        </div>

        {/* Alt şerit */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: px(10),
          }}
        >
          <div
            style={{
              fontSize: px(30),
              fontFamily: 'Fraunces',
              fontStyle: 'italic',
              color: theme.gold,
              display: 'flex',
            }}
          >
            {theme.domain}
          </div>
          <div style={{ fontSize: px(20), letterSpacing: px(3), opacity: 0.5, display: 'flex' }}>
            KİŞİSEL FARKINDALIK İÇİNDİR
          </div>
        </div>
      </div>
    ),
    { width, height, fonts },
  );
}
