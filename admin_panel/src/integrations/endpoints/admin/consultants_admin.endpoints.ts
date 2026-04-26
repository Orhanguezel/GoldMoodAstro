import { baseApi } from '@/integrations/baseApi';

export type ConsultantAdmin = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
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

function unwrapList(raw: unknown): ConsultantAdmin[] {
  if (Array.isArray(raw)) return raw as ConsultantAdmin[];
  const data = (raw as { data?: unknown })?.data;
  return Array.isArray(data) ? (data as ConsultantAdmin[]) : [];
}

function unwrapOne(raw: unknown): ConsultantAdmin {
  return ((raw as { data?: unknown })?.data ?? raw) as ConsultantAdmin;
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
  }),
  overrideExisting: true,
});

export const {
  useListConsultantsAdminQuery,
  useGetConsultantAdminQuery,
  useApproveConsultantAdminMutation,
  useRejectConsultantAdminMutation,
} = consultantsAdminApi;
