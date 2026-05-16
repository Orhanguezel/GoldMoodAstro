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
      title: 'Ünlüler ve Burçları — GoldMoodAstro',
      description: 'Sanat, müzik, bilim ve liderlik alanından tanıdık isimlerin burçlarını ve astrolojik temalarını keşfet.',
    },
  });
}

import PageContainer from '@/components/common/PageContainer';
import Banner from '@/layout/banner/Breadcrum';

export default async function UnlulerVeBurclariPage({ params }: Props) {
  const { locale } = await params;

  return (
    <>
      <Banner title={locale === 'tr' ? 'Ünlüler ve Burçları' : 'Celebrities and Zodiac Signs'} />
      <PageContainer width="full" pad="none" className="bg-(--gm-bg)">
        <CelebrityZodiacPage />
      </PageContainer>
    </>
  );
}
