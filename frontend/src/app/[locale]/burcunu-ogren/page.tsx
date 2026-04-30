import React from 'react';
import type { Metadata } from 'next';
import ZodiacFinderQuiz from '@/components/containers/zodiac/ZodiacFinderQuiz';
import { buildPageMetadata } from '@/seo/server';
import JsonLd from '@/seo/JsonLd';
import { articleSchema, graph } from '@/seo/jsonld';

export const revalidate = 86400;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'burcunu-ogren',
    pathname: '/burcunu-ogren',
    fallback: {
      title: 'Burcunu Öğren — GoldMoodAstro',
      description: 'Doğum gününü seçerek güneş burcunu, elementini ve sana yakın astrolojik temaları hızlıca keşfet.',
    },
  });
}

export default async function BurcunuOgrenPage({ params }: Props) {
  const { locale } = await params;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');
  const isTr = locale === 'tr';

  return (
    <main className="min-h-screen bg-[var(--gm-bg)] pt-32">
      <JsonLd
        id="zodiac-finder-speakable-schema"
        data={graph([
          articleSchema({
            headline: isTr ? 'Burcunu Öğren Rehberi' : 'Zodiac Sign Finder Guide',
            description: isTr
              ? 'Güneş burcu doğum gününüzde Güneşin bulunduğu burçtur ve temel yaşam enerjinizi anlatır.'
              : 'The Sun sign is the zodiac sign where the Sun was on your birthday and describes your core life energy.',
            image: `${siteUrl}/img/natal_chart.png`,
            datePublished: '2026-04-30T00:00:00.000Z',
            dateModified: '2026-04-30T00:00:00.000Z',
            author: { name: 'GoldMoodAstro Editorial Team', url: `${siteUrl}/${locale}/about` },
            publisherId: `${siteUrl}/#org`,
            url: `${siteUrl}/${locale}/burcunu-ogren`,
            speakableSelectors: ['h1', '[data-speakable]'],
            inLanguage: locale,
          }),
        ])}
      />
      <section
        data-speakable
        className="mx-auto mb-10 max-w-4xl px-4 text-center"
        aria-labelledby="zodiac-finder-voice-answer"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gm-gold)]">
          {isTr ? 'Kısa Cevap' : 'Short Answer'}
        </p>
        <h1 id="zodiac-finder-voice-answer" className="font-serif text-3xl text-text-primary md:text-5xl">
          {isTr ? 'Burcumu nasıl öğrenirim?' : 'How do I find my zodiac sign?'}
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-text-secondary md:text-lg">
          {isTr
            ? 'Güneş burcunuzu öğrenmek için doğum gününüz yeterlidir. Doğduğunuz tarihte Güneş hangi burç aralığındaysa temel burcunuz odur. Daha kişisel bir yorum için Ay burcu, yükselen burç ve doğum haritasındaki evler de birlikte değerlendirilmelidir.'
            : 'Your birthday is enough to find your Sun sign. Your main zodiac sign is the sign range where the Sun was on your date of birth. For a more personal reading, the Moon sign, rising sign and houses in the birth chart should also be considered.'}
        </p>
      </section>
      <ZodiacFinderQuiz />
    </main>
  );
}
