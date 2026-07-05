// =============================================================
// FILE: src/integrations/rtk/public/horoscopes.public.endpoints.ts
// Public horoscope and zodiac info endpoints
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type { DailyHoroscope, SignInfo, ZodiacSign } from '@/types/common';

function normalizeDailyHoroscope(data: any): DailyHoroscope {
  return {
    ...data,
    date: data.date ?? data.period_start_date,
    content: data.content ?? data.contentTr,
    contentTr: data.contentTr ?? data.content ?? '',
    contentEn: data.contentEn ?? null,
    moodScore: data.moodScore ?? data.mood_score ?? 0,
    luckyNumber: data.luckyNumber ?? data.lucky_number ?? 0,
    luckyColor: data.luckyColor ?? data.lucky_color ?? '',
  };
}

const horoscopesPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTodayHoroscope: build.query<DailyHoroscope, { sign: ZodiacSign; date?: string; locale?: string }>({
      query: (params) => ({ url: '/horoscopes/today', params }),
      transformResponse: (res: { data: DailyHoroscope }) => normalizeDailyHoroscope(res.data ?? res),
      providesTags: (result, _error, { sign }) => (result ? [{ type: 'Horoscope' as any, id: sign }] : []),
    }),

    getSignInfo: build.query<SignInfo, { sign: ZodiacSign; locale?: string }>({
      query: ({ sign, locale }) => ({ url: `/zodiac/${sign}`, params: { locale } }),
      transformResponse: (res: { data: SignInfo }) => res.data,
      providesTags: (result, _error, { sign }) => (result ? [{ type: 'SignInfo' as any, id: sign }] : []),
    }),
    
    getCompatibility: build.query<any, { signA: string; signB: string; locale?: string }>({
      query: (params) => ({ url: '/horoscopes/compatibility', params }),
      transformResponse: (res: { data: any }) => res.data,
    }),

    getTransitHoroscopes: build.query<DailyHoroscope[], { month: string; locale?: string }>({
      query: (params) => ({ url: '/horoscopes/transit', params }),
      transformResponse: (res: { data: DailyHoroscope[] }) => (res.data ?? []).map(normalizeDailyHoroscope),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTodayHoroscopeQuery,
  useGetSignInfoQuery,
  useGetCompatibilityQuery,
  useGetTransitHoroscopesQuery,
} = horoscopesPublicApi;
