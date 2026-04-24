import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  OrderView,
  OrderDetailView,
  PaymentGatewayPublic,
} from '@/integrations/shared';

const BASE = '/orders';

export const ordersPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listMyOrders: build.query<OrderView[], void>({
      query: () => ({ url: BASE, method: 'GET' }),
      providesTags: ['Profile'],
    }),

    getMyOrder: build.query<OrderDetailView, { id: string }>({
      query: ({ id }) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      providesTags: ['Profile'],
    }),

    listPaymentGateways: build.query<PaymentGatewayPublic[], void>({
      query: () => ({ url: `${BASE}/gateways`, method: 'GET' }),
    }),

    initIyzicoPayment: build.mutation<
      { success: boolean; checkout_url: string; token: string },
      { orderId: string; locale?: string }
    >({
      query: ({ orderId, locale }) => ({
        url: `${BASE}/${encodeURIComponent(orderId)}/init-iyzico`,
        method: 'POST',
        params: locale ? { locale } : undefined,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useListMyOrdersQuery,
  useGetMyOrderQuery,
  useListPaymentGatewaysQuery,
  useInitIyzicoPaymentMutation,
} = ordersPublicApi;
