// =============================================================
// FILE: src/integrations/rtk/private/consultant_self.endpoints.ts
// T30-1 frontend bağı: /me/consultant/* endpoint'leri için RTK hooks.
// =============================================================
import { baseApi } from '@/integrations/rtk/baseApi';
import type { ApiCustomPage, CustomPageDto, CustomPageCreatePayload, CustomPageUpdatePayload } from '@/integrations/shared';
import { mapApiCustomPageToDto } from '@/integrations/shared';

export interface ConsultantSelfProfile {
  id: string;
  user_id: string;
  bio: string | null;
  expertise: string[] | null;
  languages: string[] | null;
  meeting_platforms: string[] | null;
  social_links: Record<string, string> | null;
  session_price: string;
  session_duration: number;
  supports_video: number;
  video_session_price: string | null;
  currency: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_available: number;
  rating_avg: string;
  rating_count: number;
  total_sessions: number;
  // C4: Banka bilgileri
  bank_name: string | null;
  bank_iban: string | null;
  bank_account_holder: string | null;
  // C3: KYC bilgileri
  account_type: 'individual' | 'company' | null;
  identity_number: string | null;
  tax_number: string | null;
  tax_office: string | null;
  company_name: string | null;
  billing_address: string | null;
  kyc_status: 'none' | 'pending' | 'approved' | 'rejected';
  kyc_rejection_reason: string | null;
  kyc_documents?: Array<{ type: string; url: string }> | null;
  user?: { full_name: string | null; email: string | null; phone: string | null; avatar_url: string | null } | null;
}

export interface ConsultantSelfStats {
  this_month_session_count: number;
  this_month_earnings: number;
  last_month_session_count: number;
  last_month_earnings: number;
  session_delta_pct: number;
  earnings_delta_pct: number;
  pending_bookings: number;
  requested_now_count: number;
  pending_messages: number;
  avg_response_minutes: number;
  rating_avg: number;
  rating_count: number;
  total_sessions: number;
  is_available: number;
  last_7_days: Array<{ date: string; count: number; earnings: number }>;
}

export interface ConsultantSelfBooking {
  id: string;
  user_id: string;
  service_id: string | null;
  appointment_date: string;
  appointment_time: string | null;
  session_duration: number;
  session_price: string;
  media_type: string;
  status: string;
  customer_message: string | null;
  customer_note?: string | null;
  admin_note?: string | null;
  decision_note?: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  customer_avatar_url?: string | null;
  service_title?: string | null;
  created_at: string;
}

export interface ProfilePatch {
  bio?: string | null;
  expertise?: string[];
  languages?: string[];
  meeting_platforms?: string[];
  social_links?: Record<string, string>;
  avatar_url?: string | null;
  is_available?: number;
  supports_video?: number;
  session_price?: number;
  session_duration?: number;
  video_session_price?: number;
  // C4: Banka bilgileri
  bank_name?: string | null;
  bank_iban?: string | null;
  bank_account_holder?: string | null;
  // C3: KYC bilgileri
  account_type?: 'individual' | 'company' | null;
  identity_number?: string | null;
  tax_number?: string | null;
  tax_office?: string | null;
  company_name?: string | null;
  billing_address?: string | null;
  kyc_documents?: Array<{ type: string; url: string }> | null;
}

export interface ServicePayload {
  name: string;
  slug: string;
  description?: string | null;
  duration_minutes: number;
  price: number;
  currency?: string;
  media_type?: 'audio' | 'video';
  is_free?: number;
  is_active?: number;
  sort_order?: number;
}

