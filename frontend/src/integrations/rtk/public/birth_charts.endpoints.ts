import { baseApi } from '../baseApi';
import type { BirthChart, BirthChartCreateInput } from '@/types/common';

export const birthChartsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listMyBirthCharts: build.query<BirthChart[], void>({
      query: () => '/birth-charts',
      providesTags: ['BirthCharts'],
      transformResponse: (res: { data: BirthChart[] }) => res.data,
    }),
    getBirthChart: build.query<BirthChart, string>({
      query: (id) => `/birth-charts/${id}`,
      providesTags: (result, error, id) => [{ type: 'BirthCharts', id }],
      transformResponse: (res: { data: BirthChart }) => res.data,
    }),
    previewBirthChart: build.mutation<BirthChart, BirthChartCreateInput>({
      query: (body) => ({
        url: '/birth-charts/preview',
        method: 'POST',
        body,
      }),
      transformResponse: (res: { data: BirthChart }) => res.data,
    }),
    createBirthChart: build.mutation<BirthChart, BirthChartCreateInput>({
      query: (body) => ({
        url: '/birth-charts',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['BirthCharts'],
      transformResponse: (res: { data: BirthChart }) => res.data,
    }),
    deleteBirthChart: build.mutation<{ ok: boolean; id: string }, string>({
      query: (id) => ({
        url: `/birth-charts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BirthCharts'],
      transformResponse: (res: { data: { ok: boolean; id: string } }) => res.data,
    }),
    getBirthChartTransit: build.mutation<unknown, string>({
      query: (id) => ({
        url: `/birth-charts/${id}/transit`,
        method: 'POST',
      }),
      transformResponse: (res: { data: unknown }) => res.data,
    }),
    getBirthChartSynastry: build.mutation<unknown, { chart_a_id: string; chart_b_id: string }>({
      query: (body) => ({
        url: '/birth-charts/synastry',
        method: 'POST',
        body,
      }),
      transformResponse: (res: { data: unknown }) => res.data,
    }),
  }),
});

export const {
  useListMyBirthChartsQuery,
  useGetBirthChartQuery,
  usePreviewBirthChartMutation,
  useCreateBirthChartMutation,
  useDeleteBirthChartMutation,
  useGetBirthChartTransitMutation,
  useGetBirthChartSynastryMutation,
} = birthChartsApi;
