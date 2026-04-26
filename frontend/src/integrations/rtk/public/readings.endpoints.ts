import { baseApi } from '../baseApi';
import type { DailyReadingResponse } from '@/types/common';

export const readingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    generateDailyReading: build.mutation<DailyReadingResponse, { chart_id: string }>({
      query: (body) => ({
        url: '/readings/daily',
        method: 'POST',
        body,
      }),
      transformResponse: (res: { data: DailyReadingResponse }) => res.data,
    }),
  }),
});

export const { useGenerateDailyReadingMutation } = readingsApi;
