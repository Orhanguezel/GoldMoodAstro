// =============================================================
// FILE: src/integrations/rtk/public/horoscopes.public.endpoints.ts
// Public horoscope and zodiac info endpoints
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type { DailyHoroscope, SignInfo, ZodiacSign } from '@/types/common';

const horoscopesPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTodayHoroscope: build.query<DailyHoroscope, { sign: ZodiacSign; date?: string }>({
      query: (params) => ({ url: '/horoscopes/today', params }),
      transformResponse: (res: { data: DailyHoroscope }) => res.data,
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
      transformResponse: (res: { data: DailyHoroscope[] }) => res.data,
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
