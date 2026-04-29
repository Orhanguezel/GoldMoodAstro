// =============================================================
// FILE: src/integrations/endpoints/admin/astrology_kb_admin.endpoints.ts
// FAZ 19 / T19-3 — Admin astrology_kb CRUD + bulk import
// =============================================================
import { baseApi } from '../../baseApi';
import type {
  AstrologyKbDto,
  AstrologyKbListQueryParams,
  AstrologyKbListResponse,
  AstrologyKbCreatePayload,
  AstrologyKbUpdatePayload,
  AstrologyKbBulkImportPayload,
  AstrologyKbBulkImportResult,
  AstrologyKbTranslationDraftPayload,
  AstrologyKbTranslationDraftResult,
} from '@/integrations/shared';

const astrologyKbAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listAstrologyKb: build.query<AstrologyKbListResponse, AstrologyKbListQueryParams | void>({
      query: (params) => ({ url: '/admin/astrology-kb', params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'AstrologyKb' as const, id })),
              { type: 'AstrologyKb', id: 'LIST' },
            ]
          : [{ type: 'AstrologyKb', id: 'LIST' }],
    }),
    getAstrologyKb: build.query<AstrologyKbDto, string>({
      query: (id) => `/admin/astrology-kb/${encodeURIComponent(id)}`,
      providesTags: (_r, _e, id) => [{ type: 'AstrologyKb', id }],
    }),
    createAstrologyKb: build.mutation<AstrologyKbDto, AstrologyKbCreatePayload>({
      query: (body) => ({ url: '/admin/astrology-kb', method: 'POST', body }),
      invalidatesTags: [{ type: 'AstrologyKb', id: 'LIST' }],
    }),
    updateAstrologyKb: build.mutation<
      AstrologyKbDto,
      { id: string; body: AstrologyKbUpdatePayload }
    >({
      query: ({ id, body }) => ({
        url: `/admin/astrology-kb/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'AstrologyKb', id },
        { type: 'AstrologyKb', id: 'LIST' },
      ],
    }),
    approveAstrologyKb: build.mutation<AstrologyKbDto, string>({
      query: (id) => ({
        url: `/admin/astrology-kb/${encodeURIComponent(id)}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AstrologyKb', id },
        { type: 'AstrologyKb', id: 'LIST' },
      ],
    }),
    rejectAstrologyKb: build.mutation<AstrologyKbDto, string>({
      query: (id) => ({
        url: `/admin/astrology-kb/${encodeURIComponent(id)}/reject`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'AstrologyKb', id },
        { type: 'AstrologyKb', id: 'LIST' },
      ],
    }),
    deleteAstrologyKb: build.mutation<{ ok?: boolean }, string>({
      query: (id) => ({
        url: `/admin/astrology-kb/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'AstrologyKb', id: 'LIST' }],
    }),
    bulkImportAstrologyKb: build.mutation<AstrologyKbBulkImportResult, AstrologyKbBulkImportPayload>({
      query: (body) => ({
        url: '/admin/astrology-kb/bulk-import',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'AstrologyKb', id: 'LIST' }],
    }),
    createAstrologyKbTranslationDrafts: build.mutation<
      AstrologyKbTranslationDraftResult,
      AstrologyKbTranslationDraftPayload | void
    >({
      query: (body) => ({
        url: '/admin/astrology-kb/translation-drafts',
        method: 'POST',
        body: body ?? { source_locale: 'en', target_locale: 'tr', limit: 100 },
      }),
      invalidatesTags: [{ type: 'AstrologyKb', id: 'LIST' }],
    }),
  }),
});

export const {
  useListAstrologyKbQuery,
  useGetAstrologyKbQuery,
  useCreateAstrologyKbMutation,
  useUpdateAstrologyKbMutation,
  useApproveAstrologyKbMutation,
  useRejectAstrologyKbMutation,
  useDeleteAstrologyKbMutation,
  useBulkImportAstrologyKbMutation,
  useCreateAstrologyKbTranslationDraftsMutation,
} = astrologyKbAdminApi;
