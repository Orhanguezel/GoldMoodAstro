import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  GutscheinProductDto,
  PurchaseGutscheinBody,
  PurchaseGutscheinResp,
  CaptureGutscheinPaypalResp,
  CheckGutscheinBody,
  CheckGutscheinResp,
  RedeemGutscheinBody,
  RedeemGutscheinResp,
} from '@/integrations/shared';

const BASE = '/gutscheins';

export const gutscheinPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listGutscheinProducts: build.query<GutscheinProductDto[], void>({
      query: () => ({ url: `${BASE}/products`, method: 'GET' }),
    }),

    purchaseGutschein: build.mutation<PurchaseGutscheinResp, PurchaseGutscheinBody & { locale?: string }>({
      query: ({ locale, ...body }) => ({
        url: `${BASE}/purchase`,
        method: 'POST',
        body,
        headers: locale ? { 'x-locale': locale } : undefined,
      }),
    }),

    captureGutscheinPaypal: build.mutation<CaptureGutscheinPaypalResp, { id: string; order_id: string }>({
      query: ({ id, order_id }) => ({
        url: `${BASE}/${id}/paypal/capture`,
        method: 'POST',
        body: { order_id },
      }),
    }),

    checkGutscheinCode: build.mutation<CheckGutscheinResp, CheckGutscheinBody>({
      query: (body) => ({ url: `${BASE}/check`, method: 'POST', body }),
    }),

    redeemGutschein: build.mutation<RedeemGutscheinResp, RedeemGutscheinBody>({
      query: (body) => ({ url: `${BASE}/redeem`, method: 'POST', body }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useListGutscheinProductsQuery,
  usePurchaseGutscheinMutation,
  useCaptureGutscheinPaypalMutation,
  useCheckGutscheinCodeMutation,
  useRedeemGutscheinMutation,
} = gutscheinPublicApi;
