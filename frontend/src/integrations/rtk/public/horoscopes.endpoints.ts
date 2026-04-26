// frontend/src/integrations/rtk/public/horoscopes.endpoints.ts

import { baseApi } from '../baseApi';

export const horoscopesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDailyHoroscope: build.query<any, { sign: string; date?: string }>({
      query: ({ sign, date }) => ({
        url: '/horoscopes/today',
        params: { sign, date },
      }),
      transformResponse: (res: any) => res.data,
    }),
  }),
});

export const { useGetDailyHoroscopeQuery } = horoscopesApi;
