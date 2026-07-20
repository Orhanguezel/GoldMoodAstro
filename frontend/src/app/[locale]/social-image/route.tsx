/**
 * Sosyal medya KARE gorseli (1080x1080) — Instagram akisi icin.
 *
 * NEDEN: opengraph-image route'lari 1200x630 (1.91:1). Facebook ve link onizlemesi
 * icin dogru olcu bu, ama Instagram akisinda yatay gorsel daha kucuk gorunur ve
 * daha az ekran kaplar. IG icin 1:1 tercih edilir.
 *
 * GORSEL KAYNAGI: sitenin kendi zodyak sanat eserleri — /uploads/zodiac/{sign}.png
 * (1024x1024, /tr/burclar sayfasindakilerin aynisi). Onceden duz sembol (♒) ciziliyordu;
 * site tasarimiyla alakasi yoktu ve ucuz duruyordu.
 *
 *   /tr/social-image?type=sign&sign=aries
 *   /tr/social-image?type=pair&pair=aries-libra
 *   /tr/social-image?type=tool&tool=tarot
 *
 * ⚠️ KONUM: [locale] ALTINDA olmali.
 *   - /api altinda OLMAZ: nginx tum /api/ isteklerini Fastify'a (:8094) proxy'liyor
 *     (nginx/goldmoodastro.conf:91) — Next'in /api route'una disaridan erisilemez.
 *   - Kok seviyede (/social-image) OLMAZ: kokteki [locale] dinamik segmenti yutuyor, 404.
 * Dil yol segmentinden gelir; ?locale= ile ezilebilir.
 *
 * Bilinmeyen/eksik parametrede marka gorseline duser (500 vermez) — sosyal
 * otomasyon gorselsiz gonderi uretemez, bu yuzden her zaman bir gorsel doner.
 */
import { ImageResponse } from 'next/og';
import { getOgFonts } from '@/lib/fonts/og-fonts';
import { getOgTheme } from '@/seo/ogTheme';
import { SIGN_LABELS, normalizeSign, parsePair } from '@/lib/zodiac/pair';

// NOT: 'edge' runtime'da bu route handler Next 16'da hic eslesmiyordu (404). nodejs calisiyor.
export const runtime = 'nodejs';

const SIZE = { width: 1080, height: 1080 };
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com';

/** Sitenin /tr/burclar sayfasindaki sanat eserleri. */
const zodiacArt = (sign: string) => `${SITE}/uploads/zodiac/${sign}.png`;
/** Tarot destesi gorselleri (/tr/tarot ile ayni kaynak). */
const tarotArt = (card: string) => `${SITE}/uploads/tarot/${card}.png`;
/** Seri sembolleri — Codex uretiyor (CODEX-GORSEL-URETIM-BRIEF.md). */
const symbolArt = (set: string, slug: string) => `${SITE}/uploads/symbols/${set}/${slug}.png`;
/** Konu hero gorselleri (Faz A, 2026-07-19). Burc resmi yerine KONUYA AIT gorsel. */
const topicArt = (topic: string) => `${SITE}/uploads/topics/${topic}.png`;

const SYMBOL_EYEBROW: Record<string, Record<string, string>> = {
  dream: { tr: 'RÜYA TABİRİ', en: 'DREAM MEANING', de: 'TRAUMDEUTUNG' },
  coffee: { tr: 'KAHVE FALI', en: 'COFFEE READING', de: 'KAFFEESATZLESEN' },
};

/**
 * Varlik gercekten var mi?
 *
 * type=symbol icin KRITIK: gorsel yoksa marka gorseline DUSMEMELI, 404 donmeli.
 * Aksi halde sosyal medya motoru "gorsel var" sanip yanlis resimle gonderi basar.
 * Motor tarafi bu 404'u gorup o gunu atliyor (goldmood-monthly.ts imageExists).
 */
async function assetExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok && (res.headers.get('content-type') ?? '').startsWith('image/');
  } catch {
    return false;
  }
}

const EYEBROW: Record<string, Record<string, string>> = {
  sign: { tr: 'GÜNLÜK YORUM', en: 'DAILY READING', de: 'TAGESHOROSKOP' },
  pair: { tr: 'BURÇ UYUMU', en: 'ZODIAC COMPATIBILITY', de: 'STERNZEICHEN-KOMPATIBILITÄT' },
  tool: { tr: 'ÜCRETSİZ ARAÇ', en: 'FREE TOOL', de: 'KOSTENLOSES TOOL' },
};

