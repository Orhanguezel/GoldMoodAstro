import React from 'react';
import RisingSignCalculator from '@/components/containers/rising/RisingSignCalculator';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';
import JsonLd from '@/seo/JsonLd';
import { articleSchema, graph } from '@/seo/jsonld';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'yukselen-burc-hesaplayici',
    pathname: '/yukselen-burc-hesaplayici',
    fallback: {
      title: 'Yükselen Burç Hesaplama — Ücretsiz Doğum Haritası Analizi',
      description: 'Doğum saati ve yeri bilginizle yükselen burcunuzu saniyeler içinde öğrenin. Güneş, Ay ve Yükselen burç üçlüsü ile kozmik kimliğinizi keşfedin.',
    },
  });
}

export default async function RisingCalculatorPage({ params }: Props) {
  const { locale } = await params;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');
  const isTr = locale === 'tr';

  return (
    <main className="min-h-screen bg-[var(--gm-bg)] pt-32">
      <JsonLd
        id="rising-sign-speakable-schema"
        data={graph([
          articleSchema({
            headline: isTr ? 'Yükselen Burç Hesaplama Rehberi' : 'Rising Sign Calculator Guide',
            description: isTr
              ? 'Yükselen burç, doğum anında doğu ufkunda yükselen burçtur ve kişinin dış dünyaya yaklaşımını anlatır.'
              : 'The rising sign is the zodiac sign on the eastern horizon at birth and describes how a person approaches the outer world.',
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
        className="mx-auto mb-10 max-w-4xl px-4 text-center"
        aria-labelledby="rising-sign-voice-answer"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gm-gold)]">
          {isTr ? 'Kısa Cevap' : 'Short Answer'}
        </p>
        <h1 id="rising-sign-voice-answer" className="font-serif text-3xl text-text-primary md:text-5xl">
          {isTr ? 'Yükselen burç nasıl hesaplanır?' : 'How is the rising sign calculated?'}
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-text-secondary md:text-lg">
          {isTr
            ? 'Yükselen burç, doğum tarihi, doğum saati ve doğum yerinin birlikte hesaplanmasıyla bulunur. Doğum anında doğu ufkunda yükselen burcu gösterir ve kişinin dış dünyaya verdiği ilk izlenimi, davranış ritmini ve hayata yaklaşım tarzını anlamaya yardımcı olur.'
            : 'The rising sign is calculated from birth date, birth time and birthplace together. It shows the sign rising on the eastern horizon at birth and helps describe first impressions, behavior rhythm and the way someone approaches life.'}
        </p>
      </section>
      <RisingSignCalculator />
    </main>
  );
}
