import { baseApi } from '../baseApi';

export const synastryPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSynastryManual: build.mutation<any, { partner_data: any }>({
      query: (body) => ({
        url: '/synastry/manual',
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => res.data,
      invalidatesTags: ['History'],
    }),
    getSynastryQuick: build.mutation<any, { sign_a: string; sign_b: string }>({
      query: (body) => ({
        url: '/synastry/quick',
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => res.data,
    }),
    getSynastryReadingById: build.query<any, string>({
      query: (id) => `/synastry/reading/${id}`,
    }),
    getMySynastryReports: build.query<any[], void>({
      query: () => '/synastry/me',
      transformResponse: (res: any) => res.data,
      providesTags: ['Synastry'],
    }),
    searchUsers: build.query<any[], string>({
      query: (q) => `/auth/search?q=${q}`,
      transformResponse: (res: any) => res.data,
    }),
    createSynastryInvite: build.mutation<any, { partner_user_id: string; chart_id?: string }>({
      query: (body) => ({
        url: '/synastry/invite',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Synastry'],
    }),
    getSynastryInvites: build.query<any[], void>({
      query: () => '/synastry/invites/me',
      transformResponse: (res: any) => res.data,
      providesTags: ['Synastry'],
    }),
    acceptSynastryInvite: build.mutation<any, string>({
      query: (id) => ({
        url: `/synastry/invite/${id}/accept`,
        method: 'POST',
      }),
      invalidatesTags: ['Synastry', 'History'],
    }),
    declineSynastryInvite: build.mutation<any, string>({
      query: (id) => ({
        url: `/synastry/invite/${id}/decline`,
        method: 'POST',
      }),
      invalidatesTags: ['Synastry'],
    }),
  }),
});

export const { 
  useGetSynastryManualMutation, 
  useGetSynastryQuickMutation, 
  useGetSynastryReadingByIdQuery,
  useGetMySynastryReportsQuery,
  useSearchUsersQuery,
  useCreateSynastryInviteMutation,
  useGetSynastryInvitesQuery,
  useAcceptSynastryInviteMutation,
  useDeclineSynastryInviteMutation
} = synastryPublicApi;
