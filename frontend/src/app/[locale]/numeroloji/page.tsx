import React from 'react';
import NumerologyHub from '@/components/containers/numerology/NumerologyHub';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';
import JsonLd from '@/seo/JsonLd';
import { articleSchema, breadcrumbSchema, faqSchema, graph } from '@/seo/jsonld';
import FaqAccordion from '@/components/common/FaqAccordion';
import AuthorBio from '@goldmood/shared-ui/content/AuthorBio';
import LandingIntro from '@/components/common/LandingIntro';
import PageContainer from '@/components/common/PageContainer';
import Banner from '@/layout/banner/Breadcrum';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'numeroloji',
    pathname: '/numeroloji',
    fallback: {
      title: 'Free Numerology Analysis — Name and Destiny Number',
      description: 'Decode the hidden patterns in your name and birth date. Destiny number, soul urge and life path analysis.',
    },
  });
}

export default async function NumerologyPage({ params }: Props) {
  const { locale } = await params;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');
  const pageUrl = `${siteUrl}/${locale}/numeroloji`;
  const faqItems = [
    {
      question: 'What is numerology?',
      answer: 'Numerology interprets symbolic meanings such as life path, destiny number and personal cycles through name and birth date.',
    },
    {
      question: 'What is numerology analysis useful for?',
      answer: 'Numerology analysis helps a person notice strengths, repeating patterns and themes to consider in decision-making.',
    },
  ];
  const intro = {
    eyebrow: 'Numerology Guide',
    title: 'What is numerology, how is it calculated and what can it reveal?',
    lead:
      'Numerology reads numbers in names and birth dates as symbolic patterns for rhythm, motivation and repeating life themes.',
    summary:
      'Numerology does not define fixed fate. It supports self-awareness by interpreting name, birth date and number symbolism around strengths, decision style and personal cycles.',
    sections: [
      { title: 'How numerology works', paragraphs: ['Birth dates and letters are converted into number values such as life path, destiny number, soul urge and personal year.', 'GoldMoodAstro presents these symbols in clear language so users can connect numbers with daily choices, relationships and personal growth.'] },
      { title: 'What numerology can show', paragraphs: ['Numerology can help users notice strengths, repeating patterns and themes that become more active in certain periods.', 'It should not be the only source for decisions, but it can create a useful structure for self-observation.'] },
      { title: 'GoldMoodAstro numerology approach', paragraphs: ['We avoid fear-based or deterministic language. Numbers are treated as symbols that widen awareness and choice.', 'For a better reading, enter birth data carefully and compare the result with recurring patterns in daily life.'] },
    ],
  };

  return (
    <>
      <Banner title="Numerology" />
      <PageContainer className="min-h-screen bg-[var(--gm-bg)]">
      <JsonLd
        id="numerology-schema"
        data={graph([
          breadcrumbSchema([
            { name: 'GoldMoodAstro', item: `${siteUrl}/${locale}` },
            { name: 'Numerology', item: pageUrl },
          ]),
          articleSchema({
            headline: 'Numerology Analysis',
            description: 'Numerology guide through name, birth date, life path and personal cycles.',
            image: `${siteUrl}/img/natal_chart.png`,
            datePublished: '2026-04-30T00:00:00.000Z',
            dateModified: '2026-04-30T00:00:00.000Z',
            author: { name: 'GoldMoodAstro Editorial Team', url: `${siteUrl}/${locale}/about` },
            publisherId: `${siteUrl}/#org`,
            url: pageUrl,
            speakableSelectors: ['h1', '[data-speakable]'],
            inLanguage: locale,
          }),
          faqSchema(faqItems),
        ])}
      />
      <LandingIntro {...intro} showHeader={false} />
      <NumerologyHub />
      <FaqAccordion items={faqItems} title="Numerology Questions" />
      <AuthorBio
        name="GoldMoodAstro Editorial Team"
        title="Numerology and personal cycles editors"
        bio="GoldMoodAstro numerology content makes name and birth date symbolism understandable through personal awareness."
        expertise={['Numerology', 'Personal Cycles', 'Awareness']}
      />
    </PageContainer>
    </>
  );
}
