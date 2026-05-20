import { baseApi } from '@/integrations/baseApi';
import type { 
  WithdrawalsListResponse, 
  WithdrawalsListQueryParams,
  WithdrawalRequestDto 
} from '@/integrations/shared';
import { coerceWithdrawalsList } from '@/integrations/shared';

const BASE = 'admin/withdrawals';

export const withdrawalsAdminApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (build) => ({
    listWithdrawalsAdmin: build.query<WithdrawalsListResponse, WithdrawalsListQueryParams | void>({
      query: (params) => ({
        url: `${BASE}`,
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (raw: any) => coerceWithdrawalsList(raw),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Withdrawal' as const, id })),
              { type: 'Withdrawal', id: 'LIST' },
            ]
          : [{ type: 'Withdrawal', id: 'LIST' }],
    }),

    approveWithdrawalAdmin: build.mutation<WithdrawalRequestDto, string>({
      query: (id) => ({
        url: `${BASE}/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Withdrawal', id },
        { type: 'Withdrawal', id: 'LIST' },
      ],
    }),

    rejectWithdrawalAdmin: build.mutation<WithdrawalRequestDto, { id: string; rejection_reason: string }>({
      query: ({ id, rejection_reason }) => ({
        url: `${BASE}/${id}/reject`,
        method: 'POST',
        body: { rejection_reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Withdrawal', id },
        { type: 'Withdrawal', id: 'LIST' },
      ],
    }),

    markPaidWithdrawalAdmin: build.mutation<WithdrawalRequestDto, { id: string; transfer_reference: string; paid_at?: string }>({
      query: ({ id, transfer_reference, paid_at }) => ({
        url: `${BASE}/${id}/mark-paid`,
        method: 'POST',
        body: { transfer_reference, paid_at },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Withdrawal', id },
        { type: 'Withdrawal', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListWithdrawalsAdminQuery,
  useApproveWithdrawalAdminMutation,
  useRejectWithdrawalAdminMutation,
  useMarkPaidWithdrawalAdminMutation,
} = withdrawalsAdminApi;
