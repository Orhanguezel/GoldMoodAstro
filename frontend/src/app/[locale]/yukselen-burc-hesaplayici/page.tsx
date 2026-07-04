import React from 'react';
import RisingSignCalculator from '@/components/containers/rising/RisingSignCalculator';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';
import JsonLd from '@/seo/JsonLd';
import { articleSchema, graph } from '@/seo/jsonld';
import { webApplicationSchema } from '@/seo/toolSchemas';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'yukselen-burc-hesaplayici',
    pathname: '/yukselen-burc-hesaplayici',
    fallback: {
      title: 'Rising Sign Calculator — Free Birth Chart Analysis',
      description: 'Find your rising sign in seconds with birth time and place. Discover your cosmic identity through the Sun, Moon and Rising sign trio.',
    },
  });
}

import PageContainer from '@/components/common/PageContainer';
import Banner from '@/layout/banner/Breadcrum';

export default async function RisingCalculatorPage({ params }: Props) {
  const { locale } = await params;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');
  return (
    <>
      <Banner title="Rising Sign Calculator" />
      <PageContainer className="min-h-screen bg-(--gm-bg)" verticalPadding="large">
      <JsonLd
        id="rising-sign-speakable-schema"
        data={graph([
          webApplicationSchema({
            siteUrl,
            locale,
            path: '/yukselen-burc-hesaplayici',
            name: locale === 'tr' ? 'Yükselen Burç Hesaplayıcı' : 'Rising Sign Calculator',
            description:
              locale === 'tr'
                ? 'Doğum saati ve doğum yerine göre yükselen burcu hesaplayan web aracı.'
                : 'A web tool that calculates the rising sign from birth time and birthplace.',
            featureList: ['Rising sign calculation', 'Birth time', 'Birthplace'],
          }),
          articleSchema({
            headline: 'Rising Sign Calculator Guide',
            description: 'The rising sign is the zodiac sign on the eastern horizon at birth and describes how a person approaches the outer world.',
            image: `${siteUrl}/img/natal_chart.png`,
            datePublished: '2026-04-30T00:00:00.000Z',
            dateModified: '2026-04-30T00:00:00.000Z',
            author: { name: 'GoldMoodAstro Editorial Team', url: `${siteUrl}/${locale}/about` },
            publisherId: `${siteUrl}/#org`,
            url: `${siteUrl}/${locale}/yukselen-burc-hesaplayici`,
            speakableSelectors: ['h1', '[data-speakable]'],
            inLanguage: locale,
          }),
        ])}
      />
      <section
        data-speakable
        className="mx-auto mb-10 max-w-[var(--gm-w-readable)] text-center"
        aria-labelledby="rising-sign-voice-answer"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-(--gm-gold)">
          Short Answer
        </p>
        <h2 id="rising-sign-voice-answer" className="font-serif text-3xl text-(--gm-text) md:text-5xl">
          How is the rising sign calculated?
        </h2>
        <p className="mx-auto mt-5 max-w-[var(--gm-w-narrow)] text-base leading-8 text-(--gm-text-dim) md:text-lg">
          The rising sign is calculated from birth date, birth time and birthplace together. It shows the sign rising on the eastern horizon at birth and helps describe first impressions, behavior rhythm and the way someone approaches life.
        </p>
      </section>
      <RisingSignCalculator />
    </PageContainer>
    </>
  );
}
