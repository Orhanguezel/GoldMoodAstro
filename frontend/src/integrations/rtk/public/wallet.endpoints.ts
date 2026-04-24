import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  WalletCreateDepositBody,
  WalletCreateDepositResp,
  WalletDepositMethodsResp,
  WalletDto,
  WalletTransactionsResp,
} from '@/integrations/shared';
import { cleanParams } from '@/integrations/shared';

const BASE = '/wallet';

export const walletPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMyWallet: build.query<WalletDto, void>({
      query: () => ({ url: BASE, method: 'GET' }),
      providesTags: ['Profile'],
    }),

    listMyWalletTransactions: build.query<WalletTransactionsResp, { page?: number; limit?: number } | void>({
      query: (params) => ({
        url: `${BASE}/transactions`,
        method: 'GET',
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
    }),

    getWalletDepositMethods: build.query<WalletDepositMethodsResp, void>({
      query: () => ({ url: `${BASE}/deposit-methods`, method: 'GET' }),
    }),

    createWalletDeposit: build.mutation<WalletCreateDepositResp, WalletCreateDepositBody>({
      query: (body) => ({
        url: `${BASE}/deposits`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Profile'],
    }),

    captureWalletDepositPaypal: build.mutation<
      { success: boolean; already_completed?: boolean; transaction?: unknown },
      { id: string; paypal_order_id: string }
    >({
      query: ({ id, paypal_order_id }) => ({
        url: `${BASE}/deposits/${encodeURIComponent(id)}/paypal/capture`,
        method: 'POST',
        body: { paypal_order_id },
      }),
      invalidatesTags: ['Profile'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyWalletQuery,
  useListMyWalletTransactionsQuery,
  useGetWalletDepositMethodsQuery,
  useCreateWalletDepositMutation,
  useCaptureWalletDepositPaypalMutation,
} = walletPublicApi;
