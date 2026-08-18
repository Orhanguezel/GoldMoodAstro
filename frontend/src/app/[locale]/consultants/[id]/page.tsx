import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

import ConsultantDetail from '@/components/containers/consultant/ConsultantDetail';
import BookingCtaButton from '@/components/containers/consultant/BookingCtaButton';
import JsonLd from '@/seo/JsonLd';
import { breadcrumbSchema, consultantPersonSchema, graph, review as reviewSchema, service as serviceSchema } from '@/seo/jsonld';
import { buildMetadataFromSeo, fetchSeoObject, fetchSeoPageObject, mergeSeoPageIntoSeo } from '@/seo/server';
import { localizedPath, normPath } from '@/integrations/shared';
import {
  DEFAULT_CURRENCY_CONFIG,
  displayCurrencyFor,
  formatMoney,
  parseCurrencyConfig,
  type CurrencyConfig,
} from '@/lib/money';
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
  supports_video?: number | null;
  total_sessions?: number | null;
  is_available?: number | null;
  min_service_price?: string | number | null;
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

// Danışman gerçekten yoksa (API 404) bunu geçici hatadan AYIRMAK gerekir:
// olmayan slug 200 dönerse Google bunu soft-404 sayar (test-danisman böyle
// indekslenmişti); geçici API hatasında 404 basmak ise geçerli sayfayı
// dizinden düşürür. Bu yüzden ayrı bir bayrak taşıyoruz.
async function fetchConsultantForMeta(
  id: string,
  locale?: string,
): Promise<{ data: any; missing: boolean }> {
  try {
    const qs = locale ? `?locale=${encodeURIComponent(locale)}` : '';
    const res = await fetch(`${API_BASE}/consultants/${encodeURIComponent(id)}${qs}`, {
      next: { revalidate: 300 },
      headers: locale
        ? { 'Accept-Language': locale, 'x-locale': locale }
        : undefined,
    });
    if (res.status === 404 || res.status === 410) return { data: null, missing: true };
    if (!res.ok) return { data: null, missing: false };
    const json = await res.json();
    return { data: json?.data ?? json, missing: false };
  } catch {
    return { data: null, missing: false };
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

// Uzmanlık ve dil rozetleri DB'den çevrilir; ham slug göstermek 3 dil desteğini
// bozuyordu (BİRTH_CHART / "Görüşme dilleri: TR" gibi). Kaynak: aynı listeleri
// kullanan istemci bileşeni ConsultantDetail.tsx.
async function fetchExpertiseLabels(locale: string): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_BASE}/service-categories?locale=${encodeURIComponent(locale)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return {};
    const json = await res.json();
    const data = json?.data ?? json;
    if (!Array.isArray(data)) return {};
    return Object.fromEntries(
      data
        .filter((c: any) => c?.slug && c?.name)
        .map((c: any) => [String(c.slug), String(c.name)]),
    );
  } catch {
    return {};
  }
}

async function fetchLanguageLabels(locale: string): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_BASE}/languages`, { next: { revalidate: 3600 } });
    if (!res.ok) return {};
    const json = await res.json();
    const data = json?.data ?? json;
    if (!Array.isArray(data)) return {};
    const key = locale === 'tr' ? 'name_tr' : locale === 'de' ? 'name_de' : 'name_en';
    return Object.fromEntries(
      data
        .filter((l: any) => l?.slug)
        .map((l: any) => [String(l.slug), String(l[key] || l.name_en || l.slug)]),
    );
  } catch {
    return {};
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

// Kur ayarı sunucuda da okunur: /de ve /en ziyaretçisi € görmeli, aksi halde
// ödeme sayfasındaki tutar (backend aynı ayarla çeviriyor) sayfadakinden farklı olur.
async function fetchCurrencyConfig(): Promise<CurrencyConfig> {
  try {
    const res = await fetch(`${API_BASE}/site_settings/platform_currency?locale=*`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return DEFAULT_CURRENCY_CONFIG;
    const json = await res.json();
    const value = (json?.data ?? json)?.value;
    return value ? parseCurrencyConfig(value) : DEFAULT_CURRENCY_CONFIG;
  } catch {
    return DEFAULT_CURRENCY_CONFIG;
  }
}

function formatPrice(value: string | number | null | undefined, currency = 'TRY', locale = 'en') {
  const price = Number(value ?? 0);
  if (!Number.isFinite(price)) return '';
  if (price <= 0) return locale === 'de' ? 'Kostenlos' : 'Free';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${Math.round(price)} ${currency}`;
  }
}

