// =============================================================
// FILE: src/integrations/endpoints/admin/orders_admin.endpoints.ts
// Admin Orders + Payment Gateways RTK Query
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  OrdersListResp,
  OrdersListQuery,
  OrderAdminDetailView,
  OrderUpdateBody,
  PaymentGatewayView,
  PaymentGatewayCreateBody,
  PaymentGatewayUpdateBody,
} from '@/integrations/shared';
import {
  normalizeOrdersListResp,
  normalizeOrderAdminDetail,
  normalizePaymentGateway,
  toOrdersListQuery,
} from '@/integrations/shared';

const BASE = '/admin/orders';
const GW_BASE = '/admin/payment-gateways';

export const ordersAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listOrdersAdmin: b.query<OrdersListResp, OrdersListQuery | void>({
      query: (params) => ({
        url: BASE,
        method: 'GET',
        params: params ? toOrdersListQuery(params) : undefined,
      }),
      transformResponse: (res: unknown) => normalizeOrdersListResp(res),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((o) => ({ type: 'Order' as const, id: o.id })),
              { type: 'Orders' as const, id: 'LIST' },
            ]
          : [{ type: 'Orders' as const, id: 'LIST' }],
    }),

    getOrderAdmin: b.query<OrderAdminDetailView, { id: string }>({
      query: ({ id }) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown) => normalizeOrderAdminDetail(res),
      providesTags: (_r, _e, arg) => [{ type: 'Order' as const, id: arg.id }],
    }),

    updateOrderAdmin: b.mutation<{ success: boolean }, { id: string; body: OrderUpdateBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: unknown) => ({ success: (res as any)?.success === true || true }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Order' as const, id: arg.id },
        { type: 'Orders' as const, id: 'LIST' },
      ],
    }),

    refundOrderAdmin: b.mutation<{ success: boolean }, { id: string; body?: { reason?: string } }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/refund`,
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Order' as const, id: arg.id },
        { type: 'Orders' as const, id: 'LIST' },
      ],
    }),

    // Payment Gateways
    listPaymentGatewaysAdmin: b.query<PaymentGatewayView[], void>({
      query: () => ({ url: GW_BASE, method: 'GET' }),
      transformResponse: (res: unknown) => {
        const arr = Array.isArray(res) ? res : [];
        return arr.map(normalizePaymentGateway);
      },
      providesTags: [{ type: 'Payments' as const, id: 'GATEWAYS' }],
    }),

    createPaymentGatewayAdmin: b.mutation<{ success: boolean; id: string }, PaymentGatewayCreateBody>({
      query: (body) => ({ url: GW_BASE, method: 'POST', body }),
      invalidatesTags: [{ type: 'Payments' as const, id: 'GATEWAYS' }],
    }),

    updatePaymentGatewayAdmin: b.mutation<
      { success: boolean },
      { id: string; body: PaymentGatewayUpdateBody }
    >({
      query: ({ id, body }) => ({
        url: `${GW_BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Payments' as const, id: 'GATEWAYS' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListOrdersAdminQuery,
  useGetOrderAdminQuery,
  useUpdateOrderAdminMutation,
  useRefundOrderAdminMutation,
  useListPaymentGatewaysAdminQuery,
  useCreatePaymentGatewayAdminMutation,
  useUpdatePaymentGatewayAdminMutation,
} = ordersAdminApi;
