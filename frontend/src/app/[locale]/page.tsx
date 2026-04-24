import type { Metadata } from 'next';
import React from 'react';
import HomeContent from '@/components/containers/home/HomeContent';

import { normPath, absUrlJoin } from '@/integrations/shared';
import { buildMetadataFromSeo, fetchSeoObject, fetchUiSectionObject, readUiText } from '@/seo/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const [seo, ui] = await Promise.all([fetchSeoObject(locale), fetchUiSectionObject('ui_home', locale)]);

  const base = await buildMetadataFromSeo(seo, { locale, pathname: normPath('/') });

  const pageTitle =
    readUiText(ui, 'ui_home_meta_title') || readUiText(ui, 'ui_home_page_title', 'Home');
  const pageDescription =
    readUiText(ui, 'ui_home_meta_description') || readUiText(ui, 'ui_home_page_description', '');

  const ogRaw = readUiText(ui, 'ui_home_og_image', '');
  const baseUrl = base.metadataBase?.toString() || '';
  const ogAbs = ogRaw ? absUrlJoin(baseUrl, ogRaw) : '';

  return {
    ...base,
    title: pageTitle,
    ...(pageDescription ? { description: pageDescription } : {}),
    openGraph: {
      ...(base.openGraph || {}),
      title: pageTitle,
      ...(pageDescription ? { description: pageDescription } : {}),
      ...(ogAbs ? { images: [{ url: ogAbs }] } : {}),
    },
    twitter: {
      ...(base.twitter || {}),
      ...(ogAbs ? { images: [ogAbs] } : {}),
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <HomeContent locale={locale} />;
}
