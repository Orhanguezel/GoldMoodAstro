// frontend/src/integrations/rtk/public/horoscopes.endpoints.ts

import { baseApi } from '../baseApi';
import type { DailyHoroscope } from '@/types/common';

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

export const horoscopesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDailyHoroscope: build.query<DailyHoroscope, { sign: string; date?: string; locale?: string }>({
      query: ({ sign, date, locale }) => ({
        url: '/horoscopes/today',
        params: { sign, date, locale },
      }),
      transformResponse: (res: any) => normalizeDailyHoroscope(res.data ?? res),
    }),
  }),
});

export const { useGetDailyHoroscopeQuery } = horoscopesApi;
