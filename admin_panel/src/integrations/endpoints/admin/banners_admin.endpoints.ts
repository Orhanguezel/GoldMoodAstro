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

// Backend {data:...} / {items:...} zarfını açar (RTK transformResponse için).
const unwrap = (res: unknown): unknown => {
  if (res && typeof res === 'object') {
    const o = res as Record<string, unknown>;
    if ('data' in o) return o.data;
    if ('items' in o) return o.items;
  }
  return res;
};

const extendedApi = baseApi.enhanceEndpoints({ addTagTypes: ['Banners'] as const });

export const bannersAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    listBannersAdmin: b.query<BannerRow[], AdminBannersListParams | undefined>({
      query: (params) => {
        const q = buildAdminBannersListParams(params);
        return { url: ADMIN_BASE, params: q };
      },
      transformResponse: (res: unknown): BannerRow[] => {
        const arr = unwrap(res);
        return Array.isArray(arr) ? arr.map(normalizeBannerRow) : [];
      },
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
      transformResponse: (res: unknown): BannerRow | null => {
        const d = unwrap(res);
        return d ? normalizeBannerRow(d) : null;
      },
      providesTags: (_r, _e, id) => [{ type: 'Banners', id }],
    }),

    createBannerAdmin: b.mutation<BannerRow, BannerCreatePayload>({
      query: (body) => ({
        url: ADMIN_BASE,
        method: 'POST',
        body,
      }),
      transformResponse: (res: unknown): BannerRow => normalizeBannerRow(unwrap(res)),
      invalidatesTags: [{ type: 'Banners', id: 'LIST' }],
    }),

    updateBannerAdmin: b.mutation<BannerRow, { id: string; body: BannerUpdatePayload }>({
      query: ({ id, body }) => ({
        url: `${ADMIN_BASE}/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: unknown): BannerRow => normalizeBannerRow(unwrap(res)),
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
