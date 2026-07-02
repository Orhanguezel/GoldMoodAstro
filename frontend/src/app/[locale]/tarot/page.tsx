import React from 'react';
import TarotHub from '@/components/containers/tarot/TarotHub';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';
import PageContainer from '@/components/common/PageContainer';
import SeoLandingArticle from '@/components/seo/SeoLandingArticle';
import { getLanding } from '@/components/seo/seo-landing-content';
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

  return (
    <>
      <Banner title={getLanding('tarot', locale).eyebrow} />
      <PageContainer className="min-h-screen bg-(--gm-bg)" verticalPadding="large">
        <SeoLandingArticle type="tarot" locale={locale} />
        <TarotHub />
      </PageContainer>
    </>
  );
}