export interface ConsultantSelfService {
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
  is_boosted?: number;
  boost_ends_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceBoostCheckoutResponse {
  id: string;
  status: 'pending_payment' | 'active' | 'expired' | 'cancelled';
  checkout_url: string;
  checkout_html?: string | null;
  token?: string;
  package: { id: string; days: number; price: number; currency?: string };
}

export interface ConsultantSelfReview {
  id: string;
  target_id: string;
  booking_id: string | null;
  user_id: string | null;
  customer_name: string | null;
  name?: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  admin_reply: string | null;
  consultant_reply: string | null;
  consultant_replied_at: string | null;
  is_approved: number;
  is_verified: number;
  created_at: string;
  user?: {
    full_name: string | null;
    email?: string | null;
  } | null;
}

export interface ConsultantSelfThreadCustomer {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface ConsultantSelfThreadMessage {
  id: string;
  thread_id: string;
  sender_user_id: string;
  text: string;
  created_at: string;
  from_consultant: boolean;
}

export interface ConsultantSelfThread {
  thread_id: string;
  context_type: 'consultant_lead' | 'booking';
  context_id: string;
  created_at: string;
  updated_at: string;
  customer: ConsultantSelfThreadCustomer | null;
  unread_count: number;
  last_message: ConsultantSelfThreadMessage | null;
}

export interface ConsultantReviewReplyResponse {
  id: string;
  consultant_reply: string;
}

export interface ConsultantSelfWallet {
  id: string;
  balance: string;
  pending_balance: string;
  currency: string;
}

export type ConsultantSelfWalletTransactionType = 'credit' | 'debit';
export type ConsultantSelfWalletPaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface ConsultantSelfWalletTransaction {
  id: string;
  wallet_id: string;
  user_id?: string;
  amount: string;
  currency?: string;
  type: ConsultantSelfWalletTransactionType;
  purpose: string;
  description: string | null;
  payment_method?: 'paypal' | 'bank_transfer' | 'admin_manual';
  payment_status: ConsultantSelfWalletPaymentStatus;
  transaction_ref?: string | null;
  is_admin_created?: number;
  created_at: string;
}

export interface ConsultantSelfWalletSummary {
  credits: number;
  debits: number;
  net: number;
}

export interface ConsultantSelfWalletResponse {
  wallet: ConsultantSelfWallet;
  transactions: ConsultantSelfWalletTransaction[];
  this_month: ConsultantSelfWalletSummary;
}

export interface ConsultantWithdrawalResponse {
  id: string;
  status: 'pending';
  amount: number;
  currency: string;
  message: string;
}

export interface ConsultantServiceTemplate {
  id: string;
  category_slug: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  price: string;
  currency: string;
  media_type: 'audio' | 'video';
  is_free: number;
  sort_order: number;
  is_active: number;
  adopted: boolean;
  adopted_service_id: string | null;
}

// C8: Danışanlarım
export interface ConsultantClient {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  last_booking_at: string | null;
  booking_count: number;
}

// C9: Profil tamamlama
export interface ProfileCompletionItem {
  id: string;
  label: string;
  done: boolean;
  weight: number;
  tab?: string; // deep-link to tab
}
export interface ProfileCompletionResult {
  score: number;
  items: ProfileCompletionItem[];
}

// C5: Aylık gelir istatistikleri
export interface MonthlyEarningStat {
  year_month: string; // 'YYYY-MM'
  earnings: number;
  sessions: number;
}

// C7: Profil görüntülenme
export interface ProfileViewStat {
  date: string;
  count: number;
}

export const consultantSelfApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMyConsultantProfile: build.query<ConsultantSelfProfile, void>({
      query: () => '/me/consultant',
      transformResponse: (res: { data: ConsultantSelfProfile }) => res.data,
      providesTags: ['ConsultantSelf' as any],
    }),
    updateMyConsultantProfile: build.mutation<{ id: string }, ProfilePatch>({
      query: (body) => ({ url: '/me/consultant', method: 'PATCH', body }),
      transformResponse: (res: { data: { id: string } }) => res.data,
      invalidatesTags: ['ConsultantSelf' as any],
    }),
    submitMyConsultantKyc: build.mutation<{ status: string }, void>({
      query: () => ({ url: '/me/consultant/kyc/submit', method: 'POST' }),
      transformResponse: (res: { data: { status: string } }) => res.data,
      invalidatesTags: ['ConsultantSelf' as any],
    }),
    listMyConsultantBlogPosts: build.query<CustomPageDto[], { locale?: string } | void>({
      query: (args) => ({
        url: '/me/consultant/blog-posts',
        params: args?.locale ? { locale: args.locale } : undefined,
      }),
      transformResponse: (res: { data: ApiCustomPage[] }) => (res.data ?? []).map(mapApiCustomPageToDto),
      providesTags: ['ConsultantSelfBlogPosts' as any],
    }),
    createMyConsultantBlogPost: build.mutation<CustomPageDto, CustomPageCreatePayload>({
      query: (body) => ({ url: '/me/consultant/blog-posts', method: 'POST', body }),
      transformResponse: (res: { data: ApiCustomPage }) => mapApiCustomPageToDto(res.data),
      invalidatesTags: ['ConsultantSelfBlogPosts' as any],
    }),
    updateMyConsultantBlogPost: build.mutation<CustomPageDto, { id: string; patch: CustomPageUpdatePayload }>({
      query: ({ id, patch }) => ({
        url: `/me/consultant/blog-posts/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
      transformResponse: (res: { data: ApiCustomPage }) => mapApiCustomPageToDto(res.data),
      invalidatesTags: ['ConsultantSelfBlogPosts' as any],
    }),
    deleteMyConsultantBlogPost: build.mutation<{ id: string; ok: boolean }, string>({
      query: (id) => ({ url: `/me/consultant/blog-posts/${encodeURIComponent(id)}`, method: 'DELETE' }),
      transformResponse: (res: { data: { id: string; ok: boolean } }) => res.data,
      invalidatesTags: ['ConsultantSelfBlogPosts' as any],
    }),
    getMyConsultantStats: build.query<ConsultantSelfStats, void>({
      query: () => '/me/consultant/stats',
      transformResponse: (res: { data: ConsultantSelfStats }) => res.data,
      providesTags: ['ConsultantSelfStats' as any],
    }),
    getMyConsultantBookings: build.query<ConsultantSelfBooking[], { status?: string } | void>({
      query: (args) => ({ url: '/me/consultant/bookings', params: args?.status ? { status: args.status } : undefined }),
      transformResponse: (res: { data: ConsultantSelfBooking[] }) => res.data ?? [],
      providesTags: ['ConsultantSelfBookings' as any],
    }),
    approveBooking: build.mutation<{ id: string; status: string }, string>({
      query: (id) => ({ url: `/me/consultant/bookings/${encodeURIComponent(id)}/approve`, method: 'POST' }),
      transformResponse: (res: { data: { id: string; status: string } }) => res.data,
      invalidatesTags: ['ConsultantSelfBookings' as any, 'ConsultantSelfStats' as any],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          consultantSelfApi.util.updateQueryData('getMyConsultantBookings' as any, undefined as any, (draft: any) => {
            const b = draft.find((x: any) => x.id === id);
            if (b) b.status = 'confirmed';
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    rejectBooking: build.mutation<{ id: string; status: string }, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/me/consultant/bookings/${encodeURIComponent(id)}/reject`,
        method: 'POST',
        body: reason ? { reason } : {},
      }),
      transformResponse: (res: { data: { id: string; status: string } }) => res.data,
      invalidatesTags: ['ConsultantSelfBookings' as any, 'ConsultantSelfStats' as any],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          consultantSelfApi.util.updateQueryData('getMyConsultantBookings' as any, undefined as any, (draft: any) => {
            const b = draft.find((x: any) => x.id === id);
            if (b) b.status = 'rejected';
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    cancelMyConsultantBooking: build.mutation<{ id: string; status: string }, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/me/consultant/bookings/${encodeURIComponent(id)}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      transformResponse: (res: { data: { id: string; status: string } }) => res.data,
      invalidatesTags: ['ConsultantSelfBookings' as any, 'ConsultantSelfStats' as any],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          consultantSelfApi.util.updateQueryData('getMyConsultantBookings' as any, undefined as any, (draft: any) => {
            const b = draft.find((x: any) => x.id === id);
            if (b) b.status = 'cancelled';
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    updateMyConsultantBookingNotes: build.mutation<{ id: string; notes: string | null }, { id: string; notes: string | null }>({
      query: ({ id, notes }) => ({
        url: `/me/consultant/bookings/${encodeURIComponent(id)}/notes`,
        method: 'PATCH',
        body: { notes },
      }),
      transformResponse: (res: { data: { id: string; notes: string | null } }) => res.data,
      invalidatesTags: ['ConsultantSelfBookings' as any],
    }),
    // Self services
    listMySelfServices: build.query<ConsultantSelfService[], void>({
      query: () => '/me/consultant/services',
      transformResponse: (res: { data: ConsultantSelfService[] }) => res.data ?? [],
      providesTags: ['ConsultantSelfServices' as any],
    }),
    createMySelfService: build.mutation<{ id: string }, ServicePayload>({
      query: (body) => ({ url: '/me/consultant/services', method: 'POST', body }),
      transformResponse: (res: { data: { id: string } }) => res.data,
      invalidatesTags: ['ConsultantSelfServices' as any],
    }),
    updateMySelfService: build.mutation<{ id: string }, { id: string; body: Partial<ServicePayload> }>({
      query: ({ id, body }) => ({
        url: `/me/consultant/services/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: { data: { id: string } }) => res.data,
      invalidatesTags: ['ConsultantSelfServices' as any],
    }),
    deleteMySelfService: build.mutation<{ id: string; ok: boolean }, string>({
      query: (id) => ({ url: `/me/consultant/services/${encodeURIComponent(id)}`, method: 'DELETE' }),
      transformResponse: (res: { data: { id: string; ok: boolean } }) => res.data,
      invalidatesTags: ['ConsultantSelfServices' as any],
    }),
    reorderMySelfServices: build.mutation<{ ok: boolean; count: number }, Array<{ id: string; sort_order: number }>>({
      query: (items) => ({ url: '/me/consultant/services/reorder', method: 'POST', body: { items } }),
      transformResponse: (res: { data: { ok: boolean; count: number } }) => res.data,
      invalidatesTags: ['ConsultantSelfServices' as any],
    }),
    // T30-6: Mesajlar
    listMyConsultantThreads: build.query<ConsultantSelfThread[], void>({
      query: () => '/me/consultant/threads',
      transformResponse: (res: { data: ConsultantSelfThread[] }) => res.data ?? [],
      providesTags: ['ConsultantSelfThreads' as any],
    }),
    getMyConsultantThreadMessages: build.query<{ thread_id: string; messages: ConsultantSelfThreadMessage[] }, string>({
      query: (id) => `/me/consultant/threads/${encodeURIComponent(id)}/messages`,
      transformResponse: (res: { data: { thread_id: string; messages: ConsultantSelfThreadMessage[] } }) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'ConsultantSelfThread' as any, id }],
    }),
    replyMyConsultantThread: build.mutation<ConsultantSelfThreadMessage, { id: string; text: string }>({
      query: ({ id, text }) => ({
        url: `/me/consultant/threads/${encodeURIComponent(id)}/reply`,
        method: 'POST',
        body: { text },
      }),
      transformResponse: (res: { data: ConsultantSelfThreadMessage }) => res.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'ConsultantSelfThread' as any, id },
        'ConsultantSelfThreads' as any,
      ],
    }),
    markConsultantThreadAsRead: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/me/consultant/threads/${encodeURIComponent(id)}/read`, method: 'POST' }),
      transformResponse: (res: { data: { ok: boolean } }) => res.data,
      invalidatesTags: (_r, _e, id) => [{ type: 'ConsultantSelfThread' as any, id }, 'ConsultantSelfThreads' as any],
    }),
    // T30-7: Wallet
    getMyConsultantWallet: build.query<ConsultantSelfWalletResponse, void>({
      query: () => '/me/consultant/wallet',
      transformResponse: (res: { data: ConsultantSelfWalletResponse }) => res.data,
      providesTags: ['ConsultantSelfWallet' as any],
    }),
    requestMyConsultantWithdrawal: build.mutation<ConsultantWithdrawalResponse, { amount: number; notes?: string }>({
      query: (body) => ({ url: '/me/consultant/wallet/withdraw', method: 'POST', body }),
      transformResponse: (res: { data: ConsultantWithdrawalResponse }) => res.data,
      invalidatesTags: ['ConsultantSelfWallet' as any],
    }),
    // T30-4: Availability (working hours)
    getMyConsultantAvailability: build.query<{
      resource_id: string | null;
      resource_title?: string;
      working_hours: Array<{ id: string; dow: number; start_time: string; end_time: string; slot_minutes: number; capacity: number; is_active: number }>;
    }, void>({
      query: () => '/me/consultant/availability',
      transformResponse: (res: { data: any }) => res.data,
      providesTags: ['ConsultantSelfAvailability' as any],
    }),
    updateMyConsultantAvailability: build.mutation<any, { hours: Array<{ dow: 1 | 2 | 3 | 4 | 5 | 6 | 7; start_time: string; end_time: string; slot_minutes?: number; capacity?: number; is_active?: number }> }>({
      query: (body) => ({ url: '/me/consultant/availability', method: 'PUT', body }),
      transformResponse: (res: { data: any }) => res.data,
      invalidatesTags: ['ConsultantSelfAvailability' as any],
    }),
    overrideMyConsultantAvailabilityDay: build.mutation<
      { resource_id: string; date: string; is_active: 0 | 1; updated: number; planned: number },
      { date: string; is_active: 0 | 1 }
    >({
      query: (body) => ({ url: '/me/consultant/availability/day', method: 'POST', body }),
      transformResponse: (res: { data: any }) => res.data,
      invalidatesTags: ['ConsultantSelfAvailability' as any],
    }),
    // T30-8: Reviews
    listMyConsultantReviews: build.query<ConsultantSelfReview[], { status?: string } | void>({
      query: (args) => ({ url: '/me/consultant/reviews', params: args?.status ? { status: args.status } : undefined }),
      transformResponse: (res: { data: ConsultantSelfReview[] }) => res.data ?? [],
      providesTags: ['ConsultantSelfReviews' as any],
    }),
    replyToMyConsultantReview: build.mutation<ConsultantReviewReplyResponse, { id: string; reply: string }>({
      query: ({ id, reply }) => ({
        url: `/me/consultant/reviews/${encodeURIComponent(id)}/reply`,
        method: 'POST',
        body: { reply },
      }),
      transformResponse: (res: { data: ConsultantReviewReplyResponse }) => res.data,
      invalidatesTags: ['ConsultantSelfReviews' as any],
    }),
    listMyServiceTemplates: build.query<ConsultantServiceTemplate[], void>({
      query: () => '/me/consultant/service-templates',
      transformResponse: (res: { data: ConsultantServiceTemplate[] }) => res.data ?? [],
      providesTags: ['ConsultantSelfServiceTemplates' as any],
    }),
    adoptServiceTemplate: build.mutation<ConsultantSelfService, string>({
      query: (templateId) => ({
        url: `/me/consultant/services/from-template/${encodeURIComponent(templateId)}`,
        method: 'POST',
      }),
      transformResponse: (res: { data: ConsultantSelfService }) => res.data,
      invalidatesTags: ['ConsultantSelfServices' as any, 'ConsultantSelfServiceTemplates' as any],
    }),
    createServiceBoostCheckout: build.mutation<ServiceBoostCheckoutResponse, { serviceId: string; package_id: string }>({
      query: ({ serviceId, package_id }) => ({
        url: `/me/consultant/services/${encodeURIComponent(serviceId)}/boost/checkout`,
        method: 'POST',
        body: { package_id },
      }),
      transformResponse: (res: { data: ServiceBoostCheckoutResponse }) => res.data,
      invalidatesTags: ['ConsultantSelfServices' as any],
    }),
    // C8: Danışanlarım
    getMyConsultantClients: build.query<ConsultantClient[], { q?: string; limit?: number; offset?: number } | void>({
      query: (args) => ({ url: '/me/consultant/clients', params: args || undefined }),
      transformResponse: (res: { data: ConsultantClient[] }) => res.data ?? [],
      providesTags: ['ConsultantSelfClients' as any],
    }),
    // C9: Profil tamamlama skoru
    getMyConsultantProfileCompletion: build.query<ProfileCompletionResult, void>({
      query: () => '/me/consultant/profile-completion',
      transformResponse: (res: { data: ProfileCompletionResult }) => res.data,
      providesTags: ['ConsultantSelfCompletion' as any],
    }),
    // C5: Aylık gelir istatistikleri
    getMyConsultantMonthlyStats: build.query<MonthlyEarningStat[], { months?: number } | void>({
      query: (args) => ({ url: '/me/consultant/wallet/monthly-stats', params: args?.months ? { months: args.months } : { months: 24 } }),
      transformResponse: (res: { data: MonthlyEarningStat[] }) => res.data ?? [],
      providesTags: ['ConsultantSelfWallet' as any],
    }),
    // C7: Profil görüntülenme
    getMyConsultantProfileViews: build.query<ProfileViewStat[], { range: string } | void>({
      query: (args) => ({ url: '/me/consultant/profile-views', params: args || { range: '30d' } }),
      transformResponse: (res: { data: ProfileViewStat[] }) => res.data ?? [],
      providesTags: ['ConsultantSelfProfileViews' as any],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyConsultantProfileQuery,
  useUpdateMyConsultantProfileMutation,
  useSubmitMyConsultantKycMutation,
  useListMyConsultantBlogPostsQuery,
  useCreateMyConsultantBlogPostMutation,
  useUpdateMyConsultantBlogPostMutation,
  useDeleteMyConsultantBlogPostMutation,
  useGetMyConsultantStatsQuery,
  useGetMyConsultantBookingsQuery,
  useApproveBookingMutation,
  useRejectBookingMutation,
  useCancelMyConsultantBookingMutation,
  useUpdateMyConsultantBookingNotesMutation,
  useListMySelfServicesQuery,
  useCreateMySelfServiceMutation,
  useUpdateMySelfServiceMutation,
  useDeleteMySelfServiceMutation,
  useReorderMySelfServicesMutation,
  useListMyConsultantThreadsQuery,
  useGetMyConsultantThreadMessagesQuery,
  useReplyMyConsultantThreadMutation,
  useMarkConsultantThreadAsReadMutation,
  useGetMyConsultantWalletQuery,
  useRequestMyConsultantWithdrawalMutation,
  useListMyConsultantReviewsQuery,
  useReplyToMyConsultantReviewMutation,
  useGetMyConsultantAvailabilityQuery,
  useUpdateMyConsultantAvailabilityMutation,
  useOverrideMyConsultantAvailabilityDayMutation,
  useListMyServiceTemplatesQuery,
  useAdoptServiceTemplateMutation,
  useCreateServiceBoostCheckoutMutation,
  // C8
  useGetMyConsultantClientsQuery,
  // C9
  useGetMyConsultantProfileCompletionQuery,
  // C5
  useGetMyConsultantMonthlyStatsQuery,
  // C7
  useGetMyConsultantProfileViewsQuery,
} = consultantSelfApi;
