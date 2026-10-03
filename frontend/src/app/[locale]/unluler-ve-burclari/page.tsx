import React from 'react';
import type { Metadata } from 'next';
import CelebrityZodiacPage from '@/components/containers/zodiac/CelebrityZodiacPage';
import { buildPageMetadata } from '@/seo/server';

export const revalidate = 86400;

const FALLBACK = {
  tr: {
    title: 'Ünlüler ve Burçları',
    description: 'Sanat, müzik, bilim ve liderlik alanından tanıdık isimlerin burçlarını ve öne çıkan astrolojik temalarını keşfedin.',
  },
  en: {
    title: 'Celebrities and Zodiac Signs',
    description: 'Discover zodiac signs and astrological themes of familiar names from art, music, science and leadership.',
  },
  de: {
    title: 'Prominente und ihre Sternzeichen',
    description: 'Entdecken Sie Sternzeichen und astrologische Themen bekannter Namen aus Kunst, Musik, Wissenschaft und Führung.',
  },
};

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'unluler-ve-burclari',
    pathname: '/unluler-ve-burclari',
    fallback: FALLBACK[locale as keyof typeof FALLBACK] ?? FALLBACK.en,
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
