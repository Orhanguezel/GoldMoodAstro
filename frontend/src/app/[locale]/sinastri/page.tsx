import type { Metadata } from 'next';

import PageContainer from '@/components/common/PageContainer';
import SeoLandingArticle from '@/components/seo/SeoLandingArticle';
import { getLanding } from '@/components/seo/seo-landing-content';
import Banner from '@/layout/banner/Breadcrum';
import { buildPageMetadata } from '@/seo/server';
import SynastryPageClient from './SynastryPageClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    pageKey: 'sinastri',
    pathname: '/sinastri',
    fallback: {
      title: 'Synastry and Love Compatibility Analysis | GoldMoodAstro',
      description: 'Discover relationship dynamics, attraction and growth areas between two birth charts with synastry analysis.',
    },
  });
}

export default async function SynastryPage({ params }: Props) {
  const { locale } = await params;

  return (
    <>
      <Banner title={getLanding('sinastri', locale).eyebrow} />
      <PageContainer className="min-h-screen bg-(--gm-bg)" verticalPadding="large">
        <SeoLandingArticle type="sinastri" locale={locale} />
        <SynastryPageClient />
      </PageContainer>
    </>
  );
}
