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
} = auditAdminApi;