/**
 * Her aracin KENDI konusuna ait gorseli var (Faz A, 2026-07-19 — /uploads/topics/).
 * Onceden burc resmi kullaniliyordu (kahve fali -> yengec, sinastri -> terazi); konuyla
 * alakasizdi. `topic` varsa o, yoksa `card` (tarot), yoksa `art` (burc) kullanilir.
 *
 * ⚠️ Tarot kart secimi keyfi degil: /uploads/tarot altindaki 78 gorselin cogu bozuk
 * (kadraj disina tasmis/kesik) veya placeholder. 'queen-of-cups' gozle dogrulanmis.
 * Degistirmeden once gorseli AC ve bak.
 */
const TOOLS: Record<string, { art?: string; card?: string; topic?: string; title: Record<string, string> }> = {
  tarot: { card: 'queen-of-cups', title: { tr: 'Tarot Açılımı', en: 'Tarot Reading', de: 'Tarot-Legung' } },
  'kahve-fali': { topic: 'kahve-fali', title: { tr: 'Kahve Falı', en: 'Coffee Reading', de: 'Kaffeesatzlesen' } },
  'ruya-tabiri': { topic: 'ruya-tabiri', title: { tr: 'Rüya Tabiri', en: 'Dream Meaning', de: 'Traumdeutung' } },
  numeroloji: { topic: 'numeroloji', title: { tr: 'Numeroloji', en: 'Numerology', de: 'Numerologie' } },
  yildizname: { topic: 'yildizname', title: { tr: 'Yıldızname', en: 'Yildizname', de: 'Yildizname' } },
  sinastri: { topic: 'sinastri', title: { tr: 'Sinastri', en: 'Synastry', de: 'Synastrie' } },
  'big-three': { art: 'leo', title: { tr: 'Büyük Üçlü', en: 'Big Three', de: 'Die großen Drei' } },
};

const DATE_LOCALE: Record<string, string> = { tr: 'tr-TR', en: 'en-US', de: 'de-DE' };
const SIGN_TITLE: Record<string, (l: string) => string> = {
  tr: (l) => `${l} Burcu`,
  en: (l) => `${l} Zodiac`,
  de: (l) => `Sternzeichen ${l}`,
};

