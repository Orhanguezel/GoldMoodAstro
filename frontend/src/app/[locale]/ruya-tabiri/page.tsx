import React from 'react';
import DreamHub from '@/components/containers/dreams/DreamHub';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'ruya-tabiri',
    pathname: '/ruya-tabiri',
    fallback: {
      title: 'Free Dream Interpretation — Hidden Language of the Subconscious — GoldMoodAstro',
      description: 'Describe your dreams and let AI analyze them with psychological archetypes and ancient symbolism. In-depth dream readings.',
    },
  });
}

import PageContainer from '@/components/common/PageContainer';
import Banner from '@/layout/banner/Breadcrum';
import SeoLandingArticle from '@/components/seo/SeoLandingArticle';
import { getLanding } from '@/components/seo/seo-landing-content';

export default async function DreamsPage({ params }: Props) {
  const { locale } = await params;

  return (
    <>
      <Banner title={getLanding('ruya-tabiri', locale).eyebrow} />
      <PageContainer className="min-h-screen bg-(--gm-bg)" verticalPadding="large">
        {/* Araç önce, uzun editoryal içerik sonra (2026-07-20 müşteri talebi):
            önceki sırada kullanıcı aracı görmek için ~4000px metin geçmek zorundaydı. */}
        <DreamHub />
        <SeoLandingArticle type="ruya-tabiri" locale={locale} />
      </PageContainer>
    </>
  );
}
