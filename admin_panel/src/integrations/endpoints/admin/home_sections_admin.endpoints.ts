// =============================================================
// FILE: src/integrations/endpoints/admin/home_sections_admin.endpoints.ts
// goldmoodastro – Admin Home Sections (anasayfa düzeni) RTK endpoints
// =============================================================
import { baseApi } from '@/integrations/baseApi';

export interface AdminHomeSectionDto {
  id: string;
  slug: string;
  label: string;
  component_key: string;
  order_index: number;
  is_active: number;
  config: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminHomeSectionCreatePayload {
  slug: string;
  label: string;
  component_key: string;
  order_index?: number;
  is_active?: number;
  config?: Record<string, unknown> | null;
}

export interface AdminHomeSectionUpdatePayload {
  label?: string;
  component_key?: string;
  order_index?: number;
  is_active?: number;
  config?: Record<string, unknown> | null;
}

export interface AdminHomeSectionReorderPayload {
  items: Array<{ id: string; order_index: number }>;
}

const unwrap = <T,>(res: { data: T } | T): T => {
  if (res && typeof res === 'object' && 'data' in (res as any)) {
    return (res as { data: T }).data;
  }
  return res as T;
};

export const homeSectionsAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listHomeSectionsAdmin: build.query<AdminHomeSectionDto[], void>({
      query: () => ({ url: '/admin/home/sections', method: 'GET' }),
      transformResponse: (res: { data: AdminHomeSectionDto[] }) => unwrap(res) ?? [],
      providesTags: (result) =>
        result
          ? [
              { type: 'HomeSection' as const, id: 'LIST' },
              ...result.map((s) => ({ type: 'HomeSection' as const, id: s.id })),
            ]
          : [{ type: 'HomeSection' as const, id: 'LIST' }],
    }),

    getHomeSectionAdmin: build.query<AdminHomeSectionDto, string>({
      query: (id) => ({ url: `/admin/home/sections/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: { data: AdminHomeSectionDto }) => unwrap(res),
      providesTags: (_r, _e, id) => [{ type: 'HomeSection' as const, id }],
    }),

    createHomeSectionAdmin: build.mutation<{ id: string }, AdminHomeSectionCreatePayload>({
      query: (body) => ({ url: '/admin/home/sections', method: 'POST', body }),
      transformResponse: (res: { data: { id: string } }) => unwrap(res),
      invalidatesTags: [{ type: 'HomeSection' as const, id: 'LIST' }],
    }),

    updateHomeSectionAdmin: build.mutation<{ id: string }, { id: string; data: AdminHomeSectionUpdatePayload }>({
      query: ({ id, data }) => ({
        url: `/admin/home/sections/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (res: { data: { id: string } }) => unwrap(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'HomeSection' as const, id },
        { type: 'HomeSection' as const, id: 'LIST' },
      ],
    }),

    deleteHomeSectionAdmin: build.mutation<{ id: string; ok: boolean }, string>({
      query: (id) => ({ url: `/admin/home/sections/${encodeURIComponent(id)}`, method: 'DELETE' }),
      transformResponse: (res: { data: { id: string; ok: boolean } }) => unwrap(res),
      invalidatesTags: (_r, _e, id) => [
        { type: 'HomeSection' as const, id },
        { type: 'HomeSection' as const, id: 'LIST' },
      ],
    }),

    reorderHomeSectionsAdmin: build.mutation<{ ok: boolean; count: number }, AdminHomeSectionReorderPayload>({
      query: (body) => ({ url: '/admin/home/sections/reorder', method: 'POST', body }),
      transformResponse: (res: { data: { ok: boolean; count: number } }) => unwrap(res),
      invalidatesTags: [{ type: 'HomeSection' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListHomeSectionsAdminQuery,
  useGetHomeSectionAdminQuery,
  useCreateHomeSectionAdminMutation,
  useUpdateHomeSectionAdminMutation,
  useDeleteHomeSectionAdminMutation,
  useReorderHomeSectionsAdminMutation,
} = homeSectionsAdminApi;
