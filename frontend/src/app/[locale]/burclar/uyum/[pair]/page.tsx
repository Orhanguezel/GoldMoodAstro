import React from 'react';
import Link from 'next/link';
import ZodiacCompatibility from '@/components/containers/zodiac/ZodiacCompatibility';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/seo/server';
import { buildPairContent } from '@/lib/zodiac/compatibility';
import {
  canonicalSignPair,
  toLocalizedPublicPath,
  ZODIAC_SIGN_ORDER,
  type PublicLocale,
} from '@/i18n/localizedRoutes';
import { parsePair, SIGN_LABELS } from '@/lib/zodiac/pair';
import { ZODIAC_META } from '@/lib/zodiac/signs';
import { fetchUiStrings } from '@/i18n/fetchUiStrings.server';

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
  // Lokalize public path + env domain: en/de'de og:image 308 hop yemesin,
  // staging build prod'a işaret etmesin (blog sayfasıyla aynı kalıp).
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');
  const metaLocale = (locale === 'en' || locale === 'de' ? locale : 'tr') as PublicLocale;
  const ogImageUrl = `${siteUrl}/${metaLocale}${toLocalizedPublicPath(metaLocale, `/burclar/uyum/${canonicalPair.slug}`)}/opengraph-image`;
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
  const publicLocale = (locale === 'en' || locale === 'de' ? locale : 'tr') as PublicLocale;

  // SUNUCUDA basılan içerik — interaktif bileşen istemcide yükleniyor ve
  // tarayıcı botları o yüzden bu sayfaları BOŞ görüyordu (dizine girmediler).
  const content = buildPairContent(canonicalPair.signA, canonicalPair.signB, locale);
  const hubHref = `/${publicLocale}${toLocalizedPublicPath(publicLocale, '/burclar/uyum')}`;
  const signHref = (sign: string) => `/${publicLocale}${toLocalizedPublicPath(publicLocale, `/burclar/${sign}`)}`;
  const pairHref = (slug: string) => `/${publicLocale}${toLocalizedPublicPath(publicLocale, `/burclar/uyum/${slug}`)}`;
  const currentSlug = canonicalPair.slug;
  const profileSigns = canonicalPair.signA === canonicalPair.signB
    ? [canonicalPair.signA]
    : [canonicalPair.signA, canonicalPair.signB];
  // Önce aynı elementten çiftler, azsa deterministik tamamlama (anchor'ın
  // kendi çifti + burç sırasına göre komşular). Aynı-element ve aynı-burç
  // sayfalarında liste 2'ye düşüyordu; her sayfa 4 ilgili link almalı.
  const elementOf = (sign: string) => ZODIAC_META[sign as keyof typeof ZODIAC_META]?.element;
  const relatedCandidates: Array<{ signA: string; signB: string; slug: string }> = [];
  for (const anchor of profileSigns) {
    for (const candidate of ZODIAC_SIGN_ORDER) {
      if (candidate === anchor || elementOf(candidate) !== elementOf(anchor)) continue;
      const pairForAnchor = canonicalSignPair(anchor, candidate);
      if (pairForAnchor) relatedCandidates.push(pairForAnchor);
    }
  }
  for (const anchor of profileSigns) {
    const samePair = canonicalSignPair(anchor, anchor);
    if (samePair) relatedCandidates.push(samePair);
    for (const candidate of ZODIAC_SIGN_ORDER) {
      if (candidate === anchor) continue;
      const pairForAnchor = canonicalSignPair(anchor, candidate);
      if (pairForAnchor) relatedCandidates.push(pairForAnchor);
    }
  }
  const relatedPairs = relatedCandidates
    .filter((candidate, index, rows) => candidate.slug !== currentSlug && rows.findIndex((row) => row.slug === candidate.slug) === index)
    .slice(0, 4);
  const crossCopy = await fetchUiStrings(publicLocale, publicLocale === 'tr'
    ? { ui_compat_pair_breadcrumb: 'Tüm burç uyumları', ui_compat_pair_profiles: 'Burç profilleri', ui_compat_pair_related: 'İlgili uyum kombinasyonları', ui_compat_pair_all: '78 kombinasyonun tümünü görüntüle' }
    : publicLocale === 'de'
      ? { ui_compat_pair_breadcrumb: 'Alle Sternzeichen-Kombinationen', ui_compat_pair_profiles: 'Sternzeichenprofile', ui_compat_pair_related: 'Verwandte Kombinationen', ui_compat_pair_all: 'Alle 78 Kombinationen ansehen' }
      : { ui_compat_pair_breadcrumb: 'All zodiac compatibility', ui_compat_pair_profiles: 'Zodiac sign profiles', ui_compat_pair_related: 'Related compatibility combinations', ui_compat_pair_all: 'View all 78 combinations' });

  return (
    <PageContainer className="bg-(--gm-bg)" verticalPadding="large">
      {content && (
        <section className="mx-auto mb-12 max-w-3xl">
          <nav aria-label="Breadcrumb" className="mb-5 text-sm text-(--gm-muted)">
            <Link href={hubHref} className="hover:text-(--gm-gold)">{crossCopy.ui_compat_pair_breadcrumb}</Link>
            <span aria-hidden="true" className="mx-2">/</span>
            <span>{content.labelA} · {content.labelB}</span>
          </nav>
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

          <div className="mt-9 grid gap-5 md:grid-cols-2">
            <section className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-5">
              <h2 className="font-serif text-xl text-(--gm-text)">{crossCopy.ui_compat_pair_profiles}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {profileSigns.map((sign) => (
                  <Link key={sign} href={signHref(sign)} className="rounded-full border border-(--gm-gold)/30 px-3 py-2 text-sm text-(--gm-gold) hover:bg-(--gm-gold)/10">
                    {SIGN_LABELS[publicLocale]?.[sign] ?? sign}
                  </Link>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-surface) p-5">
              <h2 className="font-serif text-xl text-(--gm-text)">{crossCopy.ui_compat_pair_related}</h2>
              <ul className="mt-3 space-y-2">
                {relatedPairs.map((related) => (
                  <li key={related.slug}>
                    <Link href={pairHref(related.slug)} className="text-sm text-(--gm-text-dim) hover:text-(--gm-gold)">
                      {SIGN_LABELS[publicLocale]?.[related.signA] ?? related.signA} · {SIGN_LABELS[publicLocale]?.[related.signB] ?? related.signB}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <Link href={hubHref} className="mt-5 inline-block text-sm font-semibold text-(--gm-gold) hover:underline">
            {crossCopy.ui_compat_pair_all} →
          </Link>
        </section>
      )}

      <ZodiacCompatibility signA={canonicalPair.signA} signB={canonicalPair.signB} />
    </PageContainer>
  );
}
