import type { Metadata } from 'next';
import React from 'react';
import HomeContent from '@/components/containers/home/HomeContent';

import { normPath, absUrlJoin } from '@/integrations/shared';
import { buildMetadataFromSeo, fetchSeoObject, fetchSeoPageObject, mergeSeoPageIntoSeo } from '@/seo/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  let seo = await fetchSeoObject(locale);
  const pageSeo = await fetchSeoPageObject(locale, 'home');
  seo = mergeSeoPageIntoSeo(seo, pageSeo);

  const metadata = await buildMetadataFromSeo(seo, { locale, pathname: normPath('/') });
  if (locale === 'tr') {
    metadata.title = 'GoldMoodAstro | Astroloji, Tarot ve Ruhsal Danışmanlık';
    metadata.description =
      'GoldMoodAstro’da onaylı danışmanlarla astroloji, tarot, numeroloji ve ruhsal rehberlik seansları alın; randevu, ödeme ve canlı görüşmeyi güvenle yönetin.';
  }
  return metadata;
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <HomeContent locale={locale} />;
}
