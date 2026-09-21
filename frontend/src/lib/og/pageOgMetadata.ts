import type { Metadata } from 'next';

import { localizedPath } from '@/integrations/shared';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');

export function localizedPageOgUrl(locale: string, logicalPath: string): string {
  return `${SITE_URL}${localizedPath(locale, logicalPath, 'tr')}/opengraph-image`;
}

export function withLocalizedPageOg(metadata: Metadata, imageUrl: string, alt: string): Metadata {
  return {
    ...metadata,
    openGraph: {
      ...(metadata.openGraph || {}),
      images: [{ url: imageUrl, width: 1200, height: 630, alt }],
    },
    twitter: {
      ...(metadata.twitter || {}),
      card: 'summary_large_image',
      images: [imageUrl],
    },
  };
}
