// ===================================================================
// FILE: frontend/src/integrations/endpoints/brands.admin.endpoints.ts
// FINAL — Brand admin endpoints
// - base: /admin/brands
// - unwrap tolerant
// ===================================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  BrandLogoMerged,
  BrandListParams,
  CreateBrandLogoInput,
  PatchBrandLogoInput,
} from '@/integrations/shared';
import { unwrap, toAdminBrandQuery } from '@/integrations/shared';

const BRANDS = '/admin/brands';

export type BrandListResult = { items: BrandLogoMerged[]; total: number };

export const brandsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listBrandsAdmin: b.query<BrandListResult, BrandListParams | void>({
      query: (p) => ({ url: BRANDS, params: toAdminBrandQuery(p) }),
      transformResponse: (raw: any, meta) => {
        const items = Array.isArray(raw)
          ? (raw as BrandLogoMerged[])
          : unwrap<BrandLogoMerged[]>(raw);
        const totalHeader = meta?.response?.headers.get('x-total-count');
        const totalFromHeader = totalHeader ? Number(totalHeader) : Number.NaN;
        const total = Number.isFinite(totalFromHeader) ? totalFromHeader : items.length;
        return { items, total };
      },
      providesTags: (res) =>
        res?.items?.length
          ? [
              { type: 'Brand' as const, id: 'LIST' },
              ...res.items.map((x) => ({ type: 'Brand' as const, id: x.id })),
            ]
          : [{ type: 'Brand' as const, id: 'LIST' }],
    }),

    createBrandAdmin: b.mutation<BrandLogoMerged, CreateBrandLogoInput>({
      query: (body) => ({ url: BRANDS, method: 'POST', body }),
      transformResponse: (raw: any) => unwrap<BrandLogoMerged>(raw),
      invalidatesTags: () => [{ type: 'Brand' as const, id: 'LIST' }],
    }),

    updateBrandAdmin: b.mutation<BrandLogoMerged, { id: string; patch: PatchBrandLogoInput }>({
      query: ({ id, patch }) => ({ url: `${BRANDS}/${id}`, method: 'PATCH', body: patch }),
      transformResponse: (raw: any) => unwrap<BrandLogoMerged>(raw),
      invalidatesTags: (_res, _e, arg) => [
        { type: 'Brand' as const, id: 'LIST' },
        { type: 'Brand' as const, id: arg.id },
      ],
    }),

    removeBrandAdmin: b.mutation<{ ok: true } | void, { id: string }>({
      query: ({ id }) => ({ url: `${BRANDS}/${id}`, method: 'DELETE' }),
      transformResponse: (raw: any) => unwrap<any>(raw),
      invalidatesTags: (_res, _e, arg) => [
        { type: 'Brand' as const, id: 'LIST' },
        { type: 'Brand' as const, id: arg.id },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListBrandsAdminQuery,
  useCreateBrandAdminMutation,
  useUpdateBrandAdminMutation,
  useRemoveBrandAdminMutation,
} = brandsAdminApi;
