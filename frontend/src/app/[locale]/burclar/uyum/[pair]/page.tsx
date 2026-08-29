import React from 'react';
import ZodiacCompatibility from '@/components/containers/zodiac/ZodiacCompatibility';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/seo/server';
import { buildPairContent } from '@/lib/zodiac/compatibility';
import { canonicalSignPair } from '@/i18n/localizedRoutes';
import { parsePair } from '@/lib/zodiac/pair';

type Props = {
  params: Promise<{ pair: string; locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pair, locale } = await params;
  const parsed = parsePair(pair);
  if (!parsed) {
    return buildPageMetadata({
      locale,
      pageKey: 'burclar-pair-uyumu',
      pathname: `/burclar/uyum/${pair}`,
      fallback: { title: 'Zodiac Compatibility', description: 'Compatibility analysis between two zodiac signs.' },
    });
  }
  const canonicalPair = canonicalSignPair(parsed.signA, parsed.signB);
  if (!canonicalPair) return {};
  const ogImageUrl = `https://goldmoodastro.com/${locale}/burclar/uyum/${canonicalPair.slug}/opengraph-image`;
  const content = buildPairContent(canonicalPair.signA, canonicalPair.signB, locale);

  const base = await buildPageMetadata({
    locale,
    pageKey: 'burclar-pair-uyumu',
    pathname: `/burclar/uyum/${canonicalPair.slug}`,
    fallback: {
      title: content?.title,
      description: content?.description,
      ogImage: ogImageUrl,
    },
  });

  // DB'deki sayfa SEO kaydı TÜM çiftler için aynı başlığı veriyordu; 144 sayfa
  // tek başlıkla dizine giremez. Çifte özgü başlık/açıklama DB kaydını EZER.
  if (!content) return base;
  return {
    ...base,
    title: content.title,
    description: content.description,
    openGraph: { ...(base.openGraph ?? {}), title: content.title, description: content.description },
    twitter: { ...(base.twitter ?? {}), title: content.title, description: content.description },
  };
}

import PageContainer from '@/components/common/PageContainer';

export default async function CompatibilityPage({ params }: Props) {
  const { pair, locale } = await params;
  const parsed = parsePair(pair);
  if (!parsed) notFound();
  const canonicalPair = canonicalSignPair(parsed.signA, parsed.signB);
  if (!canonicalPair) notFound();

  // SUNUCUDA basılan içerik — interaktif bileşen istemcide yükleniyor ve
  // tarayıcı botları o yüzden bu sayfaları BOŞ görüyordu (dizine girmediler).
  const content = buildPairContent(canonicalPair.signA, canonicalPair.signB, locale);

  return (
    <PageContainer className="bg-(--gm-bg)" verticalPadding="large">
      {content && (
        <section className="mx-auto mb-12 max-w-3xl">
          <h1 className="mb-4 font-serif text-3xl leading-tight text-(--gm-text) md:text-4xl">
            {content.h1}
          </h1>
          <p className="mb-6 text-lg leading-relaxed text-(--gm-text-dim)">{content.intro}</p>

          <dl className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {content.facts.map((fact) => (
              <div
                key={fact.label}
                className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) px-4 py-3"
              >
                <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--gm-gold-dim)">
                  {fact.label}
                </dt>
                <dd className="mt-1 text-sm text-(--gm-text)">
                  {content.labelA}: {fact.a} · {content.labelB}: {fact.b}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mb-3 text-base leading-relaxed text-(--gm-text-dim)">
            <strong className="text-(--gm-text)">{content.aspect.label}:</strong> {content.aspect.value} —{' '}
            {content.aspectNote}
          </p>
          {content.sameElementNote && (
            <p className="mb-3 text-base leading-relaxed text-(--gm-text-dim)">{content.sameElementNote}</p>
          )}
          <p className="text-xs italic leading-relaxed text-(--gm-muted)">{content.disclaimer}</p>
        </section>
      )}

      <ZodiacCompatibility signA={canonicalPair.signA} signB={canonicalPair.signB} />
    </PageContainer>
  );
}
