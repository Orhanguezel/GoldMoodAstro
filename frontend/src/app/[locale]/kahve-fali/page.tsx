import React from 'react';
import CoffeeHub from '@/components/containers/coffee/CoffeeHub';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';

import PageContainer from '@/components/common/PageContainer';
import Banner from '@/layout/banner/Breadcrum';
import SeoLandingArticle from '@/components/seo/SeoLandingArticle';
import { getLanding } from '@/components/seo/seo-landing-content';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'kahve-fali',
    pathname: '/kahve-fali',
    fallback: {
      title: 'Free Coffee Reading — Realistic Interpretations with Vision AI — GoldMoodAstro',
      description: 'Take a photo of your cup and let AI analyze the symbols in seconds. Traditional coffee reading meets modern technology.',
    },
  });
}

export default async function CoffeePage({ params }: Props) {
  const { locale } = await params;

  return (
    <>
      <Banner title={getLanding('kahve-fali', locale).eyebrow} />
      <PageContainer className="min-h-screen bg-[var(--gm-bg)]">
        <SeoLandingArticle type="kahve-fali" locale={locale} />
        <CoffeeHub />
      </PageContainer>
    </>
  );
}
