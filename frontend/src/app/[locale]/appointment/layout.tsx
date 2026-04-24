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
    fetchUiSectionObject('ui_appointment', locale),
  ]);

  const base = await buildMetadataFromSeo(seo, { locale, pathname: normPath('/appointment') });

  const pageTitle =
    readUiText(ui, 'ui_appointment_meta_title') ||
    readUiText(ui, 'ui_appointment_page_title', 'Appointment');
  const pageDescription =
    readUiText(ui, 'ui_appointment_meta_description') ||
    readUiText(ui, 'ui_appointment_page_lead', '');

  const ogRaw = readUiText(ui, 'ui_appointment_og_image', '');
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

export default function AppointmentLayout({ children }: { children: React.ReactNode }) {
  return children;
}

