import type { Metadata } from 'next';
import { Suspense } from 'react';

import PricingPageClient from './PricingPageClient';
import PageContainer from '@/components/common/PageContainer';
import SeoLandingArticle from '@/components/seo/SeoLandingArticle';

type Props = {
  params: Promise<{ locale: string }>;
};

import { buildMetadataFromSeo, fetchSeoObject, fetchSeoPageObject, mergeSeoPageIntoSeo } from '@/seo/server';
import { normPath } from '@/integrations/shared';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  let seo = await fetchSeoObject(locale);
  const pageSeo = await fetchSeoPageObject(locale, 'pricing');
  seo = mergeSeoPageIntoSeo(seo, pageSeo);

  return buildMetadataFromSeo(seo, { locale, pathname: normPath('/pricing') });
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;

  return (
    <Suspense fallback={null}>
      <PageContainer verticalPadding="large">
        <SeoLandingArticle type="pricing" locale={locale} />
        <PricingPageClient locale={locale} />
      </PageContainer>
    </Suspense>
  );
}
