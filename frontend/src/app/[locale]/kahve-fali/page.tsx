import React from 'react';
import CoffeeHub from '@/components/containers/coffee/CoffeeHub';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';

import PageContainer from '@/components/common/PageContainer';
import Banner from '@/layout/banner/Breadcrum';

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
  await params;

  return (
    <>
      <Banner title="Coffee Reading" />
      <PageContainer className="min-h-screen bg-[var(--gm-bg)]">
        <CoffeeHub />
      </PageContainer>
    </>
  );
}
