import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

import ConsultantDetail from '@/components/containers/consultant/ConsultantDetail';
import JsonLd from '@/seo/JsonLd';
import { breadcrumbSchema, consultantPersonSchema, graph } from '@/seo/jsonld';
import { buildMetadataFromSeo, fetchSeoObject, fetchSeoPageObject, mergeSeoPageIntoSeo } from '@/seo/server';
import { normPath } from '@/integrations/shared';
import PageContainer from '@/components/common/PageContainer';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

// Keep UUID -> slug permanent redirects evaluated on every request.
// ISR/Full Route Cache is disabled so redirects do not get stuck as static 200s.
export const dynamic = 'force-dynamic';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8094/api').replace(/\/$/, '');
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');

type ConsultantForSchema = {
  id: string;
  slug?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: string | null;
  expertise?: string[] | string | null;
  languages?: string[] | string | null;
  session_price?: string | number | null;
  session_duration?: number | null;
  currency?: string | null;
  rating_avg?: string | number | null;
  rating_count?: number | null;
};

type ConsultantServiceForSchema = {
  id: string;
  name: string;
  description?: string | null;
  duration_minutes?: number | null;
  price?: string | number | null;
  currency?: string | null;
  is_free?: number | boolean | null;
};

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value !== 'string') return [];
  const raw = value.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
  } catch {}
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

function absoluteUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

async function fetchConsultantForMeta(id: string, locale?: string) {
  try {
    const qs = locale ? `?locale=${encodeURIComponent(locale)}` : '';
    const res = await fetch(`${API_BASE}/consultants/${encodeURIComponent(id)}${qs}`, {
      next: { revalidate: 300 },
      headers: locale
        ? { 'Accept-Language': locale, 'x-locale': locale }
        : undefined,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json;
  } catch {
    return null;
  }
}

async function fetchConsultantServicesForSchema(id: string): Promise<ConsultantServiceForSchema[]> {
  try {
    const res = await fetch(`${API_BASE}/consultants/${encodeURIComponent(id)}/services`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data ?? json;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  const consultant = await fetchConsultantForMeta(id, locale);
  const name = consultant?.meta_title || consultant?.full_name || 'Consultant Detail';
  const bio = consultant?.meta_description || consultant?.bio || (
    'View consultant details and book an available session.'
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
  if (consultant?.og_image) {
    seo.open_graph = { ...(seo.open_graph || {}), image: consultant.og_image };
  }

  const canonicalParam = consultant?.slug?.trim() || id;
  return buildMetadataFromSeo(seo, { locale, pathname: normPath(`/consultants/${canonicalParam}`) });
}

export default async function ConsultantDetailPage({ params }: Props) {
  const { id, locale } = await params;
  const [consultant, services] = await Promise.all([
    fetchConsultantForMeta(id, locale) as Promise<ConsultantForSchema | null>,
    fetchConsultantServicesForSchema(id),
  ]);

  // Keep the URL on the name slug: redirect id/old slug params to the current slug.
  // This does not depend on UUID_RE; when a slug exists and differs, redirect.
  // Canonical id->slug redirects live in middleware as real HTTP 308s. This is a fallback
  // because Next 16 streaming can swallow server-component redirects.
  const slug = consultant?.slug?.trim();
  if (slug && decodeURIComponent(id) !== slug) {
    permanentRedirect(`/${locale}/consultants/${slug}`);
  }

  const canonicalParam = slug || id;
  const pageUrl = `${SITE_URL}/${locale}/consultants/${encodeURIComponent(canonicalParam)}`;
  const consultantName = consultant?.full_name?.trim() || 'GoldMoodAstro Consultant';
  const ratingValue = Number(consultant?.rating_avg ?? 0);
  const ratingCount = Number(consultant?.rating_count ?? 0);

  const graphItems = [
    breadcrumbSchema([
      { name: 'GoldMoodAstro', item: `${SITE_URL}/${locale}` },
      { name: 'Consultants', item: `${SITE_URL}/${locale}/consultants` },
      { name: consultantName, item: pageUrl },
    ]),
  ];

  if (consultant) {
    graphItems.push(
      consultantPersonSchema({
        id: `${pageUrl}#person`,
        name: consultantName,
        url: pageUrl,
        image: absoluteUrl(consultant.avatar_url),
        jobTitle: 'Spiritual Consultant',
        description: consultant.bio || undefined,
        knowsAbout: asStringArray(consultant.expertise),
        knowsLanguage: asStringArray(consultant.languages),
        worksForId: `${SITE_URL}/#org`,
        services: services.map((service) => ({
          name: service.name,
          description: service.description || undefined,
          price: Number(service.price ?? consultant.session_price ?? 0),
          priceCurrency: service.currency || consultant.currency || 'TRY',
          durationMinutes: Number(service.duration_minutes ?? consultant.session_duration ?? 0) || undefined,
          isFree: service.is_free === 1 || service.is_free === true,
          url: `${pageUrl}?serviceId=${encodeURIComponent(service.id)}`,
        })),
        rating: ratingCount > 0 && Number.isFinite(ratingValue)
          ? { value: ratingValue, count: ratingCount }
          : undefined,
      }),
    );
  }

  const schema = graph(graphItems);

  return (
    <>
      <JsonLd id="consultant-person" data={schema} />
      <PageContainer className="bg-(--gm-bg) text-(--gm-text)" verticalPadding="large">
        <ConsultantDetail id={id} locale={locale} />
      </PageContainer>
    </>
  );
}
