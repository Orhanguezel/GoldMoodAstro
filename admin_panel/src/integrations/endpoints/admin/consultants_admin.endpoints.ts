import { baseApi } from '@/integrations/baseApi';

export type ConsultantAdmin = {
  id: string;
  user_id: string;
  slug?: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url?: string | null;
  bio: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: string | null;
  expertise: string[] | null;
  languages: string[] | null;
  gallery?: string[] | null;
  session_price: string;
  session_duration: number;
  min_service_price?: string | number | null;
  supports_video?: number | null;
  video_session_price?: string | null;
  is_online?: number | null;
  currency: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  is_available: number | null;
  is_hidden?: number | null;
  rating_avg: string | null;
  rating_count: number | null;
  total_sessions: number | null;
  created_at: string | null;
  updated_at: string | null;
};

/** Danışman profil doldurma yüzdesi — 10 alanlık kontrol (detay + liste ortak). */
export function consultantCompletion(c: Record<string, any> | null | undefined): {
  percent: number; filled: number; total: number;
} {
  const checks = [
    !!c?.avatar_url,
    !!c?.headline,
    !!(c?.bio && String(c.bio).trim().length >= 20),
    !!(Array.isArray(c?.expertise) && c.expertise.length),
    !!(Array.isArray(c?.languages) && c.languages.length),
    Number(c?.session_price || 0) > 0,
    Number(c?.session_duration || 0) > 0,
    !!c?.og_image,
    !!c?.phone,
    Number(c?.supports_video || 0) === 1,
  ];
  const filled = checks.filter(Boolean).length;
  return { percent: Math.round((filled / checks.length) * 100), filled, total: checks.length };
}

/** Danışman public'te YAYINDA mı? Değilse hangi şart eksik. */
export function consultantPublishStatus(c: Record<string, any> | null | undefined): {
  published: boolean; missing: string[]; hidden: boolean;
} {
  const missing: string[] = [];
  // Fiyat şartı: temel seans ücreti > 0 VEYA aktif fiyatlı hizmeti var (gate ile aynı).
  const hasSellablePrice = Number(c?.session_price || 0) > 0 || Number(c?.min_service_price || 0) > 0;
  if (c?.approval_status !== 'approved') missing.push('onay');
  if (!hasSellablePrice) missing.push('fiyat');
  // PROFİL FOTOĞRAFI ZORUNLU — avatar yoksa yayınlanmaz (gate ile aynı).
  if (!c?.avatar_url) missing.push('profil fotoğrafı');
  if (!c?.slug) missing.push('slug');
  // NOT: is_available (Online/Offline) yayını engellemez — sadece rozet.
  const hidden = Number(c?.is_hidden || 0) === 1;
  return { published: missing.length === 0 && !hidden, missing, hidden };
}

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
    // Pasife çek / aktif et (silmeden gizle). is_hidden=1 → sitede görünmez.
    setConsultantVisibilityAdmin: b.mutation<ConsultantAdmin, { id: string; is_hidden: boolean }>({
      query: ({ id, is_hidden }) => ({
        url: `/admin/consultants/${encodeURIComponent(id)}/visibility`,
        method: 'PATCH',
        body: { is_hidden },
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
  useSetConsultantVisibilityAdminMutation,
  useListConsultantServicesAdminQuery,
  useCreateConsultantServiceAdminMutation,
  useUpdateConsultantServiceAdminMutation,
  useDeleteConsultantServiceAdminMutation,
  useDeleteConsultantAdminMutation,
} = consultantsAdminApi;