export async function GET(req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const url = new URL(req.url);
  const type = url.searchParams.get('type') ?? '';
  const { locale: pathLocale } = await params;
  const localeRaw = url.searchParams.get('locale') ?? pathLocale ?? 'tr';
  const locale = ['tr', 'en', 'de'].includes(localeRaw) ? localeRaw : 'tr';

  const fonts = await getOgFonts().catch(() => undefined);
  const theme = await getOgTheme();

  let eyebrow = theme.brandUpper;
  /** Tek gorsel tam kadraj; iki gorsel yan yana (uyum). */
  let art: string[] = [];
  let title = theme.brandName;
  let subtitle = '';

  if (type === 'sign') {
    const sign = normalizeSign(url.searchParams.get('sign') ?? undefined);
    if (sign) {
      eyebrow = EYEBROW.sign[locale];
      art = [zodiacArt(sign)];
      title = SIGN_TITLE[locale](SIGN_LABELS[locale][sign]);
      subtitle = new Date().toLocaleDateString(DATE_LOCALE[locale], {
        day: 'numeric', month: 'long', year: 'numeric',
      });
    }
  } else if (type === 'pair') {
    const parsed = parsePair(url.searchParams.get('pair') ?? undefined);
    if (parsed) {
      eyebrow = EYEBROW.pair[locale];
      art = [zodiacArt(parsed.signA), zodiacArt(parsed.signB)];
      title = `${SIGN_LABELS[locale][parsed.signA]} + ${SIGN_LABELS[locale][parsed.signB]}`;
    }
  } else if (type === 'card') {
    // Carousel karesi: burc gorseli + burc adi + TEK SATIR cevap.
    // Satir motordan `line` parametresiyle gelir (kaynak: astrology_kb kind='carousel_line').
    // Cevabi tasimayan carousel kaydetme degil hayal kirikligi uretir.
    const sign = normalizeSign(url.searchParams.get('sign') ?? undefined);
    const line = (url.searchParams.get('line') ?? '').trim();
    if (sign) {
      eyebrow = (url.searchParams.get('eyebrow') ?? '').trim() || theme.brandUpper;
      art = [zodiacArt(sign)];
      title = SIGN_LABELS[locale][sign];
      subtitle = line;
    }
  } else if (type === 'symbol') {
    const set = url.searchParams.get('set') ?? '';
    const slug = url.searchParams.get('symbol') ?? '';
    const label = url.searchParams.get('label') ?? slug;
    if (!SYMBOL_EYEBROW[set] || !slug) {
      return new Response('bilinmeyen sembol seti', { status: 404 });
    }
    const src = symbolArt(set, slug);
    if (!(await assetExists(src))) {
      // Gorsel henuz uretilmemis — motor bu gunu atlasin diye 404.
      return new Response('sembol gorseli yok', { status: 404 });
    }
    eyebrow = SYMBOL_EYEBROW[set][locale] ?? SYMBOL_EYEBROW[set].tr;
    art = [src];
    title = label;
  } else if (type === 'tool') {
    const tool = TOOLS[url.searchParams.get('tool') ?? ''];
    if (tool) {
      eyebrow = EYEBROW.tool[locale];
      art = [tool.topic ? topicArt(tool.topic) : tool.card ? tarotArt(tool.card) : zodiacArt(tool.art!)];
      title = tool.title[locale] ?? tool.title.tr;
    }
  }

  const single = art.length === 1;

  return new ImageResponse(
    (
      <div
        style={{
          width: SIZE.width,
          height: SIZE.height,
          background: theme.bg,
          display: 'flex',
          position: 'relative',
        }}
      >
        {art.length > 0 ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: SIZE.width,
              height: SIZE.height,
              display: 'flex',
              overflow: 'hidden',
            }}
          >
            {art.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                width={single ? SIZE.width : SIZE.width / 2}
                // Kaynak gorselin ALT SERIDINDE kendi basligi gomulu ("AQUARIUS / THE WATER
                // BEARER"). %18 buyutup ustten hizalayinca o serit kadraj disinda kaliyor,
                // yoksa bizim Turkce basligimizla ust uste biniyor.
                height={Math.round(SIZE.height * 1.18)}
                style={{ objectFit: 'cover', objectPosition: 'center top' }}
                alt=""
              />
            ))}
          </div>
        ) : null}

        {/* Alt gradyan — metnin okunurlugu icin */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: SIZE.width,
            height: 470,
            display: 'flex',
            background:
              'linear-gradient(to bottom, rgba(16,9,32,0) 0%, rgba(16,9,32,0.86) 42%, rgba(16,9,32,0.97) 100%)',
          }}
        />
        {/* Ust gradyan — marka satiri icin */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: SIZE.width,
            height: 190,
            display: 'flex',
            background: 'linear-gradient(to top, rgba(16,9,32,0) 0%, rgba(16,9,32,0.85) 100%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 54,
            left: 0,
            width: SIZE.width,
            display: 'flex',
            justifyContent: 'center',
            fontSize: 29,
            letterSpacing: 5,
            color: theme.primary,
            fontFamily: 'Cinzel',
          }}
        >
          {`${theme.brandUpper} · ${eyebrow}`}
        </div>

        <div
          style={{
            position: 'absolute',
            left: 70,
            right: 70,
            bottom: 78,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              fontSize: title.length > 22 ? 62 : 80,
              fontFamily: 'Fraunces',
              fontStyle: 'italic',
              color: '#FFFFFF',
              textAlign: 'center',
              display: 'flex',
            }}
          >
            {title}
          </div>
          {subtitle ? (
            // Kisa alt satir = tarih (type=sign) → Cinzel, harf araligi genis.
            // Uzun alt satir = carousel cevabi (type=card) → Fraunces, kucuk, SARABILIR.
            // Ayni stil ikisine de uymuyor: 60 karakterlik cumle 36px + letterSpacing ile tasar.
            <div
              style={
                subtitle.length > 24
                  ? {
                      fontSize: 34,
                      lineHeight: 1.35,
                      color: '#F2ECFA',
                      fontFamily: 'Fraunces',
                      fontStyle: 'italic',
                      textAlign: 'center',
                      maxWidth: 880,
                      display: 'block',
                    }
                  : {
                      fontSize: 36,
                      color: theme.primary,
                      letterSpacing: 2,
                      display: 'flex',
                      fontFamily: 'Cinzel',
                    }
              }
            >
              {subtitle}
            </div>
          ) : null}
          <div
            style={{
              fontSize: 27,
              fontFamily: 'Fraunces',
              fontStyle: 'italic',
              color: 'rgba(255,255,255,0.72)',
              display: 'flex',
              marginTop: 6,
            }}
          >
            {theme.domain}
          </div>
        </div>
      </div>
    ),
    { ...SIZE, fonts },
  );
}
