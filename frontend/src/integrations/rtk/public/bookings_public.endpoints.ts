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
  }),
  overrideExisting: false,
});

export const { useCreateBookingPublicMutation } = bookingsPublicApi;
