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
    pathname: '/big-three',
    fallback: {
      title: 'Büyük Üçlü — Güneş, Ay ve Yükselen Burç Kartı',
      description: 'Kozmik kimliğinizin en önemli üç parçasını keşfedin: Güneş (Ego), Ay (Duygular) ve Yükselen (Dış Dünya).',
      ogImage: ogImageUrl,
    },
  });
}

export default async function BigThreePage({ params }: Props) {
  const { locale } = await params;

  return (
    <>
      <Banner title={locale === 'tr' ? 'Büyük Üçlü' : 'Big Three'} />
      <PageContainer as="main" width="full" pad="none" className="min-h-screen bg-[var(--gm-bg)]">
        <BigThree />
      </PageContainer>
    </>
  );
}
