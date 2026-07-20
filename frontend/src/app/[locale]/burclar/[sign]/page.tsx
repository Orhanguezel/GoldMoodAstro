import ZodiacDetail from '@/components/containers/zodiac/ZodiacDetail';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/seo/JsonLd';
import { articleSchema, breadcrumbSchema, faqSchema, graph } from '@/seo/jsonld';
import { buildPageMetadata } from '@/seo/server';
import { buildZodiacFaq } from '@/lib/zodiac/faq';
import { getZodiacMeta } from '@/lib/zodiac/signs';
import {
  VALID_ZODIAC_SIGNS,
  buildZodiacFallbackInfo,
  fetchZodiacInfoServer,
  getZodiacLabelForLocale,
  zodiacLabels,
} from '@/lib/zodiac/pageInfo.server';

export const revalidate = 86400; // 24 hours

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');

type Props = {
  params: Promise<{ sign: string; locale: string }>;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8094/api').replace(/\/$/, '');

async function fetchTodayServer(sign: string, locale: string) {
  try {
    const res = await fetch(`${API_BASE}/horoscopes/today?sign=${encodeURIComponent(sign)}&locale=${encodeURIComponent(locale)}`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data ?? json ?? null;
    if (!data) return null;
    return {
      ...data,
      date: data.date ?? data.period_start_date,
      contentTr: data.contentTr ?? data.content,
      moodScore: data.moodScore ?? data.mood_score,
      luckyNumber: data.luckyNumber ?? data.lucky_number,
      luckyColor: data.luckyColor ?? data.lucky_color,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sign, locale } = await params;

  // 2026-07-20 (GSC kapsam analizi): gecersiz burc slug'lari 200 + bos govde
  // donuyordu (notFound() ic not-found siniri yuzunden 404 uretmiyor).
  // Google bunlari "tarandi ama indekslenmedi" olarak isaretliyordu.
  // Durum kodu duzelene kadar kesin cozum: noindex.
  if (!VALID_ZODIAC_SIGNS.has(sign)) {
    return { title: 'Not found', robots: { index: false, follow: false } };
  }

  const label = getZodiacLabelForLocale(sign, locale);

  // Admin `burclar-sign` SEO settings win; fallback is used only when empty.
  // If the title template contains "{sign}", it is replaced with the sign label.
  return buildPageMetadata({
    locale,
    pageKey: 'burclar-sign',
    pathname: `/burclar/${sign}`,
    fallback: {
      title: locale === 'de' ? `${label} Sternzeichen — Eigenschaften und Kompatibilität` : `${label} Zodiac — Traits, Readings and Compatibility`,
      description: locale === 'de'
        ? `Detaillierte ${label} Analyse zu Charakter, Liebe, Karriere und Wohlbefinden.`
        : `Detailed ${label} character analysis, love, career and wellness readings. Daily ${label} horoscope, compatibility map and expert astrology guidance.`,
    },
  });
}

import PageContainer from '@/components/common/PageContainer';

export default async function SignDetailPage({ params }: Props) {
  const { sign, locale } = await params;
  if (!VALID_ZODIAC_SIGNS.has(sign)) notFound();

  const [info, today] = await Promise.all([
    fetchZodiacInfoServer(sign, locale),
    fetchTodayServer(sign, locale),
  ]);
  const label = zodiacLabels[sign] || sign;
  const localizedLabel = getZodiacLabelForLocale(sign, locale);
  const renderedInfo = info ?? buildZodiacFallbackInfo(sign, localizedLabel, locale);
  const pageUrl = `${SITE_URL}/${locale}/burclar/${sign}`;
  const meta = getZodiacMeta(sign);
  const zodiacFaq = meta ? buildZodiacFaq(meta, locale, renderedInfo.short_summary) : null;
  const schema = graph([
    breadcrumbSchema([
      { name: 'GoldMoodAstro', item: `${SITE_URL}/${locale}` },
      { name: locale === 'tr' ? 'Burçlar' : 'Zodiac Signs', item: `${SITE_URL}/${locale}/burclar` },
      { name: locale === 'tr' ? `${localizedLabel} Burcu` : locale === 'de' ? `${localizedLabel} Sternzeichen` : `${label} Zodiac`, item: pageUrl },
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