function consultantPageCopy(locale: string) {
  if (locale === 'tr') return {
    verified: 'Onaylı Danışman Profili', expertise: 'Uzmanlık Alanları', languages: 'Görüşme dilleri',
    rating: 'Puan', newLabel: 'Yeni', reviews: 'Yorum', starting: 'Başlangıç',
    services: 'Hizmetler ve Ücretler', testimonials: 'Danışan Yorumları', client: 'GoldMoodAstro danışanı',
    duration: 'Seans süresi', minutes: 'dk', book: 'Randevu Al',
    secureNote: 'Ödeme güvenli altyapı üzerinden alınır. Görüşme uygulama içinde yapılır.',
  };
  if (locale === 'de') return {
    verified: 'Verifiziertes Beraterprofil', expertise: 'Fachgebiete', languages: 'Gesprächssprachen',
    rating: 'Bewertung', newLabel: 'Neu', reviews: 'Bewertungen', starting: 'Ab',
    services: 'Leistungen und Preise', testimonials: 'Kundenbewertungen', client: 'GoldMoodAstro-Kunde',
    duration: 'Sitzungsdauer', minutes: 'Min.', book: 'Termin buchen',
    secureNote: 'Die Zahlung erfolgt über eine sichere Infrastruktur. Das Gespräch findet in der App statt.',
  };
  return {
    verified: 'Verified Consultant Profile', expertise: 'Areas of Expertise', languages: 'Session languages',
    rating: 'Rating', newLabel: 'New', reviews: 'Reviews', starting: 'Starting at',
    services: 'Services and Pricing', testimonials: 'Client Reviews', client: 'GoldMoodAstro client',
    duration: 'Session length', minutes: 'min', book: 'Book a session',
    secureNote: 'Payment is handled by a secure provider. The session takes place inside the app.',
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  const { data: consultant } = await fetchConsultantForMeta(id, locale);
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
  const copy = consultantPageCopy(locale);
  const { data: consultantData, missing: consultantMissing } = await fetchConsultantForMeta(id, locale);
  // Olmayan slug → gerçek 404. Soft-404 (200 + boş içerik) Search Console'da
  // "taranan ama dizine eklenmeyen" olarak birikiyordu.
  if (consultantMissing) notFound();
  const consultant = consultantData as ConsultantForSchema | null;
  const consultantId = consultant?.id || id;
  const [services, reviews, expertiseLabels, languageLabels, currencyConfig] = await Promise.all([
    fetchConsultantServicesForSchema(consultantId),
    fetchConsultantReviewsForSchema(consultantId, locale),
    fetchExpertiseLabels(locale),
    fetchLanguageLabels(locale),
    fetchCurrencyConfig(),
  ]);
  const displayCurrency = displayCurrencyFor(locale, currencyConfig);
  const toDisplay = (amount: string | number | null | undefined) =>
    formatMoney(amount, locale, currencyConfig, { decimals: 0 });
  // Yapısal veri ekranda yazan tutarla AYNI olmalı; farklı olursa Google
  // "fiyat uyuşmuyor" der. Bu yüzden schema da ziyaretçinin para biriminde.
  const toDisplayAmount = (amount: string | number | null | undefined) => {
    const value = Number(amount ?? 0);
    if (!Number.isFinite(value)) return 0;
    if (displayCurrency === currencyConfig.base) return value;
    return Math.round(value * (currencyConfig.rates[displayCurrency] ?? 1) * 100) / 100;
  };

  // Keep the URL on the name slug: redirect id/old slug params to the current slug.
  // This does not depend on UUID_RE; when a slug exists and differs, redirect.
  // Canonical id->slug redirects live in middleware as real HTTP 308s. This is a fallback
  // because Next 16 streaming can swallow server-component redirects.
  const slug = consultant?.slug?.trim();
  if (slug && decodeURIComponent(id) !== slug) {
    permanentRedirect(localizedPath(locale, `/consultants/${slug}`, 'tr'));
  }

  const canonicalParam = slug || id;
  const pageUrl = `${SITE_URL}${localizedPath(locale, `/consultants/${encodeURIComponent(canonicalParam)}`, 'tr')}`;
  const consultantsUrl = `${SITE_URL}${localizedPath(locale, '/consultants', 'tr')}`;
  const consultantName = consultant?.full_name?.trim() || 'GoldMoodAstro Consultant';
  const ratingValue = Number(consultant?.rating_avg ?? 0);
  const ratingCount = Number(consultant?.rating_count ?? 0);
  const personId = `${pageUrl}#person`;
  // Kartla AYNI kural: temel ücret 0 ise "başlangıç" en ucuz aktif hizmettir.
  // Aksi halde sayfada 0 ₺ yazıyordu ama listede fiyat görünüyordu.
  const basePrice = Number(consultant?.session_price ?? 0);
  const minServicePrice = Number(consultant?.min_service_price ?? 0);
  const startingPrice = basePrice > 0 ? basePrice : minServicePrice;
  const expertiseItems = asStringArray(consultant?.expertise);
  const languageItems = asStringArray(consultant?.languages);

  const graphItems = [
    breadcrumbSchema([
      { name: 'GoldMoodAstro', item: `${SITE_URL}/${locale}` },
      { name: 'Consultants', item: consultantsUrl },
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
          price: toDisplayAmount(service.price ?? consultant.session_price ?? 0),
          priceCurrency: displayCurrency,
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
            price: toDisplayAmount(service.is_free ? 0 : service.price ?? consultant.session_price ?? 0),
            priceCurrency: displayCurrency,
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
          authorName: String(item.name || (locale === 'de' ? 'GoldMoodAstro-Kunde' : 'GoldMoodAstro client')).trim(),
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
                  {copy.verified}
                </p>
                <h1 className="mb-4 font-serif text-4xl leading-tight text-(--gm-text) md:text-5xl">
                  {consultantName}
                </h1>
                {consultant.bio && (
                  <p className="whitespace-pre-line text-lg leading-relaxed text-(--gm-text-dim)">
                    {consultant.bio}
                  </p>
                )}

                {expertiseItems.length > 0 && (
                  <div className="mt-6">
                    <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-(--gm-gold)">
                      {copy.expertise}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {expertiseItems.map((item) => (
                        <span key={item} className="rounded-full border border-(--gm-gold)/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-(--gm-gold)">
                          {expertiseLabels[item] || item.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {languageItems.length > 0 && (
                  <p className="mt-5 text-sm text-(--gm-text-dim)">
                    {copy.languages}: {languageItems.map((item) => languageLabels[item] || item.toUpperCase()).join(', ')}
                  </p>
                )}
              </div>

              {/* self-start: kart, uzun biyografi yüzünden ESNEMESİN. Önceden
                  sağdaki kutu sol sütun kadar uzuyordu ve altı kocaman boş
                  kalıyordu (2026-08-17 ekran görüntüsü). */}
              <aside className="self-start rounded-2xl border border-(--gm-border-soft) bg-(--gm-bg-deep) p-6">
                {/* Fotoğraf: bu blokta hiç yoktu, danışman sayfasında yüz görünmüyordu. */}
                {consultant.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={absoluteUrl(consultant.avatar_url)}
                    alt={consultantName}
                    className="mb-5 aspect-square w-full rounded-2xl border border-(--gm-border-soft) object-cover"
                  />
                ) : null}

                <div className="mb-5 flex items-center justify-between gap-4">
                  <span className="text-sm text-(--gm-text-dim)">{copy.rating}</span>
                  <strong className="text-2xl text-(--gm-gold)">
                    {ratingValue > 0 ? ratingValue.toFixed(1) : copy.newLabel}
                  </strong>
                </div>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <span className="text-sm text-(--gm-text-dim)">{copy.reviews}</span>
                  <strong className="text-xl text-(--gm-text)">{ratingCount}</strong>
                </div>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <span className="text-sm text-(--gm-text-dim)">{copy.starting}</span>
                  <strong className="text-xl text-(--gm-text)">
                    {toDisplay(startingPrice)}
                  </strong>
                </div>

                {consultant.session_duration ? (
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <span className="text-sm text-(--gm-text-dim)">{copy.duration}</span>
                    <strong className="text-base text-(--gm-text)">
                      {consultant.session_duration} {copy.minutes}
                    </strong>
                  </div>
                ) : null}

                {languageItems.length > 0 ? (
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <span className="text-sm text-(--gm-text-dim)">{copy.languages}</span>
                    <strong className="text-right text-sm text-(--gm-text)">
                      {languageItems.map((item) => languageLabels[item] || item.toUpperCase()).join(', ')}
                    </strong>
                  </div>
                ) : null}

                {/* Aynı sayfadaki randevu bölümüne iner. Önceden sayfanın kendi
                    adresine link veriyordu: tıklayınca hiçbir şey olmuyor gibi
                    görünüyordu, kullanıcı randevu alanının altta olduğunu bilmiyordu. */}
                <BookingCtaButton
                  label={copy.book}
                  className="mt-2 block rounded-full bg-(--gm-gold) px-6 py-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-(--gm-bg-deep)"
                />

                <p className="mt-3 text-center text-[10px] leading-relaxed text-(--gm-muted)">
                  {copy.secureNote}
                </p>
              </aside>
            </div>

            {services.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-(--gm-gold)">
                  {copy.services}
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {services.slice(0, 6).map((service) => (
                    <article key={service.id} className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-bg-deep) p-5">
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <h3 className="font-serif text-xl text-(--gm-text)">{service.name}</h3>
                        <span className="shrink-0 rounded-full bg-(--gm-gold)/10 px-3 py-1 text-xs font-bold text-(--gm-gold)">
                          {toDisplay(service.price)}
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
                  {copy.testimonials}
                </h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {reviews.slice(0, 3).map((item) => (
                    <article key={item.id} className="rounded-2xl border border-(--gm-border-soft) bg-(--gm-bg-deep) p-5">
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <strong className="text-sm text-(--gm-text)">{item.name || copy.client}</strong>
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
