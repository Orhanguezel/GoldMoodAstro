import { baseApi } from '../baseApi';

export const numerologyPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    calculateNumerology: build.mutation<any, { full_name: string; birth_date: string; locale?: string }>({
      query: (body) => ({
        url: '/numerology/calculate',
        method: 'POST',
        body,
      }),
    }),
    getNumerologyReading: build.query<any, string>({
      query: (id) => `/numerology/reading/${id}`,
    }),
  }),
  overrideExisting: false,
});

export const { useCalculateNumerologyMutation, useGetNumerologyReadingQuery } = numerologyPublicApi;
