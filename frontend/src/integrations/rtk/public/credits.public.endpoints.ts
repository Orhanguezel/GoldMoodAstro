import { baseApi } from '../baseApi';

export const creditsPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listCreditPackages: build.query<any[], void>({
      query: () => '/credits/packages',
      transformResponse: (res: any) => res.data,
    }),
    getUserBalance: build.query<{ balance: number }, void>({
      query: () => '/credits/balance',
      transformResponse: (res: any) => res.data,
      providesTags: ['Credits'],
    }),
    buyCredits: build.mutation<{ checkout_url: string; token: string }, { package_id: string; locale?: string }>({
      query: (body) => ({
        url: '/credits/buy',
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => res.data,
    }),
  }),
});

export const { useListCreditPackagesQuery, useGetUserBalanceQuery, useBuyCreditsMutation } = creditsPublicApi;
