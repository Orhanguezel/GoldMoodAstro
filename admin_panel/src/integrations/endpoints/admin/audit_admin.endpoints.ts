// =============================================================
// FILE: src/integrations/rtk/endpoints/admin/audit_admin.endpoints.ts
// goldmoodastro – Admin Audit (RTK Query)
// FIX:
//  - List endpoints return { items, total }
//  - Daily endpoint returns { days, ...meta }
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import { coerceAuditList, coerceAuditMetricsDaily, coerceAuditGeoStats } from '@/integrations/shared';
import type {
  AuditAuthEventDto,
  AuditAuthEventsListQueryParams,
  AuditListResponse,
  AuditMetricsDailyQueryParams,
  AuditMetricsDailyResponseDto,
  AuditRequestLogDto,
  AuditRequestLogsListQueryParams,
  AuditGeoStatsQueryParams,
  AuditGeoStatsResponseDto,
} from '@/integrations/shared';

const BASE = 'admin/audit';

type ClearAuditTarget = 'requests' | 'auth' | 'all';
type ClearAuditResponse = {
  ok: boolean;
  deletedRequests: number;
  deletedAuth: number;
  deletedEvents: number;
};

export const auditAdminApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (build) => ({
    listAuditRequestLogsAdmin: build.query<
      AuditListResponse<AuditRequestLogDto>,
      AuditRequestLogsListQueryParams | void
    >({
      query: (params) => ({
        url: `${BASE}/request-logs`,
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (raw: any) => coerceAuditList<AuditRequestLogDto>(raw),
      providesTags: [{ type: 'AuditRequestLog' as const, id: 'LIST' }],
    }),

    listAuditAuthEventsAdmin: build.query<
      AuditListResponse<AuditAuthEventDto>,
      AuditAuthEventsListQueryParams | void
    >({
      query: (params) => ({
        url: `${BASE}/auth-events`,
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (raw: any) => coerceAuditList<AuditAuthEventDto>(raw),
      providesTags: [{ type: 'AuditAuthEvent' as const, id: 'LIST' }],
    }),

    getAuditMetricsDailyAdmin: build.query<
      AuditMetricsDailyResponseDto,
      AuditMetricsDailyQueryParams | void
    >({
      query: (params) => ({
        url: `${BASE}/metrics/daily`,
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (raw: any) => coerceAuditMetricsDaily(raw),
      providesTags: [{ type: 'AuditMetric' as const, id: 'DAILY' }],
    }),

    getAuditGeoStatsAdmin: build.query<
      AuditGeoStatsResponseDto,
      AuditGeoStatsQueryParams | void
    >({
      query: (params) => ({
        url: `${BASE}/geo-stats`,
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (raw: any) => coerceAuditGeoStats(raw),
      providesTags: [{ type: 'AuditMetric' as const, id: 'GEO' }],
    }),

    clearAuditLogsAdmin: build.mutation<ClearAuditResponse, { target?: ClearAuditTarget }>({
      query: ({ target = 'all' }) => ({
        url: `${BASE}/clear?target=${encodeURIComponent(target)}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'AuditRequestLog' as const, id: 'LIST' },
        { type: 'AuditAuthEvent' as const, id: 'LIST' },
        { type: 'AuditMetric' as const, id: 'DAILY' },
        { type: 'AuditMetric' as const, id: 'GEO' },
      ],
    }),

    getFunnelReportAdmin: build.query<
      any,
      { range?: string; segment?: string } | void
    >({
      query: (params) => ({
        url: `${BASE}/funnel`,
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'AuditMetric' as const, id: 'FUNNEL' }],
    }),

    getTrafficSourcesAdmin: build.query<
      any,
      { range?: string } | void
    >({
      query: (params) => ({
        url: `${BASE}/traffic-sources`,
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'AuditMetric' as const, id: 'TRAFFIC' }],
    }),

    getCohortsAdmin: build.query<
      any,
      { range?: string; metric?: string } | void
    >({
      query: (params) => ({
        url: `${BASE}/cohorts`,
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'AuditMetric' as const, id: 'COHORT' }],
    }),

    // Aylık trafik (admin hariç, backend is_admin=0 filtreli)
    getAuditMonthlyAdmin: build.query<
      Array<{ month: string; requests: number; unique_ips: number; errors: number; avg_response_time: number }>,
      { months?: number } | void
    >({
      query: (params) => ({
        url: `${BASE}/analytics/monthly`,
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (raw: any) => {
        const arr = Array.isArray(raw) ? raw : (raw?.items ?? raw?.data ?? []);
        return (Array.isArray(arr) ? arr : []).map((r: any) => ({
          month: String(r.month ?? ''),
          requests: Number(r.requests ?? 0),
          unique_ips: Number(r.unique_ips ?? 0),
          errors: Number(r.errors ?? 0),
          avg_response_time: Number(r.avg_response_time ?? 0),
        }));
      },
      providesTags: [{ type: 'AuditMetric' as const, id: 'MONTHLY' }],
    }),

    // Durum kodu dağılımı (2xx/3xx/4xx/5xx) — pasta grafik için
    getAuditStatusDistributionAdmin: build.query<
      Array<{ status_group: string; count: number }>,
      { created_from?: string; created_to?: string } | void
    >({
      query: (params) => ({
        url: `${BASE}/analytics/status-distribution`,
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (raw: any) => {
        const arr = Array.isArray(raw) ? raw : (raw?.items ?? raw?.data ?? []);
        return (Array.isArray(arr) ? arr : []).map((r: any) => ({
          status_group: String(r.status_group ?? 'other'),
          count: Number(r.count ?? 0),
        }));
      },
      providesTags: [{ type: 'AuditMetric' as const, id: 'STATUS' }],
    }),
  }),
});

export const {
  useListAuditRequestLogsAdminQuery,
  useListAuditAuthEventsAdminQuery,
  useGetAuditMetricsDailyAdminQuery,
  useGetAuditGeoStatsAdminQuery,
  useClearAuditLogsAdminMutation,
  useGetFunnelReportAdminQuery,
  useGetTrafficSourcesAdminQuery,
  useGetCohortsAdminQuery,
  useGetAuditMonthlyAdminQuery,
  useGetAuditStatusDistributionAdminQuery,
} = auditAdminApi;
