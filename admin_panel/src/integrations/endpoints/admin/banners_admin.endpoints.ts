// =============================================================
// FILE: src/integrations/endpoints/admin/banners_admin.endpoints.ts
// FINAL — admin banners endpoints
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  BannerRow,
  AdminBannersListParams,
  BannerCreatePayload,
  BannerUpdatePayload,
} from '@/integrations/shared/banners';
import {
  buildAdminBannersListParams,
  normalizeBannerRow,
} from '@/integrations/shared/banners';

const ADMIN_BASE = '/admin/banners';

const extendedApi = baseApi.enhanceEndpoints({ addTagTypes: ['Banners'] as const });

export const bannersAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    listBannersAdmin: b.query<BannerRow[], AdminBannersListParams | undefined>({
      query: (params) => {
        const q = buildAdminBannersListParams(params);
        return { url: ADMIN_BASE, params: q };
      },
      transformResponse: (res: unknown): BannerRow[] =>
        Array.isArray(res) ? res.map(normalizeBannerRow) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((s) => ({ type: 'Banners' as const, id: s.id })),
              { type: 'Banners' as const, id: 'LIST' },
            ]
          : [{ type: 'Banners' as const, id: 'LIST' }],
    }),

    getBannerAdmin: b.query<BannerRow | null, string>({
      query: (id) => ({ url: `${ADMIN_BASE}/${id}` }),
      transformResponse: (res: unknown): BannerRow | null =>
        res ? normalizeBannerRow(res) : null,
      providesTags: (_r, _e, id) => [{ type: 'Banners', id }],
    }),

    createBannerAdmin: b.mutation<BannerRow, BannerCreatePayload>({
      query: (body) => ({
        url: ADMIN_BASE,
        method: 'POST',
        body,
      }),
      transformResponse: (res: unknown): BannerRow => normalizeBannerRow(res),
      invalidatesTags: [{ type: 'Banners', id: 'LIST' }],
    }),

    updateBannerAdmin: b.mutation<BannerRow, { id: string; body: BannerUpdatePayload }>({
      query: ({ id, body }) => ({
        url: `${ADMIN_BASE}/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: unknown): BannerRow => normalizeBannerRow(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Banners', id },
        { type: 'Banners', id: 'LIST' },
      ],
    }),

    deleteBannerAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({
        url: `${ADMIN_BASE}/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Banners', id },
        { type: 'Banners', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListBannersAdminQuery,
  useGetBannerAdminQuery,
  useCreateBannerAdminMutation,
  useUpdateBannerAdminMutation,
  useDeleteBannerAdminMutation,
} = bannersAdminApi;
