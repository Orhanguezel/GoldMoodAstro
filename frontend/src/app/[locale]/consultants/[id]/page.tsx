import type { Metadata } from 'next';

import ConsultantDetail from '@/components/containers/consultant/ConsultantDetail';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8094/api').replace(/\/$/, '');

async function fetchConsultantForMeta(id: string) {
  try {
    const res = await fetch(`${API_BASE}/consultants/${encodeURIComponent(id)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json;
  } catch {
    return null;
  }
}

import { buildMetadataFromSeo, fetchSeoObject, fetchSeoPageObject, mergeSeoPageIntoSeo } from '@/seo/server';
import { normPath } from '@/integrations/shared';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  const consultant = await fetchConsultantForMeta(id);
  const name = consultant?.full_name || (locale === 'tr' ? 'Danışman Detayı' : 'Consultant Detail');
  const bio = consultant?.bio || (
    locale === 'tr'
      ? 'Danışman profilini inceleyin, müsait slotlardan randevu alın.'
      : 'View consultant details and book an available session.'
  );

  let seo = await fetchSeoObject(locale);
  const pageSeo = await fetchSeoPageObject(locale, 'consultant-detail');
  seo = mergeSeoPageIntoSeo(seo, pageSeo);

  // Override title and description with dynamic data, but keep openGraph and twitter structure
  if (name) {
    seo.title_default = name;
  }
  if (bio) {
    seo.description = String(bio).slice(0, 160);
  }

  return buildMetadataFromSeo(seo, { locale, pathname: normPath(`/consultants/${id}`) });
}

export default async function ConsultantDetailPage({ params }: Props) {
  const { id, locale } = await params;
  return <ConsultantDetail id={id} locale={locale} />;
}
