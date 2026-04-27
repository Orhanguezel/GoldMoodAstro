import { baseApi } from '@/integrations/baseApi';
import type {
  RefundSubscriptionPayload,
  SubscriptionAdmin,
  SubscriptionAdminListQuery,
  SubscriptionAdminListResponse,
  SubscriptionPlanAdmin,
  SubscriptionPlanAdminListQuery,
  SubscriptionPlanAdminListResponse,
  SubscriptionPlanAdminPayload,
  SubscriptionPlanAdminUpdatePayload,
} from '@/integrations/shared';
import {
  normalizeSubscriptionAdmin,
  normalizeSubscriptionAdminList,
  normalizeSubscriptionPlanAdmin,
  normalizeSubscriptionPlanAdminList,
} from '@/integrations/shared';

const BASE_SUBSCRIPTIONS = '/admin/subscriptions';
const BASE_PLANS = '/admin/subscription-plans';

function toBool(v: unknown) {
  if (v === undefined) return undefined;
  if (v === true || v === 1) return 1;
  if (v === false || v === 0) return 0;
  if (typeof v === 'string') return v === 'true' || v === '1' ? 1 : 0;
  return undefined;
}

export const subscriptionsAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listSubscriptionsAdmin: build.query<SubscriptionAdminListResponse, SubscriptionAdminListQuery | void>({
      query: (params) => ({
        url: BASE_SUBSCRIPTIONS,
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (res: unknown) => normalizeSubscriptionAdminList(res),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((item) => ({ type: 'Subscription' as const, id: item.id })),
              { type: 'Subscriptions' as const, id: 'LIST' },
            ]
          : [{ type: 'Subscriptions' as const, id: 'LIST' }],
    }),

    getSubscriptionAdmin: build.query<SubscriptionAdmin, { id: string }>({
      query: ({ id }) => ({ url: `${BASE_SUBSCRIPTIONS}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown) => normalizeSubscriptionAdmin((res as { data?: unknown })?.data ?? res),
      providesTags: (_r, _e, arg) => [{ type: 'Subscription' as const, id: arg.id }],
    }),

    refundSubscriptionAdmin: build.mutation<{ success: boolean }, { id: string; body?: RefundSubscriptionPayload }>({
      query: ({ id, body }) => ({
        url: `${BASE_SUBSCRIPTIONS}/${encodeURIComponent(id)}/refund`,
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Subscription' as const, id: arg.id },
        { type: 'Subscriptions' as const, id: 'LIST' },
      ],
    }),

    listSubscriptionPlansAdmin: build.query<SubscriptionPlanAdminListResponse, SubscriptionPlanAdminListQuery | void>({
      query: (params) => ({
        url: BASE_PLANS,
        method: 'GET',
        params: params
          ? {
              q: params.q,
              period: params.period,
              is_active: toBool(params.is_active),
              limit: params.limit,
              offset: params.offset,
            }
          : undefined,
      }),
      transformResponse: (res: unknown) => normalizeSubscriptionPlanAdminList(res),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((item) => ({ type: 'Subscription' as const, id: item.id })),
              { type: 'Subscriptions' as const, id: 'PLAN_LIST' },
            ]
          : [{ type: 'Subscriptions' as const, id: 'PLAN_LIST' }],
    }),

    getSubscriptionPlanAdmin: build.query<SubscriptionPlanAdmin, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE_PLANS}/${encodeURIComponent(id)}`,
        method: 'GET',
      }),
      transformResponse: (res: unknown) => normalizeSubscriptionPlanAdmin((res as { data?: unknown })?.data ?? res),
      providesTags: (_r, _e, arg) => [{ type: 'Subscription' as const, id: `plan:${arg.id}` }],
    }),

    createSubscriptionPlanAdmin: build.mutation<SubscriptionPlanAdmin, SubscriptionPlanAdminPayload>({
      query: (body) => ({
        url: BASE_PLANS,
        method: 'POST',
        body,
      }),
      transformResponse: (res: unknown) => normalizeSubscriptionPlanAdmin((res as { data?: unknown })?.data ?? res),
      invalidatesTags: [{ type: 'Subscriptions' as const, id: 'PLAN_LIST' }],
    }),

    updateSubscriptionPlanAdmin: build.mutation<
      SubscriptionPlanAdmin,
      { id: string; body: SubscriptionPlanAdminUpdatePayload }
    >({
      query: ({ id, body }) => ({
        url: `${BASE_PLANS}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: unknown) => normalizeSubscriptionPlanAdmin((res as { data?: unknown })?.data ?? res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Subscription' as const, id: `plan:${arg.id}` },
        { type: 'Subscriptions' as const, id: 'PLAN_LIST' },
      ],
    }),

    deleteSubscriptionPlanAdmin: build.mutation<{ success: boolean }, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE_PLANS}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: (res: unknown) => ({ success: (res as { success?: boolean })?.success ?? true }),
      invalidatesTags: [
        { type: 'Subscriptions' as const, id: 'PLAN_LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListSubscriptionsAdminQuery,
  useGetSubscriptionAdminQuery,
  useRefundSubscriptionAdminMutation,
  useListSubscriptionPlansAdminQuery,
  useGetSubscriptionPlanAdminQuery,
  useCreateSubscriptionPlanAdminMutation,
  useUpdateSubscriptionPlanAdminMutation,
  useDeleteSubscriptionPlanAdminMutation,
} = subscriptionsAdminApi;

