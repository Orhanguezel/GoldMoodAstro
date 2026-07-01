import React from 'react';
import TarotHub from '@/components/containers/tarot/TarotHub';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';
import JsonLd from '@/seo/JsonLd';
import { articleSchema, breadcrumbSchema, faqSchema, graph } from '@/seo/jsonld';
import FaqAccordion from '@/components/common/FaqAccordion';
import AuthorBio from '@goldmood/shared-ui/content/AuthorBio';
import PageContainer from '@/components/common/PageContainer';
import LandingIntro from '@/components/common/LandingIntro';
import Banner from '@/layout/banner/Breadcrum';

import brand from '../../../../../config/brand.json';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'tarot',
    pathname: '/tarot',
    fallback: {
      title: `Free Tarot Reading and Card Meanings — ${brand.name}`,
      description: 'Discover tarot guidance with single card, three card or Celtic Cross spreads. In-depth AI-assisted card interpretations.',
    },
  });
}

export default async function TarotPage({ params }: Props) {
  const { locale } = await params;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || brand.public_url || 'https://goldmoodastro.com').replace(/\/$/, '');
  const pageUrl = `${siteUrl}/${locale}/tarot`;
  const faqItems = [
    {
      question: 'What is a tarot reading?',
      answer: 'A tarot reading is a spiritual guidance method that interprets questions, emotions and possibilities through card symbols.',
    },
    {
      question: 'Does tarot predict the future with certainty?',
      answer: 'Tarot is not a fixed fate statement; it is symbolic guidance that brings awareness to current energies and choices.',
    },
  ];
  const intro = {
    eyebrow: 'Tarot Guidance',
    title: 'What is tarot, how does it work and what can it show you?',
    lead:
      'Tarot is a symbolic guidance method that helps reveal emotions, options and decision patterns through the language of cards.',
    summary:
      `Tarot does not give fixed future statements. It opens a symbolic space to reflect on current energy, questions and choices. On ${brand.name}, tarot is interpreted through responsible guidance for relationships, career, decisions and self-awareness.`,
    sections: [
      {
        title: 'How tarot works',
        paragraphs: [
          'A tarot deck speaks through archetypes and symbols. A card is not read only by its dictionary meaning; the question, emotional context and the relationship between cards all matter. Tarot is therefore not a mechanical answer system, but a mirror for possibilities that may be hard to name.',
          'Single card readings offer quick insight, three card spreads create a broader timeline, and deeper spreads help with layered questions about decisions, relationships and direction.',
        ],
      },
      {
        title: 'What tarot can help you learn',
        paragraphs: [
          'Tarot can clarify relationship dynamics, emotional confusion around a choice, career motivation or the quiet voice underneath a question. It does not say "this will happen"; it says "this theme is asking for attention."',
          'After a reading, users often see the real question, the emotion influencing the decision and the option that requires more awareness.',
        ],
      },
      {
        title: `${brand.name} tarot approach`,
        paragraphs: [
          'GoldMoodAstro tarot content is informed by Rider-Waite-Smith symbolism and written in clear modern language. We avoid fear, dependency and absolute fate claims.',
          'A strong tarot question is specific and reflective. Instead of "what will happen?", ask "what do I need to see here?" or "which dynamic is active in this relationship?"',
        ],
      },
    ],
  };

  return (
    <>
      <Banner title="Tarot" />
      <PageContainer className="min-h-screen bg-(--gm-bg)" verticalPadding="large">
      <JsonLd
        id="tarot-schema"
        data={graph([
          breadcrumbSchema([
            { name: brand.name, item: `${siteUrl}/${locale}` },
            { name: 'Tarot', item: pageUrl },
          ]),
          articleSchema({
            headline: 'Tarot Reading and Card Meanings',
            description:
              'Tarot guidance with single card, three card and Celtic Cross spreads, card meanings and spiritual interpretations.',
            image: `${siteUrl}/img/tarot.png`,
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
      <TarotHub />
      <FaqAccordion items={faqItems} title="Tarot Questions" />
      <AuthorBio
        name={`${brand.name} Editorial Team`}
        title="Tarot and symbolism editors"
        bio={`${brand.name} tarot content interprets card symbols through everyday awareness and responsible spiritual guidance.`}
        expertise={['Tarot', 'Symbolism', 'Spiritual Guidance']}
      />
    </PageContainer>
    </>
  );
}
