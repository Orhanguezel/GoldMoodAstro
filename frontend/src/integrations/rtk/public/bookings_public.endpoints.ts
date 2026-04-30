// =============================================================
// FILE: src/integrations/rtk/endpoints/bookings.endpoints.ts
// Public bookings – POST /bookings
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type { BookingPublicCreatePayload, BookingPublicCreateResult } from '@/integrations/shared';

export const bookingsPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * PUBLIC: Booking create
     * POST /bookings
     */
    createBookingPublic: build.mutation<BookingPublicCreateResult, BookingPublicCreatePayload>({
      query: (body) => ({
        url: '/bookings',
        method: 'POST',
        body,
      }),
    }),
    /**
     * T29-4: Anlık görüşme talebi
     * POST /bookings/request-now
     */
    requestNowBooking: build.mutation<
      { ok: boolean; id: string; status: string; message: string; timeout_at: string },
      { consultant_id: string; service_id?: string; customer_message?: string }
    >({
      query: (body) => ({
        url: '/bookings/request-now',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Booking'],
    }),
    /**
     * GET /bookings/me
     */
    listMyBookings: build.query<any[], void>({
      query: () => ({
        url: '/bookings/me',
        method: 'GET',
      }),
      providesTags: ['Booking'],
    }),
    /**
     * GET /bookings/:id
     */
    getMyBooking: build.query<any, string>({
      query: (id) => ({
        url: `/bookings/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Booking', id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateBookingPublicMutation,
  useRequestNowBookingMutation,
  useListMyBookingsQuery,
  useGetMyBookingQuery,
} = bookingsPublicApi;
