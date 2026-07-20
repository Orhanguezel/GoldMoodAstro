import React from 'react';
import BigThree from '@/components/containers/zodiac/BigThree';
import PageContainer from '@/components/common/PageContainer';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/seo/server';
import Banner from '@/layout/banner/Breadcrum';
import SeoLandingArticle from '@/components/seo/SeoLandingArticle';
import JsonLd from '@/seo/JsonLd';
import { graph } from '@/seo/jsonld';
import { webApplicationSchema } from '@/seo/toolSchemas';

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
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');

  const BANNER: Record<string, string> = { tr: 'Büyük Üçlü', en: 'Big Three', de: 'Die großen Drei' };
  return (
    <>
      <Banner title={BANNER[locale] ?? BANNER.en} />
      <PageContainer as="main" className="min-h-screen bg-(--gm-bg)" verticalPadding="large">
        <JsonLd
          id="big-three-webapp"
          data={graph([
            webApplicationSchema({
              siteUrl,
              locale,
              path: '/buyuk-uclu',
              name: locale === 'tr' ? 'Büyük Üçlü Hesaplayıcı' : 'Big Three Calculator',
              description:
                locale === 'tr'
                  ? 'Güneş, Ay ve yükselen burç üçlüsünü birlikte yorumlamaya yardımcı olan web aracı.'
                  : 'A web tool for exploring Sun, Moon and Rising sign themes together.',
              featureList: ['Sun sign', 'Moon sign', 'Rising sign'],
            }),
          ])}
        />
        <BigThree />
        {/* 2026-07-20: sayfada büyük üçlü hakkında hiç bilgi metni yoktu.
            Diğer landing sayfalarıyla aynı kalıp: araç önce, dil destekli
            editoryal içerik (tr/en/de) altında. */}
        <SeoLandingArticle type="buyuk-uclu" locale={locale} />
      </PageContainer>
    </>
  );
}
