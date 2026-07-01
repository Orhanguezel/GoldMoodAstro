import React from 'react';
import BigThree from '@/components/containers/zodiac/BigThree';
import PageContainer from '@/components/common/PageContainer';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';
import Banner from '@/layout/banner/Breadcrum';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const ogImageUrl = `https://goldmoodastro.com/${locale}/big-three/opengraph-image`;

  return buildPageMetadata({
    locale,
    pageKey: 'big-three',
    pathname: '/buyuk-uclu',
    fallback: {
      title: 'Big Three - Sun, Moon and Rising Sign Card',
      description: 'Explore the three most important parts of your cosmic identity: Sun, Moon and Rising.',
      ogImage: ogImageUrl,
    },
  });
}

export default async function BuyukUcluPage({ params }: Props) {
  const { locale } = await params;

  return (
    <>
      <Banner title="Big Three" />
      <PageContainer as="main" width="full" pad="none" className="min-h-screen bg-[var(--gm-bg)]">
        <BigThree />
      </PageContainer>
    </>
  );
}
