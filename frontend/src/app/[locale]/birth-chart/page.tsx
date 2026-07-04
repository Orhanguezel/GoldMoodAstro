import type { Metadata } from 'next';
import BirthChartPageClient from './BirthChartPageClient';

import { buildMetadataFromSeo, fetchSeoObject, fetchSeoPageObject, mergeSeoPageIntoSeo } from '@/seo/server';
import { normPath } from '@/integrations/shared';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  let seo = await fetchSeoObject(locale);
  const pageSeo = await fetchSeoPageObject(locale, 'birth-chart');
  seo = mergeSeoPageIntoSeo(seo, pageSeo);

  return buildMetadataFromSeo(seo, { locale, pathname: normPath('/birth-chart') });
}

import PageContainer from '@/components/common/PageContainer';
import Banner from '@/layout/banner/Breadcrum';
import SeoLandingArticle from '@/components/seo/SeoLandingArticle';
import { getLanding } from '@/components/seo/seo-landing-content';
import JsonLd from '@/seo/JsonLd';
import { graph } from '@/seo/jsonld';
import { webApplicationSchema } from '@/seo/toolSchemas';

export default async function BirthChartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');

  return (
    <>
      <Banner title={getLanding('birth-chart', locale).eyebrow} />
      <PageContainer width="wide" pad="none">
        <JsonLd
          id="birth-chart-webapp"
          data={graph([
            webApplicationSchema({
              siteUrl,
              locale,
              path: '/birth-chart',
              name: locale === 'tr' ? 'Doğum Haritası Hesaplayıcı' : 'Birth Chart Calculator',
              description:
                locale === 'tr'
                  ? 'Doğum tarihi, saat ve konuma göre temel doğum haritası yerleşimlerini hesaplayan web aracı.'
                  : 'A web tool that calculates core birth chart placements from birth date, time and location.',
              featureList: ['Birth chart calculation', 'Planet placements', 'Zodiac signs'],
            }),
          ])}
        />
        <SeoLandingArticle type="birth-chart" locale={locale} />
        <BirthChartPageClient />
      </PageContainer>
    </>
  );
}
