import React from 'react';
import type { Metadata } from 'next';
import CelebrityZodiacPage from '@/components/containers/zodiac/CelebrityZodiacPage';
import { buildPageMetadata } from '@/seo/server';

export const revalidate = 86400;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'unluler-ve-burclari',
    pathname: '/unluler-ve-burclari',
    fallback: {
      title: 'Celebrities and Zodiac Signs — GoldMoodAstro',
      description: 'Discover zodiac signs and astrological themes of familiar names from art, music, science and leadership.',
    },
  });
}

import PageContainer from '@/components/common/PageContainer';
import Banner from '@/layout/banner/Breadcrum';

export default async function UnlulerVeBurclariPage({ params }: Props) {
  const { locale } = await params;

  const BANNER: Record<string, string> = { tr: 'Ünlüler ve Burçları', en: 'Celebrities and Zodiac Signs', de: 'Prominente und Sternzeichen' };
  return (
    <>
      <Banner title={BANNER[locale] ?? BANNER.en} />
      <PageContainer width="full" pad="none" className="bg-(--gm-bg)">
        <CelebrityZodiacPage />
      </PageContainer>
    </>
  );
}
