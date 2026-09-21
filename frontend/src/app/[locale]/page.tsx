import type { Metadata } from 'next';
import React from 'react';
import HomeContent from '@/components/containers/home/HomeContent';

import { normPath } from '@/integrations/shared';
import { localizedPageOgUrl, withLocalizedPageOg } from '@/lib/og/pageOgMetadata';
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
    const title = 'Astroloji, Tarot, Canlı Seans | GoldMoodAstro';
    const description =
      'GoldMoodAstro’da astroloji, tarot ve numeroloji için onaylı danışman seçin; canlı seans, güvenli ödeme ve kolay randevu deneyimini tek yerde yönetin.';
    metadata.title = { absolute: title };
    metadata.description = description;
    metadata.openGraph = { ...(metadata.openGraph || {}), title, description };
    metadata.twitter = { ...(metadata.twitter || {}), title, description };
  }
  return withLocalizedPageOg(metadata, localizedPageOgUrl(locale, '/'), 'GoldMoodAstro');
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <HomeContent locale={locale} />;
}
