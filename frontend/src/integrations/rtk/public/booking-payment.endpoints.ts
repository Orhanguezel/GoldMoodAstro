import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  BookingPaymentInfoResp,
  PayBookingBody,
  PayBookingResp,
  CaptureBookingPaypalBody,
  CaptureBookingPaypalResp,
} from '@/integrations/shared';

const BASE = '/bookings';

export const bookingPaymentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getBookingPaymentInfo: build.query<BookingPaymentInfoResp, { id: string }>({
      query: ({ id }) => ({ url: `${BASE}/${id}/payment-info`, method: 'GET' }),
    }),

    payBooking: build.mutation<PayBookingResp, { id: string } & PayBookingBody>({
      query: ({ id, ...body }) => ({ url: `${BASE}/${id}/pay`, method: 'POST', body }),
    }),

    captureBookingPaypal: build.mutation<CaptureBookingPaypalResp, { id: string } & CaptureBookingPaypalBody>({
      query: ({ id, ...body }) => ({ url: `${BASE}/${id}/paypal/capture`, method: 'POST', body }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBookingPaymentInfoQuery,
  usePayBookingMutation,
  useCaptureBookingPaypalMutation,
} = bookingPaymentApi;
