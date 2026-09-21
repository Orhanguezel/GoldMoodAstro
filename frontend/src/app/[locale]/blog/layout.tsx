import type { Metadata } from 'next';
import type React from 'react';

import { normPath } from '@/integrations/shared';
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
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');
  const ogImage = `${siteUrl}/images/og/blog-2026.webp`;
  return {
    ...metadata,
    openGraph: {
      ...(metadata.openGraph || {}),
      images: [{ url: ogImage, width: 1200, height: 630, alt: 'GoldMoodAstro Blog' }],
    },
    twitter: {
      ...(metadata.twitter || {}),
      card: 'summary_large_image',
      images: [ogImage],
    },
  };
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
