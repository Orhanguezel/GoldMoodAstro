import React from 'react';
import NumerologyHub from '@/components/containers/numerology/NumerologyHub';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';
import PageContainer from '@/components/common/PageContainer';
import SeoLandingArticle from '@/components/seo/SeoLandingArticle';
import { getLanding } from '@/components/seo/seo-landing-content';
import Banner from '@/layout/banner/Breadcrum';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'numeroloji',
    pathname: '/numeroloji',
    fallback: {
      title: 'Free Numerology Analysis — Name and Destiny Number',
      description: 'Decode the hidden patterns in your name and birth date. Destiny number, soul urge and life path analysis.',
    },
  });
}

export default async function NumerologyPage({ params }: Props) {
  const { locale } = await params;

  return (
    <>
      <Banner title={getLanding('numeroloji', locale).eyebrow} />
      <PageContainer className="min-h-screen bg-[var(--gm-bg)]">
        {/* Araç önce, uzun editoryal içerik sonra (2026-07-20 müşteri talebi):
            önceki sırada kullanıcı aracı görmek için ~4000px metin geçmek zorundaydı. */}
        <NumerologyHub />
        <SeoLandingArticle type="numeroloji" locale={locale} />
      </PageContainer>
    </>
  );
}
