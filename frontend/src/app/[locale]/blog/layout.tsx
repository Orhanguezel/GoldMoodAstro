import type { Metadata } from 'next';
import type React from 'react';

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
  const pageSeo = await fetchSeoPageObject(locale, 'blog');
  seo = mergeSeoPageIntoSeo(seo, pageSeo);

  const metadata = await buildMetadataFromSeo(seo, { locale, pathname: normPath('/blog') });
  return withLocalizedPageOg(metadata, localizedPageOgUrl(locale, '/blog'), 'GoldMoodAstro Blog');
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
