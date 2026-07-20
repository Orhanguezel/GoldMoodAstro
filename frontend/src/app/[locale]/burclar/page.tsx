import React from 'react';
import ZodiacHub from '@/components/containers/zodiac/ZodiacHub';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';

import PageContainer from '@/components/common/PageContainer';
import Banner from '@/layout/banner/Breadcrum';
import SeoLandingArticle from '@/components/seo/SeoLandingArticle';

export const revalidate = 86400; // 24 hours

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'burclar',
    pathname: '/burclar',
    fallback: {
      title: 'Zodiac Signs and Traits — GoldMoodAstro',
      description: 'Detailed traits, character analyses, elements and ruling planets of the 12 zodiac signs. Discover the hidden world of your sign.',
    },
  });
}

export default async function BurclarPage({ params }: Props) {
  const { locale } = await params;

  const BANNER: Record<string, string> = { tr: 'Burçlar', en: 'Zodiac Signs', de: 'Sternzeichen' };
  return (
    <>
      <Banner title={BANNER[locale] ?? BANNER.en} showTitle={false} />
      <PageContainer className="bg-(--gm-bg)" verticalPadding="large">
        <ZodiacHub />
        {/* 2026-07-20: sayfa 283 kelimeydi, burclar hakkinda hic aciklama yoktu. */}
        <SeoLandingArticle type="burclar" locale={locale} />
      </PageContainer>
    </>
  );
}
