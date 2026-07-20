import type { Metadata } from 'next';
import { Suspense } from 'react';

import PricingPageClient from './PricingPageClient';
import PageContainer from '@/components/common/PageContainer';
import SeoLandingArticle from '@/components/seo/SeoLandingArticle';
import JsonLd from '@/seo/JsonLd';
import { graph } from '@/seo/jsonld';
import { pricingOfferCatalogSchema } from '@/seo/toolSchemas';

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
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');

  return (
    <Suspense fallback={null}>
      <PageContainer verticalPadding="large">
        <JsonLd id="pricing-offer-catalog" data={graph([pricingOfferCatalogSchema(siteUrl, locale)])} />
        {/* Araç önce, uzun editoryal içerik sonra (2026-07-20 müşteri talebi):
            önceki sırada kullanıcı aracı görmek için ~4000px metin geçmek zorundaydı. */}
        <PricingPageClient locale={locale} />
        <SeoLandingArticle type="pricing" locale={locale} />
      </PageContainer>
    </Suspense>
  );
}
