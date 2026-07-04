import type { Metadata } from 'next';

import PageContainer from '@/components/common/PageContainer';
import SeoLandingArticle from '@/components/seo/SeoLandingArticle';
import { getLanding } from '@/components/seo/seo-landing-content';
import Banner from '@/layout/banner/Breadcrum';
import { buildPageMetadata } from '@/seo/server';
import SynastryPageClient from './SynastryPageClient';
import JsonLd from '@/seo/JsonLd';
import { graph } from '@/seo/jsonld';
import { webApplicationSchema } from '@/seo/toolSchemas';

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
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');

  return (
    <>
      <Banner title={getLanding('sinastri', locale).eyebrow} />
      <PageContainer className="min-h-screen bg-(--gm-bg)" verticalPadding="large">
        <JsonLd
          id="synastry-webapp"
          data={graph([
            webApplicationSchema({
              siteUrl,
              locale,
              path: '/sinastri',
              name: locale === 'tr' ? 'Sinastri Uyumu Hesaplayıcı' : 'Synastry Compatibility Calculator',
              description:
                locale === 'tr'
                  ? 'İki doğum bilgisi arasında ilişki uyumu ve astrolojik tema karşılaştırması yapan web aracı.'
                  : 'A web tool that compares two birth profiles for relationship compatibility and astrological themes.',
              featureList: ['Synastry comparison', 'Relationship compatibility', 'Birth chart comparison'],
            }),
          ])}
        />
        <SeoLandingArticle type="sinastri" locale={locale} />
        <SynastryPageClient />
      </PageContainer>
    </>
  );
}
