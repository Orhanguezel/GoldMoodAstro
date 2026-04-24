import type { Metadata } from 'next';
import type React from 'react';

import { normPath, absUrlJoin } from '@/integrations/shared';
import { buildMetadataFromSeo, fetchSeoObject, fetchUiSectionObject, readUiText } from '@/seo/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const [seo, ui] = await Promise.all([
    fetchSeoObject(locale),
    fetchUiSectionObject('ui_faqs', locale),
  ]);

  const base = await buildMetadataFromSeo(seo, { locale, pathname: normPath('/faqs') });

  const pageTitle =
    readUiText(ui, 'ui_faqs_meta_title') || readUiText(ui, 'ui_faqs_page_title', 'FAQs');
  const pageDescription =
    readUiText(ui, 'ui_faqs_meta_description') ||
    readUiText(ui, 'ui_faqs_page_description', '');

  const ogRaw = readUiText(ui, 'ui_faqs_og_image', '');
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

export default function FaqsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

