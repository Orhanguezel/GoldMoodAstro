// FAZ 28 / T28-1 — Reading history (list + delete)
import { baseApi } from '../baseApi';

export type ReadingType =
  | 'tarot'
  | 'coffee'
  | 'dream'
  | 'numerology'
  | 'yildizname'
  | 'synastry';

export interface HistoryItem {
  type: ReadingType;
  id: string;
  created_at: string;
  title: string;
  snippet: string | null;
}

export const historyPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /me/history (auth)
    getUserHistory: build.query<HistoryItem[], { limit?: number } | void>({
      query: (args) => ({
        url: '/me/history',
        params: args?.limit ? { limit: args.limit } : undefined,
      }),
      transformResponse: (res: any) => (res?.data ?? []) as HistoryItem[],
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((it) => ({ type: 'History' as const, id: `${it.type}:${it.id}` })),
              { type: 'History' as const, id: 'LIST' },
            ]
          : [{ type: 'History' as const, id: 'LIST' }],
    }),

    // GET /me/readings/recent
    getRecentReadings: build.query<HistoryItem[], { limit?: number } | void>({
      query: (args) => ({
        url: '/me/readings/recent',
        params: args?.limit ? { limit: args.limit } : undefined,
      }),
      transformResponse: (res: any) => (res?.data ?? []) as HistoryItem[],
      providesTags: [{ type: 'History', id: 'RECENT' }],
    }),

    // DELETE /me/readings/:type/:id
    deleteReading: build.mutation<{ ok: boolean }, { type: ReadingType; id: string }>({
      query: ({ type, id }) => ({
        url: `/me/readings/${type}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { type, id }) => [
        { type: 'History', id: `${type}:${id}` },
        { type: 'History', id: 'LIST' },
        { type: 'History', id: 'RECENT' },
      ],
    }),

    // DELETE /me/readings/all
    deleteAllReadings: build.mutation<
      { ok: boolean; deleted: Record<ReadingType, number>; total: number },
      void
    >({
      query: () => ({ url: '/me/readings/all', method: 'DELETE' }),
      invalidatesTags: [
        { type: 'History', id: 'LIST' },
        { type: 'History', id: 'RECENT' },
      ],
    }),

    // T28-6 — Consultant: customer readings
    getCustomerReadingsForConsultant: build.query<
      HistoryItem[],
      { bookingId: string; limit?: number }
    >({
      query: ({ bookingId, limit }) => ({
        url: `/admin/consultants/sessions/${encodeURIComponent(bookingId)}/user-readings`,
        params: limit ? { limit } : undefined,
      }),
      transformResponse: (res: any) => (res?.data ?? []) as HistoryItem[],
    }),
  }),
});

export const {
  useGetUserHistoryQuery,
  useGetRecentReadingsQuery,
  useDeleteReadingMutation,
  useDeleteAllReadingsMutation,
  useGetCustomerReadingsForConsultantQuery,
} = historyPublicApi;
