import type { Metadata } from 'next';

import PageContainer from '@/components/common/PageContainer';
import SeoLandingArticle from '@/components/seo/SeoLandingArticle';
import { getLanding } from '@/components/seo/seo-landing-content';
import Banner from '@/layout/banner/Breadcrum';
import { buildPageMetadata } from '@/seo/server';
import YildiznamePageClient from './YildiznamePageClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'yildizname',
    pathname: '/yildizname',
    fallback: {
      title: 'Yildizname Reading and Ebced Guide | GoldMoodAstro',
      description: 'Discover yildizname, ebced symbolism and lunar mansion guidance with responsible spiritual interpretation.',
    },
  });
}

export default async function YildiznamePage({ params }: Props) {
  const { locale } = await params;

  return (
    <>
      <Banner title={getLanding('yildizname', locale).eyebrow} />
      <PageContainer className="min-h-screen bg-(--gm-bg-deep)" verticalPadding="large">
        {/* Araç önce, uzun editoryal içerik sonra (2026-07-20 müşteri talebi):
            önceki sırada kullanıcı aracı görmek için ~4000px metin geçmek zorundaydı. */}
        <YildiznamePageClient />
        <SeoLandingArticle type="yildizname" locale={locale} />
      </PageContainer>
    </>
  );
}
