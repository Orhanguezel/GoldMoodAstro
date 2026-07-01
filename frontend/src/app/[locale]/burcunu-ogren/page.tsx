import React from 'react';
import type { Metadata } from 'next';
import ZodiacFinderQuiz from '@/components/containers/zodiac/ZodiacFinderQuiz';
import { buildPageMetadata } from '@/seo/server';
import JsonLd from '@/seo/JsonLd';
import { articleSchema, graph } from '@/seo/jsonld';

import brand from '../../../../../config/brand.json';

export const revalidate = 86400;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'burcunu-ogren',
    pathname: '/burcunu-ogren',
    fallback: {
      title: `Find Your Zodiac Sign — ${brand.name}`,
      description: 'Choose your birthday and quickly discover your Sun sign, element and nearby astrological themes.',
    },
  });
}

import PageContainer from '@/components/common/PageContainer';
import Banner from '@/layout/banner/Breadcrum';

export default async function BurcunuOgrenPage({ params }: Props) {
  const { locale } = await params;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || brand.public_url || 'https://goldmoodastro.com').replace(/\/$/, '');
  return (
    <>
      <Banner title="Find Your Zodiac Sign" />
      <PageContainer className="min-h-screen bg-(--gm-bg)" verticalPadding="large">
      <JsonLd
        id="zodiac-finder-speakable-schema"
        data={graph([
          articleSchema({
            headline: 'Zodiac Sign Finder Guide',
            description: 'The Sun sign is the zodiac sign where the Sun was on your birthday and describes your core life energy.',
            image: `${siteUrl}/img/natal_chart.png`,
            datePublished: '2026-04-30T00:00:00.000Z',
            dateModified: '2026-04-30T00:00:00.000Z',
            author: { name: `${brand.name} Editorial Team`, url: `${siteUrl}/${locale}/about` },
            publisherId: `${siteUrl}/#org`,
            url: `${siteUrl}/${locale}/burcunu-ogren`,
            speakableSelectors: ['h1', '[data-speakable]'],
            inLanguage: locale,
          }),
        ])}
      />
      <section
        data-speakable
        className="mx-auto mb-10 max-w-[var(--gm-w-readable)] text-center"
        aria-labelledby="zodiac-finder-voice-answer"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-(--gm-gold)">
          Short Answer
        </p>
        <h2 id="zodiac-finder-voice-answer" className="font-serif text-3xl text-(--gm-text) md:text-5xl">
          How do I find my zodiac sign?
        </h2>
        <p className="mx-auto mt-5 max-w-[var(--gm-w-narrow)] text-base leading-8 text-(--gm-text-dim) md:text-lg">
          Your birthday is enough to find your Sun sign. Your main zodiac sign is the sign range where the Sun was on your date of birth. For a more personal reading, the Moon sign, rising sign and houses in the birth chart should also be considered.
        </p>
      </section>
      <ZodiacFinderQuiz />
    </PageContainer>
    </>
  );
}
