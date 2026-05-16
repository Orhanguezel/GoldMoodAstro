import React from 'react';
import ZodiacHub from '@/components/containers/zodiac/ZodiacHub';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';

import PageContainer from '@/components/common/PageContainer';
import Banner from '@/layout/banner/Breadcrum';

export const revalidate = 86400; // 24 hours

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'burclar',
    pathname: '/burclar',
    fallback: {
      title: 'Burçlar ve Özellikleri — GoldMoodAstro',
      description: '12 burcun detaylı özellikleri, karakter analizleri, elementleri ve yönetici gezegenleri. Burcunuzun gizli dünyasını keşfedin.',
    },
  });
}

export default async function BurclarPage({ params }: Props) {
  const { locale } = await params;

  return (
    <>
      <Banner title={locale === 'tr' ? 'Burçlar' : 'Zodiac Signs'} />
      <PageContainer className="bg-(--gm-bg)" verticalPadding="large">
        <ZodiacHub />
      </PageContainer>
    </>
  );
}
