import ZodiacDetail from '@/components/containers/zodiac/ZodiacDetail';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/seo/JsonLd';
import { articleSchema, breadcrumbSchema, faqSchema, graph } from '@/seo/jsonld';
import { buildPageMetadata } from '@/seo/server';
import { buildZodiacFaq } from '@/lib/zodiac/faq';
import { getZodiacMeta } from '@/lib/zodiac/signs';

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
  aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer',
  leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio',
  sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces'
};

const labelsTr: Record<string, string> = {
  aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
  leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
  sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık'
};

function buildFallbackInfo(sign: string, label: string): ZodiacPageInfo {
  return {
    title: `${label} Zodiac Traits`,
    short_summary: `${label} is a strong astrological archetype with its own motivations across character, relationships, career and spiritual care.`,
    content: `${label} helps explain core life motivations, relationship style, decision patterns and daily energy rhythm through the Sun sign. This reading is not a fixed personality definition; it becomes deeper and more personal when read with the rising sign, Moon sign, Venus, Mars and house placements in the birth chart.`,
    sections: [
      {
        id: `${sign}-personality-fallback`,
        key2: 'personality',
        title: `${label} Personality`,
        content: `${label} personality highlights how someone uses their energy and which needs shape their connections. When strengths are used consciously, they bring clarity, productivity and inner direction; shadow patterns can be explored with more awareness.`,
      },
      {
        id: `${sign}-love-fallback`,
        key2: 'love',
        title: `${label} Love and Compatibility`,
        content: `${label} compatibility should not be judged by Sun sign alone. In relationships, the Moon shows emotional safety, Venus shows love language, Mars shows desire and conflict style, and the rising sign shows first contact. The healthiest reading compares both complete birth charts.`,
      },
      {
        id: `${sign}-career-fallback`,
        key2: 'career',
        title: `${label} Career and Direction`,
        content: `${label} is a useful starting point for understanding motivation, focus and working style. The right environment makes this sign strengths visible, while challenging cycles can point to planning, boundaries and rhythm adjustments.`,
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
  const localizedLabel = locale === 'tr' ? (labelsTr[sign] || label) : label;

  // Admin `burclar-sign` SEO settings win; fallback is used only when empty.
  // If the title template contains "{sign}", it is replaced with the sign label.
  return buildPageMetadata({
    locale,
    pageKey: 'burclar-sign',
    pathname: `/burclar/${sign}`,
    fallback: {
      title: `${label} Zodiac — Traits, Readings and Compatibility`,
      description: `Detailed ${label} character analysis, love, career and wellness readings. Daily ${label} horoscope, compatibility map and expert astrology guidance.`,
    },
  });
}

import PageContainer from '@/components/common/PageContainer';

export default async function SignDetailPage({ params }: Props) {
  const { sign, locale } = await params;
  if (!VALID_SIGNS.has(sign)) notFound();

  const [info, today] = await Promise.all([
    fetchSignInfoServer(sign, locale),
    fetchTodayServer(sign),
  ]);
  const label = labels[sign] || sign;
  const localizedLabel = locale === 'tr' ? (labelsTr[sign] || label) : label;
  const renderedInfo = info ?? buildFallbackInfo(sign, label);
  const pageUrl = `${SITE_URL}/${locale}/burclar/${sign}`;
  const meta = getZodiacMeta(sign);
  const zodiacFaq = meta ? buildZodiacFaq(meta, locale, renderedInfo.short_summary) : null;
  const schema = graph([
    breadcrumbSchema([
      { name: 'GoldMoodAstro', item: `${SITE_URL}/${locale}` },
      { name: locale === 'tr' ? 'Burçlar' : 'Zodiac Signs', item: `${SITE_URL}/${locale}/burclar` },
      { name: locale === 'tr' ? `${localizedLabel} Burcu` : `${label} Zodiac`, item: pageUrl },
    ]),
    articleSchema({
      headline: renderedInfo.title,
      description: renderedInfo.short_summary || `${label} zodiac traits, love, career, compatibility and daily reading guide.`,
      image: `${SITE_URL}/uploads/zodiac/${sign}.png`,
      datePublished: '2026-04-30T00:00:00.000Z',
      dateModified: '2026-04-30T00:00:00.000Z',
      author: { name: 'GoldMoodAstro Editorial Team', url: `${SITE_URL}/${locale}/about` },
      publisherId: `${SITE_URL}/#org`,
      url: pageUrl,
      speakableSelectors: ['h1', '[data-speakable]'],
      inLanguage: locale,
    }),
    ...(zodiacFaq ? [faqSchema(zodiacFaq.items)] : []),
  ]);

  return (
    <PageContainer className="bg-(--gm-bg)" verticalPadding="large">
      <JsonLd id="zodiac-breadcrumb" data={schema} />
      <ZodiacDetail initialInfo={renderedInfo} initialToday={today} />
    </PageContainer>
  );
}
