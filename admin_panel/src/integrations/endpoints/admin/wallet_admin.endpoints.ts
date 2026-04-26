import { baseApi } from '@/integrations/baseApi';
import type {
  WalletAdjustBody,
  WalletDepositsListQuery,
  WalletListResp,
  WalletPatchStatusBody,
  WalletPatchTransactionStatusBody,
  WalletRejectDepositBody,
  WalletTxListResp,
  WalletAdminView,
} from '@/integrations/shared';
import {
  normalizeWalletAdmin,
  normalizeWalletListResp,
  normalizeWalletTxListResp,
  toWalletDepositsListQuery,
} from '@/integrations/shared';

const BASE_WALLETS = '/admin/wallets';
const BASE_TX = '/admin/wallet_transactions';
const BASE_DEPOSITS = '/admin/wallet_deposits';

export const walletAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listWalletsAdmin: b.query<WalletListResp, { page?: number; limit?: number } | void>({
      query: (params) => ({
        url: BASE_WALLETS,
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (res: unknown) => normalizeWalletListResp(res),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((x) => ({ type: 'WalletTransactions' as const, id: `wallet:${x.id}` })),
              { type: 'WalletDepositRequests' as const, id: 'WALLETS_LIST' },
            ]
          : [{ type: 'WalletDepositRequests' as const, id: 'WALLETS_LIST' }],
    }),

    getWalletAdmin: b.query<WalletAdminView, { id: string }>({
      query: ({ id }) => ({ url: `${BASE_WALLETS}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown) => normalizeWalletAdmin(res),
      providesTags: (_r, _e, arg) => [{ type: 'WalletTransactions' as const, id: `wallet:${arg.id}` }],
    }),

    patchWalletStatusAdmin: b.mutation<{ success: boolean }, { id: string; body: WalletPatchStatusBody }>({
      query: ({ id, body }) => ({
        url: `${BASE_WALLETS}/${encodeURIComponent(id)}/status`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: unknown) => ({ success: (res as any)?.success === true || true }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'WalletTransactions' as const, id: `wallet:${arg.id}` },
        { type: 'WalletDepositRequests' as const, id: 'WALLETS_LIST' },
      ],
    }),

    adjustWalletAdmin: b.mutation<{ success: boolean; transaction_id?: string }, WalletAdjustBody>({
      query: (body) => ({ url: `${BASE_WALLETS}/adjust`, method: 'POST', body }),
      transformResponse: (res: unknown) => ({
        success: (res as any)?.success === true || false,
        transaction_id: (res as any)?.transaction_id,
      }),
      invalidatesTags: [
        { type: 'WalletDepositRequests' as const, id: 'WALLETS_LIST' },
        { type: 'WalletDepositRequests' as const, id: 'DEPOSITS_LIST' },
      ],
    }),

    listWalletTransactionsAdmin: b.query<WalletTxListResp, { walletId: string; page?: number; limit?: number }>({
      query: ({ walletId, page, limit }) => ({
        url: `${BASE_WALLETS}/${encodeURIComponent(walletId)}/transactions`,
        method: 'GET',
        params: { page, limit },
      }),
      transformResponse: (res: unknown) => normalizeWalletTxListResp(res),
      providesTags: (_r, _e, arg) => [{ type: 'WalletTransactions' as const, id: `wallet:${arg.walletId}` }],
    }),

    patchWalletTransactionStatusAdmin: b.mutation<
      { success: boolean },
      { id: string; body: WalletPatchTransactionStatusBody }
    >({
      query: ({ id, body }) => ({
        url: `${BASE_TX}/${encodeURIComponent(id)}/status`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: unknown) => ({ success: (res as any)?.success === true || true }),
      invalidatesTags: [
        { type: 'WalletDepositRequests' as const, id: 'DEPOSITS_LIST' },
        { type: 'WalletDepositRequests' as const, id: 'WALLETS_LIST' },
      ],
    }),

    listWalletDepositsAdmin: b.query<WalletTxListResp, WalletDepositsListQuery | void>({
      query: (params) => ({
        url: BASE_DEPOSITS,
        method: 'GET',
        params: params ? toWalletDepositsListQuery(params) : undefined,
      }),
      transformResponse: (res: unknown) => normalizeWalletTxListResp(res),
      providesTags: [{ type: 'WalletDepositRequests' as const, id: 'DEPOSITS_LIST' }],
    }),

    approveWalletDepositAdmin: b.mutation<{ success: boolean }, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE_DEPOSITS}/${encodeURIComponent(id)}/approve`,
        method: 'POST',
      }),
      transformResponse: (res: unknown) => ({ success: (res as any)?.success === true || true }),
      invalidatesTags: [
        { type: 'WalletDepositRequests' as const, id: 'DEPOSITS_LIST' },
        { type: 'WalletDepositRequests' as const, id: 'WALLETS_LIST' },
      ],
    }),

    rejectWalletDepositAdmin: b.mutation<
      { success: boolean },
      { id: string; body?: WalletRejectDepositBody }
    >({
      query: ({ id, body }) => ({
        url: `${BASE_DEPOSITS}/${encodeURIComponent(id)}/reject`,
        method: 'POST',
        body: body ?? {},
      }),
      transformResponse: (res: unknown) => ({ success: (res as any)?.success === true || true }),
      invalidatesTags: [
        { type: 'WalletDepositRequests' as const, id: 'DEPOSITS_LIST' },
        { type: 'WalletDepositRequests' as const, id: 'WALLETS_LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListWalletsAdminQuery,
  useGetWalletAdminQuery,
  usePatchWalletStatusAdminMutation,
  useAdjustWalletAdminMutation,
  useListWalletTransactionsAdminQuery,
  usePatchWalletTransactionStatusAdminMutation,
  useListWalletDepositsAdminQuery,
  useApproveWalletDepositAdminMutation,
  useRejectWalletDepositAdminMutation,
} = walletAdminApi;
