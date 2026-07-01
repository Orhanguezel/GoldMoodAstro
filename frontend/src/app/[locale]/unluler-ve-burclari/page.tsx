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
  await params;

  return (
    <>
      <Banner title="Celebrities and Zodiac Signs" />
      <PageContainer width="full" pad="none" className="bg-(--gm-bg)">
        <CelebrityZodiacPage />
      </PageContainer>
    </>
  );
}
