import { baseApi } from '@/integrations/baseApi';

export type ConsultantAdmin = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: string | null;
  expertise: string[] | null;
  languages: string[] | null;
  session_price: string;
  session_duration: number;
  currency: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  is_available: number | null;
  rating_avg: string | null;
  rating_count: number | null;
  total_sessions: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ConsultantServiceAdmin = {
  id: string;
  consultant_id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  price: string;
  currency: string;
  media_type: 'audio' | 'video';
  is_free: number;
  is_active: number;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
};

export type ConsultantServiceAdminPayload = {
  name?: string;
  slug?: string;
  description?: string | null;
  duration_minutes?: number;
  price?: number;
  currency?: string;
  media_type?: 'audio' | 'video';
  is_free?: number;
  is_active?: number;
  sort_order?: number;
};

function unwrapList(raw: unknown): ConsultantAdmin[] {
  if (Array.isArray(raw)) return raw as ConsultantAdmin[];
  const data = (raw as { data?: unknown })?.data;
  return Array.isArray(data) ? (data as ConsultantAdmin[]) : [];
}

function unwrapOne(raw: unknown): ConsultantAdmin {
  return ((raw as { data?: unknown })?.data ?? raw) as ConsultantAdmin;
}

function unwrapServices(raw: unknown): ConsultantServiceAdmin[] {
  if (Array.isArray(raw)) return raw as ConsultantServiceAdmin[];
  const data = (raw as { data?: unknown })?.data;
  return Array.isArray(data) ? (data as ConsultantServiceAdmin[]) : [];
}

export const consultantsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listConsultantsAdmin: b.query<ConsultantAdmin[], { approval_status?: string } | void>({
      query: (params) => ({ url: '/admin/consultants', params: params ?? undefined }),
      transformResponse: unwrapList,
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((item) => ({ type: 'Consultants' as const, id: item.id })),
              { type: 'Consultants' as const, id: 'LIST' },
            ]
          : [{ type: 'Consultants' as const, id: 'LIST' }],
    }),
    getConsultantAdmin: b.query<ConsultantAdmin, string>({
      query: (id) => ({ url: `/admin/consultants/${encodeURIComponent(id)}` }),
      transformResponse: unwrapOne,
      providesTags: (_r, _e, id) => [{ type: 'Consultants' as const, id }],
    }),
    approveConsultantAdmin: b.mutation<ConsultantAdmin, string>({
      query: (id) => ({ url: `/admin/consultants/${encodeURIComponent(id)}/approve`, method: 'PATCH' }),
      transformResponse: unwrapOne,
      invalidatesTags: (_r, _e, id) => [
        { type: 'Consultants' as const, id },
        { type: 'Consultants' as const, id: 'LIST' },
      ],
    }),
    rejectConsultantAdmin: b.mutation<ConsultantAdmin, { id: string; rejection_reason: string }>({
      query: ({ id, rejection_reason }) => ({
        url: `/admin/consultants/${encodeURIComponent(id)}/reject`,
        method: 'PATCH',
        body: { rejection_reason },
      }),
      transformResponse: unwrapOne,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Consultants' as const, id: arg.id },
        { type: 'Consultants' as const, id: 'LIST' },
      ],
    }),
    listConsultantServicesAdmin: b.query<ConsultantServiceAdmin[], string>({
      query: (consultantId) => ({ url: `/admin/consultants/${encodeURIComponent(consultantId)}/services` }),
      transformResponse: unwrapServices,
      providesTags: (_r, _e, consultantId) => [{ type: 'Consultants' as const, id: `services:${consultantId}` }],
    }),
    createConsultantServiceAdmin: b.mutation<
      { data?: { id: string } } | { id: string },
      { consultantId: string; body: Required<Pick<ConsultantServiceAdminPayload, 'name' | 'slug' | 'duration_minutes' | 'price' | 'media_type'>> & ConsultantServiceAdminPayload }
    >({
      query: ({ consultantId, body }) => ({
        url: `/admin/consultants/${encodeURIComponent(consultantId)}/services`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Consultants' as const, id: `services:${arg.consultantId}` }],
    }),
    updateConsultantServiceAdmin: b.mutation<
      { data?: { id: string } } | { id: string },
      { consultantId: string; id: string; body: ConsultantServiceAdminPayload }
    >({
      query: ({ id, body }) => ({
        url: `/admin/consultant-services/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Consultants' as const, id: `services:${arg.consultantId}` }],
    }),
    deleteConsultantServiceAdmin: b.mutation<{ ok?: boolean }, { consultantId: string; id: string }>({
      query: ({ id }) => ({
        url: `/admin/consultant-services/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Consultants' as const, id: `services:${arg.consultantId}` }],
    }),
    deleteConsultantAdmin: b.mutation<{ ok?: boolean }, string>({
      query: (id) => ({
        url: `/admin/consultants/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Consultants' as const, id },
        { type: 'Consultants' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListConsultantsAdminQuery,
  useGetConsultantAdminQuery,
  useApproveConsultantAdminMutation,
  useRejectConsultantAdminMutation,
  useListConsultantServicesAdminQuery,
  useCreateConsultantServiceAdminMutation,
  useUpdateConsultantServiceAdminMutation,
  useDeleteConsultantServiceAdminMutation,
  useDeleteConsultantAdminMutation,
} = consultantsAdminApi;
