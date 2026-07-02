import { baseApi } from '@/integrations/baseApi';

export type SeoEntityType = 'custom_page' | 'consultant' | 'astro_landing';
export type SeoGrade = 'good' | 'medium' | 'weak';

export type SeoQualityListItem = {
  entity_type: SeoEntityType;
  entity_id: string;
  locale: string;
  title: string | null;
  url: string | null;
  overall_score: number;
  grade: SeoGrade;
  adsense_ready: 0 | 1 | boolean;
  is_thin_content: 0 | 1 | boolean;
  index_ready: 0 | 1 | boolean;
  seo_index?: 0 | 1 | boolean;
  word_count: number;
};

export type SeoQualitySummary = {
  avg_score: number;
  by_type: Record<string, number>;
  adsense_risk_count: number;
  not_index_ready_count: number;
  duplicate_slug_count?: number;
};

export type SeoQualityListResponse = {
  items: SeoQualityListItem[];
  total: number;
  summary: SeoQualitySummary;
};

export type SeoBreakdownItem = {
  key: string;
  label: string;
  got: number;
  max: number;
  ok: boolean;
  hint?: string;
};

export type SeoQualityDetail = SeoQualityListItem & {
  meta_score: number;
  content_score: number;
  heading_score: number;
  media_score: number;
  schema_score: number;
  link_score: number;
  heading_count: number;
  image_count: number;
  has_meta_title: 0 | 1 | boolean;
  has_meta_description: 0 | 1 | boolean;
  has_h1: 0 | 1 | boolean;
  has_schema: 0 | 1 | boolean;
  breakdown: SeoBreakdownItem[] | string | null;
  calculated_at?: string;
  gsc?: GscUrlStatus | null;
};

export type GscUrlStatus = {
  url: string;
  state: 'indexed' | 'issue' | 'unknown';
  coverage_state?: string | null;
  verdict?: string | null;
  last_crawl?: string | null;
  inspected_at?: string | null;
  checked_at?: string | null;
  raw?: unknown;
};

export type GscSummary = {
  total_index_ready: number;
  indexed: number;
  issue: number;
  unknown: number;
  real_issue: number;
  checked_at?: string | null;
};

export type SeoQualityListParams = {
  entity_type?: SeoEntityType;
  locale?: string;
  q?: string;
  min_score?: number;
  max_score?: number;
  adsense_ready?: 0 | 1;
  index_ready?: 0 | 1;
  duplicate_slug?: 0 | 1;
  sort?: 'overall_score' | 'word_count';
  order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
};

const BASE = 'admin/seo';

function unwrap<T>(raw: any, fallback: T): T {
  return (raw?.data ?? raw ?? fallback) as T;
}

export const seoQualityAdminApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (build) => ({
    listSeoQuality: build.query<SeoQualityListResponse, SeoQualityListParams | void>({
      query: (params) => ({ url: `${BASE}/quality`, params: params ?? undefined }),
      transformResponse: (raw: any) => unwrap<SeoQualityListResponse>(raw, { items: [], total: 0, summary: { avg_score: 0, by_type: {}, adsense_risk_count: 0, not_index_ready_count: 0, duplicate_slug_count: 0 } }),
      providesTags: [{ type: 'SeoQuality' as any, id: 'LIST' }],
    }),
    getSeoQualityDetail: build.query<SeoQualityDetail, { type: SeoEntityType; id: string; locale?: string }>({
      query: ({ type, id, locale = 'tr' }) => ({ url: `${BASE}/quality/${type}/${id}`, params: { locale } }),
      transformResponse: (raw: any) => unwrap<SeoQualityDetail>(raw, {} as SeoQualityDetail),
      providesTags: (_r, _e, arg) => [{ type: 'SeoQuality' as any, id: `${arg.type}:${arg.id}:${arg.locale ?? 'tr'}` }],
    }),
    recalculateSeo: build.mutation<{ running: boolean }, { type?: SeoEntityType; id?: string; locale?: string } | void>({
      query: (body) => ({ url: `${BASE}/recalculate`, method: 'POST', body: body ?? {} }),
      transformResponse: (raw: any) => unwrap(raw, { running: true }),
      invalidatesTags: [{ type: 'SeoQuality' as any, id: 'LIST' }],
    }),
    setSeoIndex: build.mutation<{ updated: boolean; reason?: string }, { type: SeoEntityType; id: string; seo_index: 0 | 1 }>({
      query: ({ type, id, seo_index }) => ({ url: `${BASE}/quality/${type}/${id}`, method: 'PATCH', body: { seo_index } }),
      transformResponse: (raw: any) => unwrap(raw, { updated: false }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'SeoQuality' as any, id: 'LIST' },
        { type: 'SeoQuality' as any, id: `${arg.type}:${arg.id}:tr` },
      ],
    }),
    getGscSummary: build.query<GscSummary, void>({
      query: () => `${BASE}/gsc/summary`,
      transformResponse: (raw: any) => unwrap<GscSummary>(raw, { total_index_ready: 0, indexed: 0, issue: 0, unknown: 0, real_issue: 0, checked_at: null }),
      providesTags: [{ type: 'SeoQuality' as any, id: 'GSC' }],
    }),
    inspectGscUrls: build.mutation<{ configured: boolean; inspected: number; status: string }, { url?: string; urls?: string[] }>({
      query: (body) => ({ url: `${BASE}/gsc/inspect`, method: 'POST', body }),
      transformResponse: (raw: any) => unwrap(raw, { configured: false, inspected: 0, status: 'not_configured' }),
      invalidatesTags: [{ type: 'SeoQuality' as any, id: 'GSC' }],
    }),
  }),
});

export const {
  useListSeoQualityQuery,
  useGetSeoQualityDetailQuery,
  useGetGscSummaryQuery,
  useInspectGscUrlsMutation,
  useRecalculateSeoMutation,
  useSetSeoIndexMutation,
} = seoQualityAdminApi;
