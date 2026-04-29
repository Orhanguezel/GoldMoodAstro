import { baseApi } from '../baseApi';

export const tarotPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    drawTarot: build.mutation<any, { spread_type: string; question?: string; locale?: string }>({
      query: (body) => ({
        url: '/tarot/draw',
        method: 'POST',
        body,
      }),
    }),
    getTarotReading: build.query<any, string>({
      query: (id) => `/tarot/reading/${id}`,
    }),
  }),
  overrideExisting: false,
});

export const { useDrawTarotMutation, useGetTarotReadingQuery } = tarotPublicApi;
