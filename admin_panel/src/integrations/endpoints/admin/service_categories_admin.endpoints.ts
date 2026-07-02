// =============================================================
// FILE: src/integrations/endpoints/admin/service_categories_admin.endpoints.ts
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  ServiceCategoryDto,
  ServiceCategoryCreatePayload,
  ServiceCategoryUpdatePayload,
} from '@/integrations/shared';

type ServiceCategoryApiRow = Omit<ServiceCategoryDto, 'is_active'> & { is_active: boolean | number };
type Envelope<T> = { data?: T; items?: T };

function normalizeCategory(row: ServiceCategoryApiRow): ServiceCategoryDto {
  return {
    ...row,
    is_active: row.is_active === true || row.is_active === 1,
  };
}

export const serviceCategoriesAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ---------------------------------------------------------
    // GET /admin/service-categories
    // ---------------------------------------------------------
    listServiceCategoriesAdmin: build.query<ServiceCategoryDto[], { locale?: string } | void>({
      query: (params) => ({
        url: '/admin/service-categories',
        method: 'GET',
        params: params || {},
        credentials: 'include',
      }),
      transformResponse: (res: Envelope<ServiceCategoryApiRow[]> | ServiceCategoryApiRow[]) => {
        const rows = Array.isArray(res) ? res : res.data ?? res.items ?? [];
        return rows.map(normalizeCategory);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'ServiceCategory' as const, id })),
              { type: 'ServiceCategory', id: 'LIST' },
            ]
          : [{ type: 'ServiceCategory', id: 'LIST' }],
    }),

    // ---------------------------------------------------------
    // POST /admin/service-categories
    // ---------------------------------------------------------
    createServiceCategoryAdmin: build.mutation<{ id: string }, ServiceCategoryCreatePayload>({
      query: (body) => ({
        url: '/admin/service-categories',
        method: 'POST',
        body,
        credentials: 'include',
      }),
      transformResponse: (res: Envelope<{ id: string }>) => res.data ?? ({ id: '' }),
      invalidatesTags: [{ type: 'ServiceCategory', id: 'LIST' }],
    }),

    // ---------------------------------------------------------
    // PATCH /admin/service-categories/:id
    // ---------------------------------------------------------
    updateServiceCategoryAdmin: build.mutation<
      { id: string },
      { id: string; patch: ServiceCategoryUpdatePayload }
    >({
      query: ({ id, patch }) => ({
        url: `/admin/service-categories/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
        credentials: 'include',
      }),
      transformResponse: (res: Envelope<{ id: string }>) => res.data ?? ({ id: '' }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ServiceCategory', id },
        { type: 'ServiceCategory', id: 'LIST' },
      ],
    }),

    // ---------------------------------------------------------
    // DELETE /admin/service-categories/:id
    // ---------------------------------------------------------
    deleteServiceCategoryAdmin: build.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/service-categories/${encodeURIComponent(id)}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      transformResponse: () => undefined,
      invalidatesTags: (result, error, { id }) => [
        { type: 'ServiceCategory', id },
        { type: 'ServiceCategory', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListServiceCategoriesAdminQuery,
  useCreateServiceCategoryAdminMutation,
  useUpdateServiceCategoryAdminMutation,
  useDeleteServiceCategoryAdminMutation,
} = serviceCategoriesAdminApi;
