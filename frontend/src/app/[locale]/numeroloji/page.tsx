import React from 'react';
import NumerologyHub from '@/components/containers/numerology/NumerologyHub';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';
import PageContainer from '@/components/common/PageContainer';
import SeoLandingArticle from '@/components/seo/SeoLandingArticle';
import { getLanding } from '@/components/seo/seo-landing-content';
import Banner from '@/layout/banner/Breadcrum';

type Props = { params: Promise<{ locale: string }> };

const FALLBACK = {
  tr: {
    title: 'Numeroloji Hesaplama ve Hayat Yolu Sayısı',
    description: 'İsim ve doğum tarihinizle hayat yolu, kader ve ruh arzusu sayınızı ücretsiz hesaplayın; numeroloji anlamlarını rehberle okuyun.',
  },
  en: {
    title: 'Numerology Calculator: Life Path Number',
    description: 'Calculate your life path, destiny and soul urge numbers from your name and birth date for free, with a guide to their meanings.',
  },
  de: {
    title: 'Numerologie-Rechner: Lebenszahl berechnen',
    description: 'Berechnen Sie Lebenszahl, Schicksalszahl und Seelenzahl aus Name und Geburtsdatum kostenlos – mit Leitfaden zu den Bedeutungen.',
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'numeroloji',
    pathname: '/numeroloji',
    // seo_pages'te 'numeroloji' kaydı yok; yedek metin locale'e göre seçilir
    // (eskiden /tr'de İngilizce başlık/açıklama çıkıyordu — SEO katalog 2026-10-03).
    fallback: FALLBACK[locale as keyof typeof FALLBACK] ?? FALLBACK.en,
  });
}

export default async function NumerologyPage({ params }: Props) {
  const { locale } = await params;

  return (
    <>
      <Banner title={getLanding('numeroloji', locale).eyebrow} />
      <PageContainer className="bg-[var(--gm-bg)]" pad="afterBanner">
        {/* Araç önce, uzun editoryal içerik sonra (2026-07-20 müşteri talebi):
            önceki sırada kullanıcı aracı görmek için ~4000px metin geçmek zorundaydı. */}
        <NumerologyHub />
        <SeoLandingArticle type="numeroloji" locale={locale} />
      </PageContainer>
    </>
  );
}
