// =============================================================
// FILE: src/integrations/rtk/public/consultants.public.endpoints.ts
// Public consultant endpoints — backend { data: T } envelope unwrap
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import { cleanParams, makeLocaleHeaders } from '@/integrations/shared';

export interface ConsultantPublic {
  id: string;
  user_id: string;
  slug?: string | null;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  headline?: string | null;
  bio?: string;
  expertise: string[];
  languages: string[];
  session_price: string;
  session_duration: number;
  video_session_price?: string | null;
  supports_video?: number;
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
  locale?: string;
}

type ConsultantArg = string | { id: string; locale?: string };
type ConsultantSlotsArg = { id: string; date: string; locale?: string };

function consultantArgId(arg: ConsultantArg) {
  return typeof arg === 'string' ? arg : arg.id;
}

const consultantsPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listConsultantsPublic: build.query<ConsultantPublic[], ListConsultantsParams | void>({
      query: (params) => {
        const { locale, ...rest } = params ?? {};
        return {
          url: '/consultants',
          params: cleanParams(rest),
          headers: makeLocaleHeaders(locale),
        };
      },
      transformResponse: (res: { data: ConsultantPublic[] } | ConsultantPublic[]) =>
        Array.isArray(res) ? res : ((res as any)?.data ?? []),
      providesTags: ['Consultants'],
    }),

    getConsultantPublic: build.query<ConsultantPublic, ConsultantArg>({
      query: (arg) => {
        const id = consultantArgId(arg);
        const locale = typeof arg === 'string' ? undefined : arg.locale;
        return {
          url: `/consultants/${encodeURIComponent(id)}`,
          headers: makeLocaleHeaders(locale),
        };
      },
      transformResponse: (res: { data: ConsultantPublic } | ConsultantPublic) =>
        (res as any)?.data ?? res,
      providesTags: (_r, _e, arg) => [{ type: 'Consultant', id: consultantArgId(arg) }],
    }),

    getConsultantSlotsPublic: build.query<ConsultantSlotPublic[], ConsultantSlotsArg>({
      query: ({ id, date, locale }) => ({
        url: `/consultants/${encodeURIComponent(id)}/slots`,
        params: { date },
        headers: makeLocaleHeaders(locale),
      }),
      transformResponse: (res: { data: ConsultantSlotPublic[] } | ConsultantSlotPublic[]) =>
        Array.isArray(res) ? res : ((res as any)?.data ?? []),
      providesTags: (_r, _e, { id }) => [{ type: 'ConsultantSlots', id }],
    }),

    trackConsultantView: build.mutation<{ tracked: boolean; reason?: string }, string>({
      query: (id) => ({ url: `/consultants/${encodeURIComponent(id)}/view`, method: 'POST' }),
      transformResponse: (res: { data: { tracked: boolean; reason?: string } }) => res.data,
    }),
  }),
  overrideExisting: false,
});

export const {
  useListConsultantsPublicQuery,
  useGetConsultantPublicQuery,
  useGetConsultantSlotsPublicQuery,
  useTrackConsultantViewMutation,
} = consultantsPublicApi;

export const useListConsultantsQuery = useListConsultantsPublicQuery;
export const useGetConsultantQuery = useGetConsultantPublicQuery;
export const useGetConsultantSlotsQuery = useGetConsultantSlotsPublicQuery;
