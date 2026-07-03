import type { Metadata } from 'next';

import ConsultantList from '@/components/containers/consultant/ConsultantList';
import { FUNNEL_CONFIG, type FunnelFeature } from '@/components/common/funnel.config';
import type { ConsultantPublic } from '@/integrations/rtk/public/consultants.public.endpoints';
import JsonLd from '@/seo/JsonLd';
import { breadcrumbSchema, graph, itemList } from '@/seo/jsonld';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ expertise?: string; topic?: string }>;
};
import { buildMetadataFromSeo, fetchSeoObject, fetchSeoPageObject, mergeSeoPageIntoSeo } from '@/seo/server';
import { fetchSetting } from '@/i18n/server';
import { normPath } from '@/integrations/shared';
import PageContainer from '@/components/common/PageContainer';
import Banner from '@/layout/banner/Breadcrum';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8094/api').replace(/\/$/, '');
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com').replace(/\/$/, '');

function absoluteUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

async function getConsultants(params: { expertise?: string; limit?: number; locale?: string }): Promise<ConsultantPublic[]> {
  const qs = new URLSearchParams();
  qs.set('light', '1');
  qs.set('limit', String(params.limit ?? 12));
  if (params.locale) qs.set('locale', params.locale);
  if (params.expertise) qs.set('expertise', params.expertise);

  try {
    const res = await fetch(`${API_BASE}/consultants?${qs.toString()}`, {
      next: { revalidate: 300 },
      headers: params.locale
        ? { 'Accept-Language': params.locale, 'x-locale': params.locale }
        : undefined,
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : (json?.data ?? []);
  } catch {
    return [];
  }
}

function localeFallbackTitle(locale: string) {
  if (locale === 'tr') return 'Danışmanları Keşfet';
  if (locale === 'de') return 'Berater entdecken';
  return 'Explore Consultants';
}

function readSettingLabel(value: unknown, locale: string): string {
  const parsed = (() => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  })();

  if (typeof parsed === 'string') return parsed.trim();
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return '';

  const label = (parsed as any).label;
  if (label && typeof label === 'object' && !Array.isArray(label)) {
    return (
      String(label[locale] || label.en || label.tr || Object.values(label)[0] || '')
        .trim()
    );
  }

  return String((parsed as any)[locale] || (parsed as any).en || (parsed as any).tr || '').trim();
}

async function getConsultantsPageTitle(locale: string) {
  const fallback = localeFallbackTitle(locale);
  const row = await fetchSetting('ui_consultantbrowse_page_title', locale, { revalidate: 600 });
  return readSettingLabel(row?.value, locale) || fallback;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  let seo = await fetchSeoObject(locale);
  const pageSeo = await fetchSeoPageObject(locale, 'consultants');
  seo = mergeSeoPageIntoSeo(seo, pageSeo);

  return buildMetadataFromSeo(seo, { locale, pathname: normPath('/consultants') });
}

export default async function ConsultantsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : {};
  // T28-4 — topic -> expertise mapping for funnel redirects.
  const topic = (sp.topic || '').trim() as FunnelFeature;
  const topicCfg = topic && topic in FUNNEL_CONFIG ? FUNNEL_CONFIG[topic] : null;
  const initialExpertise = (sp.expertise || topicCfg?.expertise || '').trim();

  const headline = topicCfg
    ? (locale === 'tr' ? topicCfg.headlineTr : topicCfg.headlineEn)
    : await getConsultantsPageTitle(locale);
  const consultants = await getConsultants({ expertise: initialExpertise, limit: 12, locale });
  const listUrl = `${SITE_URL}/${locale}/consultants`;
  const graphItems = [
    breadcrumbSchema([
      { name: 'GoldMoodAstro', item: `${SITE_URL}/${locale}` },
      { name: headline, item: listUrl },
    ]),
  ];
  const itemListSchema = consultants.length
    ? itemList({
        url: listUrl,
        name: 'GoldMoodAstro Consultants',
        items: consultants.map((consultant, index) => ({
          name: consultant.full_name || 'GoldMoodAstro Consultant',
          url: `${listUrl}/${encodeURIComponent(consultant.slug || consultant.id)}`,
          image: absoluteUrl(consultant.avatar_url),
          position: index + 1,
          rating: {
            value: Number(consultant.rating_avg || 0),
            count: Number(consultant.rating_count || 0),
          },
        })),
      })
    : null;
  if (itemListSchema) graphItems.push(itemListSchema);

  return (
    <>
      <Banner title={headline} />
      <PageContainer width="default" pad="large">
        <JsonLd id="consultants-schema" data={graph(graphItems)} />
        <ConsultantList locale={locale} initialExpertise={initialExpertise} initialData={consultants} />
      </PageContainer>
    </>
  );
}
