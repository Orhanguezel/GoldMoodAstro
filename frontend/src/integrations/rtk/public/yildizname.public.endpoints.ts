import { baseApi } from '../baseApi';

export const yildiznamePublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    readYildizname: build.mutation<any, { name: string; mother_name: string; birth_year?: number }>({
      query: (body) => ({
        url: '/yildizname/read',
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => res.data,
      invalidatesTags: ['History'],
    }),
    getMyYildizname: build.query<any[], void>({
      query: () => '/yildizname/me',
      transformResponse: (res: any) => res.data,
    }),
    getYildiznameReading: build.query<any, string>({
      query: (id) => `/yildizname/reading/${id}`,
      transformResponse: (res: any) => res.data,
    }),
  }),
});

export const { useReadYildiznameMutation, useGetMyYildiznameQuery, useGetYildiznameReadingQuery } = yildiznamePublicApi;
