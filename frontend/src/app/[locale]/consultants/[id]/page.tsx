import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

import ConsultantDetail from '@/components/containers/consultant/ConsultantDetail';
import JsonLd from '@/seo/JsonLd';
import { breadcrumbSchema, consultantPersonSchema, graph, review as reviewSchema, service as serviceSchema } from '@/seo/jsonld';
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

type ConsultantReviewForSchema = {
  id: string;
  name?: string | null;
  rating?: string | number | null;
  comment?: string | null;
  created_at?: string | null;
  is_approved?: boolean | number | null;
  is_active?: boolean | number | null;
  is_verified?: boolean | number | null;
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

async function fetchConsultantReviewsForSchema(id: string, locale?: string): Promise<ConsultantReviewForSchema[]> {
  try {
    const qs = new URLSearchParams({
      target_type: 'consultant',
      target_id: id,
      active: 'true',
      approved: 'true',
      limit: '5',
      orderBy: 'created_at',
      order: 'desc',
    });
    if (locale) qs.set('locale', locale);

    const res = await fetch(`${API_BASE}/reviews?${qs.toString()}`, {
      next: { revalidate: 300 },
      headers: locale
        ? { 'Accept-Language': locale, 'x-locale': locale }
        : undefined,
    });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data ?? json;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function formatPrice(value: string | number | null | undefined, currency = 'TRY') {
  const price = Number(value ?? 0);
  if (!Number.isFinite(price)) return '';
  if (price <= 0) return currency === 'TRY' ? 'Ücretsiz' : 'Free';
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${Math.round(price)} ${currency}`;
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
  const consultant = await fetchConsultantForMeta(id, locale) as ConsultantForSchema | null;
  const consultantId = consultant?.id || id;
  const [services, reviews] = await Promise.all([
    fetchConsultantServicesForSchema(consultantId),
    fetchConsultantReviewsForSchema(consultantId, locale),
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
  const personId = `${pageUrl}#person`;
  const expertiseItems = asStringArray(consultant?.expertise);
  const languageItems = asStringArray(consultant?.languages);

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

    for (const service of services) {
      graphItems.push(
        serviceSchema({
          id: `${pageUrl}#service-${service.id}`,
          name: service.name,
          description: service.description || undefined,
          providerId: personId,
          serviceType: service.name,
          areaServed: 'Turkey',
          durationMinutes: Number(service.duration_minutes ?? 0) || undefined,
          offers: {
            price: Number(service.is_free ? 0 : service.price ?? consultant.session_price ?? 0),
            priceCurrency: service.currency || consultant.currency || 'TRY',
            url: `${pageUrl}?serviceId=${encodeURIComponent(service.id)}`,
          },
        }),
      );
    }

    for (const item of reviews) {
      const body = String(item.comment || '').trim();
      const rating = Number(item.rating ?? 0);
      if (!body || !Number.isFinite(rating) || rating <= 0) continue;
      graphItems.push(
        reviewSchema({
          itemReviewedId: personId,
          itemReviewedName: consultantName,
          authorName: String(item.name || 'GoldMoodAstro danışanı').trim(),
          reviewBody: body,
          ratingValue: rating,
          datePublished: item.created_at || undefined,
        }),
      );
    }
  }

  const schema = graph(graphItems);

  return (
    <>
      <JsonLd id="consultant-person" data={schema} />
      <PageContainer className="bg-(--gm-bg) text-(--gm-text)" verticalPadding="large">
        {consultant && (
          <section className="mx-auto mb-12 max-w-6xl rounded-[2rem] border border-(--gm-border-soft) bg-(--gm-surface) p-6 shadow-(--gm-shadow-soft) md:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-(--gm-gold-dim)">
                  Onaylı Danışman Profili
                </p>
                <h1 className="mb-4 font-serif text-4xl leading-tight text-(--gm-text) md:text-5xl">
                  {consultantName}
                </h1>
                {consultant.bio && (
                  <p className="text-lg leading-relaxed text-(--gm-text-dim)">
                    {consultant.bio}
                  </p>
                )}

                {expertiseItems.length > 0 && (
                  <div className="mt-6">
                    <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-(--gm-gold)">
                      Uzmanlık Alanları
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {expertiseItems.map((item) => (
                        <span key={item} className="rounded-full border border-(--gm-gold)/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-(--gm-gold)">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {languageItems.length > 0 && (
                  <p className="mt-5 text-sm text-(--gm-text-dim)">
                    Görüşme dilleri: {languageItems.map((item) => item.toUpperCase()).join(', ')}
                  </p>
                )}
              </div>

              <aside className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-bg-deep) p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <span className="text-sm text-(--gm-text-dim)">Puan</span>
                  <strong className="text-2xl text-(--gm-gold)">
                    {ratingValue > 0 ? ratingValue.toFixed(1) : 'Yeni'}
                  </strong>
                </div>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <span className="text-sm text-(--gm-text-dim)">Yorum</span>
                  <strong className="text-xl text-(--gm-text)">{ratingCount}</strong>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-(--gm-text-dim)">Başlangıç</span>
                  <strong className="text-xl text-(--gm-text)">
                    {formatPrice(consultant.session_price, consultant.currency || 'TRY')}
                  </strong>
                </div>
              </aside>
            </div>

            {services.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-(--gm-gold)">
                  Hizmetler ve Ücretler
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {services.slice(0, 6).map((service) => (
                    <article key={service.id} className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-bg-deep) p-5">
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <h3 className="font-serif text-xl text-(--gm-text)">{service.name}</h3>
                        <span className="shrink-0 rounded-full bg-(--gm-gold)/10 px-3 py-1 text-xs font-bold text-(--gm-gold)">
                          {formatPrice(service.price, service.currency || consultant.currency || 'TRY')}
                        </span>
                      </div>
                      {service.description && (
                        <p className="text-sm leading-relaxed text-(--gm-text-dim)">
                          {service.description}
                        </p>
                      )}
                      {service.duration_minutes && (
                        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-(--gm-muted)">
                          {service.duration_minutes} dakika
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}

            {reviews.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-(--gm-gold)">
                  Danışan Yorumları
                </h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {reviews.slice(0, 3).map((item) => (
                    <article key={item.id} className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-bg-deep) p-5">
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <strong className="text-sm text-(--gm-text)">{item.name || 'GoldMoodAstro danışanı'}</strong>
                        <span className="text-sm font-bold text-(--gm-gold)">★ {Number(item.rating || 0).toFixed(0)}</span>
                      </div>
                      {item.comment && (
                        <p className="text-sm leading-relaxed text-(--gm-text-dim)">
                          {item.comment}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
        <ConsultantDetail id={id} locale={locale} />
      </PageContainer>
    </>
  );
}
