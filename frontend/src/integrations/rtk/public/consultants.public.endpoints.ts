// =============================================================
// FILE: src/integrations/rtk/public/consultants.public.endpoints.ts
// Public consultant endpoints — backend { data: T } envelope unwrap
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';

export interface ConsultantPublic {
  id: string;
  user_id: string;
  slug?: string | null;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  expertise: string[];
  languages: string[];
  session_price: string;
  session_duration: number;
  supports_video: number;
  currency: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_available: number;
  rating_avg: string;
  rating_count: number;
  total_sessions: number;
  resource_id?: string;
  created_at?: string;
}

export interface ConsultantSlotPublic {
  id: string;
  resource_id: string;
  slot_date: string;
  slot_time: string;
  capacity: number;
  reserved_count: number;
  is_active: number;
}

export type Consultant = ConsultantPublic;
export type ConsultantSlot = ConsultantSlotPublic;

export interface ListConsultantsParams {
  expertise?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  limit?: number;
  sort?: 'featured' | 'popular' | 'new' | 'online';
  onlineOnly?: boolean;
}

const consultantsPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listConsultantsPublic: build.query<ConsultantPublic[], ListConsultantsParams | void>({
      query: (params) => ({ url: '/consultants', params: params ?? undefined }),
      transformResponse: (res: { data: ConsultantPublic[] } | ConsultantPublic[]) =>
        Array.isArray(res) ? res : ((res as any)?.data ?? []),
      providesTags: ['Consultants'],
    }),

    getConsultantPublic: build.query<ConsultantPublic, string>({
      query: (id) => `/consultants/${id}`,
      transformResponse: (res: { data: ConsultantPublic } | ConsultantPublic) =>
        (res as any)?.data ?? res,
      providesTags: (_r, _e, id) => [{ type: 'Consultant', id }],
    }),

    getConsultantSlotsPublic: build.query<ConsultantSlotPublic[], { id: string; date: string }>({
      query: ({ id, date }) => ({ url: `/consultants/${id}/slots`, params: { date } }),
      transformResponse: (res: { data: ConsultantSlotPublic[] } | ConsultantSlotPublic[]) =>
        Array.isArray(res) ? res : ((res as any)?.data ?? []),
      providesTags: (_r, _e, { id }) => [{ type: 'ConsultantSlots', id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListConsultantsPublicQuery,
  useGetConsultantPublicQuery,
  useGetConsultantSlotsPublicQuery,
} = consultantsPublicApi;

export const useListConsultantsQuery = useListConsultantsPublicQuery;
export const useGetConsultantQuery = useGetConsultantPublicQuery;
export const useGetConsultantSlotsQuery = useGetConsultantSlotsPublicQuery;
