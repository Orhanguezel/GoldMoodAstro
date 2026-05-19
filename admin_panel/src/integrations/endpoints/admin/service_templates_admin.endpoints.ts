// =============================================================
// FILE: src/integrations/endpoints/admin/service_templates_admin.endpoints.ts
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  ServiceTemplateDto,
  ServiceTemplateCreatePayload,
  ServiceTemplateUpdatePayload,
  ServiceTemplateListQueryParams,
} from '@/integrations/shared';

type ServiceTemplateApiRow = Omit<ServiceTemplateDto, 'is_active' | 'is_free'> & {
  is_active: boolean | number;
  is_free: boolean | number;
};
type Envelope<T> = { data: T };

function normalizeTemplate(row: ServiceTemplateApiRow): ServiceTemplateDto {
  return {
    ...row,
    is_active: row.is_active === true || row.is_active === 1,
    is_free: row.is_free === true || row.is_free === 1,
  };
}

export const serviceTemplatesAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ---------------------------------------------------------
    // GET /admin/service-templates
    // ---------------------------------------------------------
    listServiceTemplatesAdmin: build.query<ServiceTemplateDto[], ServiceTemplateListQueryParams | void>({
      query: (params) => ({
        url: '/admin/service-templates',
        method: 'GET',
        params: params || {},
        credentials: 'include',
      }),
      transformResponse: (res: Envelope<ServiceTemplateApiRow[]>) => (res.data ?? []).map(normalizeTemplate),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'ServiceTemplate' as const, id })),
              { type: 'ServiceTemplate', id: 'LIST' },
            ]
          : [{ type: 'ServiceTemplate', id: 'LIST' }],
    }),

    // ---------------------------------------------------------
    // POST /admin/service-templates
    // ---------------------------------------------------------
    createServiceTemplateAdmin: build.mutation<{ id: string }, ServiceTemplateCreatePayload>({
      query: (body) => ({
        url: '/admin/service-templates',
        method: 'POST',
        body,
        credentials: 'include',
      }),
      transformResponse: (res: Envelope<{ id: string }>) => res.data,
      invalidatesTags: [{ type: 'ServiceTemplate', id: 'LIST' }],
    }),

    // ---------------------------------------------------------
    // PATCH /admin/service-templates/:id
    // ---------------------------------------------------------
    updateServiceTemplateAdmin: build.mutation<
      { id: string },
      { id: string; patch: ServiceTemplateUpdatePayload }
    >({
      query: ({ id, patch }) => ({
        url: `/admin/service-templates/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
        credentials: 'include',
      }),
      transformResponse: (res: Envelope<{ id: string }>) => res.data,
      invalidatesTags: (result, error, { id }) => [
        { type: 'ServiceTemplate', id },
        { type: 'ServiceTemplate', id: 'LIST' },
      ],
    }),

    // ---------------------------------------------------------
    // DELETE /admin/service-templates/:id
    // ---------------------------------------------------------
    deleteServiceTemplateAdmin: build.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/service-templates/${encodeURIComponent(id)}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      transformResponse: () => undefined,
      invalidatesTags: (result, error, { id }) => [
        { type: 'ServiceTemplate', id },
        { type: 'ServiceTemplate', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListServiceTemplatesAdminQuery,
  useCreateServiceTemplateAdminMutation,
  useUpdateServiceTemplateAdminMutation,
  useDeleteServiceTemplateAdminMutation,
} = serviceTemplatesAdminApi;
