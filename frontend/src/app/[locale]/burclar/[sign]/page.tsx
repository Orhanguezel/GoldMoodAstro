import ZodiacDetail from '@/components/containers/zodiac/ZodiacDetail';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/seo/JsonLd';
import { articleSchema, breadcrumbSchema, faqSchema, graph } from '@/seo/jsonld';
import { buildPageMetadata } from '@/seo/server';

export const revalidate = 86400; // 24 hours

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8094/api').replace(/\/$/, '');
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');

const VALID_SIGNS = new Set([
  'aries','taurus','gemini','cancer','leo','virgo','libra','scorpio',
  'sagittarius','capricorn','aquarius','pisces'
]);

type Props = {
  params: Promise<{ sign: string; locale: string }>;
};

type ZodiacPageInfo = {
  title: string;
  short_summary: string;
  content: string;
  sections: Array<{
    id: string;
    key2: string;
    title: string;
    content: string;
  }>;
};

const labels: Record<string, string> = {
  aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
  leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
  sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık'
};

function buildFallbackInfo(sign: string, label: string): ZodiacPageInfo {
  return {
    title: `${label} Burcu Özellikleri`,
    short_summary: `${label} burcu; karakter, ilişki, kariyer ve ruhsal bakım alanlarında kendine özgü motivasyonlar taşıyan güçlü bir astrolojik arketiptir.`,
    content: `${label} burcu profili, kişinin güneş burcu üzerinden temel yaşam motivasyonlarını, ilişki kurma biçimini, karar alma tarzını ve gündelik enerji ritmini anlamaya yardımcı olur. Bu yorum tek başına kesin bir kişilik tanımı değildir; yükselen burç, Ay burcu, Venüs, Mars ve doğum haritasındaki ev yerleşimleriyle birlikte okunduğunda daha derin ve kişisel hale gelir.`,
    sections: [
      {
        id: `${sign}-personality-fallback`,
        key2: 'personality',
        title: `${label} Karakteri`,
        content: `${label} burcu karakterinde öne çıkan tema, kişinin kendi enerjisini nasıl kullandığı ve çevresiyle hangi ihtiyaç üzerinden bağ kurduğudur. Güçlü yanlar bilinçli kullanıldığında netlik, üretkenlik ve içsel yön duygusu verir; gölge taraflar ise acele karar, savunma veya duygusal kapanma gibi kalıplarla çalışılabilir hale gelir.`,
      },
      {
        id: `${sign}-love-fallback`,
        key2: 'love',
        title: `${label} Aşk ve Uyum`,
        content: `${label} burcu uyumu yalnızca güneş burcuna göre değerlendirilmemelidir. İlişkilerde Ay burcu duygusal güveni, Venüs sevgi dilini, Mars arzu ve çatışma tarzını, yükselen burç ise ilk temas biçimini gösterir. Bu nedenle en sağlıklı yorum, iki doğum haritasının tamamının birlikte okunmasıyla yapılır.`,
      },
      {
        id: `${sign}-career-fallback`,
        key2: 'career',
        title: `${label} Kariyer ve Yön`,
        content: `${label} burcu kariyer alanında kişinin motivasyon, odak ve üretim biçimini anlamak için iyi bir başlangıçtır. Doğru çalışma ortamı, bu burcun güçlü yönlerini görünür kılar; zorlayıcı döngüler ise daha bilinçli planlama, sınır koyma ve ritim düzenleme ihtiyacını hatırlatır.`,
      },
    ],
  };
}

async function fetchSignInfoServer(sign: string, locale: string) {
  try {
    const res = await fetch(`${API_BASE}/zodiac/${sign}?locale=${locale}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json ?? null;
  } catch {
    return null;
  }
}

async function fetchTodayServer(sign: string) {
  try {
    const res = await fetch(`${API_BASE}/horoscopes/today?sign=${sign}`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sign, locale } = await params;
  const label = labels[sign] || sign;

  // Admin paneldeki `burclar-sign` SEO ayarı geçerli; boşsa burç-spesifik fallback kullanılır.
  // Title template'inde "{sign}" placeholder'ı varsa burç adıyla değiştir.
  return buildPageMetadata({
    locale,
    pageKey: 'burclar-sign',
    pathname: `/burclar/${sign}`,
    fallback: {
      title: `${label} Burcu — Özellikleri, Yorumları ve Uyumu`,
      description: `${label} burcunun detaylı karakter analizi, aşk, kariyer ve sağlık yorumları. Günlük ${label} burcu yorumu, uyum haritası ve uzman astrolog rehberliği.`,
    },
  });
}

export default async function SignDetailPage({ params }: Props) {
  const { sign, locale } = await params;
  if (!VALID_SIGNS.has(sign)) notFound();

  const [info, today] = await Promise.all([
    fetchSignInfoServer(sign, locale),
    fetchTodayServer(sign),
  ]);
  const label = labels[sign] || sign;
  const renderedInfo = info ?? buildFallbackInfo(sign, label);
  const pageUrl = `${SITE_URL}/${locale}/burclar/${sign}`;
  const schema = graph([
    breadcrumbSchema([
      { name: 'GoldMoodAstro', item: `${SITE_URL}/${locale}` },
      { name: locale === 'tr' ? 'Burçlar' : 'Zodiac Signs', item: `${SITE_URL}/${locale}/burclar` },
      { name: `${label} Burcu`, item: pageUrl },
    ]),
    articleSchema({
      headline: renderedInfo.title,
      description: renderedInfo.short_summary || `${label} burcu özellikleri, aşk, kariyer, uyum ve günlük yorum rehberi.`,
      image: `${SITE_URL}/uploads/zodiac/${sign}.png`,
      datePublished: '2026-04-30T00:00:00.000Z',
      dateModified: '2026-04-30T00:00:00.000Z',
      author: { name: 'GoldMoodAstro Editorial Team', url: `${SITE_URL}/${locale}/about` },
      publisherId: `${SITE_URL}/#org`,
      url: pageUrl,
      speakableSelectors: ['h1', '[data-speakable]'],
      inLanguage: locale,
    }),
    faqSchema([
      {
        question: `${label} burcu nedir?`,
        answer: `${label} burcu, güneşin ${label} arketipinden geçtiği dönemde doğan kişilerin temel enerji, motivasyon ve davranış eğilimlerini anlatan astrolojik profildir.`,
      },
      {
        question: `${label} burcu özellikleri nelerdir?`,
        answer: renderedInfo.short_summary || `${label} burcu aşk, kariyer, ilişki, duygu düzenleme ve gündelik motivasyon başlıklarında kendine özgü güçlü yanlar ve gelişim alanları taşır.`,
      },
      {
        question: `${label} burcu yorumu tek başına yeterli mi?`,
        answer: 'Güneş burcu iyi bir başlangıçtır; daha doğru yorum için yükselen burç, Ay burcu, evler, gezegen yerleşimleri ve açılar birlikte değerlendirilmelidir.',
      },
    ]),
  ]);

  return (
    <main className="min-h-screen bg-[var(--gm-bg)] pt-32">
      <JsonLd id="zodiac-breadcrumb" data={schema} />
      <ZodiacDetail initialInfo={renderedInfo} initialToday={today} />
    </main>
  );
}
