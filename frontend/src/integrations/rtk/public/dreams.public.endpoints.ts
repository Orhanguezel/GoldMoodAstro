import { baseApi } from '../baseApi';

export const dreamsPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    interpretDream: build.mutation<any, { dream_text: string; locale?: string }>({
      query: (body) => ({
        url: '/dreams/interpret',
        method: 'POST',
        body,
      }),
    }),
    getDreamReading: build.query<any, string>({
      query: (id) => `/dreams/reading/${id}`,
    }),
  }),
  overrideExisting: false,
});

export const { useInterpretDreamMutation, useGetDreamReadingQuery } = dreamsPublicApi;
