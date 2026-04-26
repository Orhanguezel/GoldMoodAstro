// =============================================================
// FILE: src/integrations/rtk/endpoints/admin/bookings_admin.endpoints.ts
// FINAL — Admin bookings RTK endpoints (CRUD + accept/reject)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  BookingDto,
  BookingMergedDto,
  BookingListQueryParams,
  BookingAdminCreatePayload,
  BookingAdminUpdatePayload,
} from '@/integrations/shared';

const BASE = '/admin/bookings';

export type BookingDecisionPayload = {
  decision_note?: string;
  locale?: string; // optional override, otherwise backend uses booking.locale
};

export type BookingReminderPayload = {
  reminder_note?: string;
  locale?: string;
};

export const bookingsAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * LIST (admin) – GET /admin/bookings
     */
    listBookingsAdmin: build.query<BookingMergedDto[], BookingListQueryParams | void>({
      query: (params?: BookingListQueryParams) => ({
        url: `${BASE}`,
        method: 'GET',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((b) => ({ type: 'Bookings' as const, id: b.id })),
              { type: 'Bookings' as const, id: 'LIST' },
            ]
          : [{ type: 'Bookings' as const, id: 'LIST' }],
    }),

    /**
     * GET BY ID (admin) – GET /admin/bookings/:id
     * Supports ?locale=de
     */
    getBookingAdmin: build.query<BookingMergedDto, { id: string; locale?: string } | string>({
      query: (arg) => {
        const id = typeof arg === 'string' ? arg : arg.id;
        const locale = typeof arg === 'string' ? undefined : arg.locale;
        return {
          url: `${BASE}/${id}`,
          method: 'GET',
          params: locale ? { locale } : undefined,
        };
      },
      providesTags: (result, _error, arg) => {
        const id = typeof arg === 'string' ? arg : arg.id;
        return result
          ? [{ type: 'Bookings' as const, id: result.id }]
          : [{ type: 'Bookings' as const, id }];
      },
    }),

    /**
     * CREATE (admin) – POST /admin/bookings
     */
    createBookingAdmin: build.mutation<BookingMergedDto | BookingDto, BookingAdminCreatePayload>({
      query: (body) => ({
        url: `${BASE}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Bookings' as const, id: 'LIST' }],
    }),

    /**
     * UPDATE (admin) – PATCH /admin/bookings/:id
     */
    updateBookingAdmin: build.mutation<
      BookingMergedDto,
      { id: string; patch: BookingAdminUpdatePayload; locale?: string }
    >({
      query: ({ id, patch, locale }) => ({
        url: `${BASE}/${id}`,
        method: 'PATCH',
        params: locale ? { locale } : undefined,
        body: patch,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Bookings' as const, id: arg.id },
        { type: 'Bookings' as const, id: 'LIST' },
      ],
    }),

    /**
     * ACCEPT (admin) – POST /admin/bookings/:id/accept
     * Body: { decision_note?, locale? }
     */
    acceptBookingAdmin: build.mutation<
      BookingMergedDto,
      { id: string; body?: BookingDecisionPayload }
    >({
      query: ({ id, body }) => ({
        url: `${BASE}/${id}/accept`,
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Bookings' as const, id: arg.id },
        { type: 'Bookings' as const, id: 'LIST' },
      ],
    }),

    /**
     * REJECT (admin) – POST /admin/bookings/:id/reject
     * Body: { decision_note?, locale? }
     */
    rejectBookingAdmin: build.mutation<
      BookingMergedDto,
      { id: string; body?: BookingDecisionPayload }
    >({
      query: ({ id, body }) => ({
        url: `${BASE}/${id}/reject`,
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Bookings' as const, id: arg.id },
        { type: 'Bookings' as const, id: 'LIST' },
      ],
    }),

    /**
     * REMINDER (admin) - POST /admin/bookings/:id/reminder
     */
    sendBookingReminderAdmin: build.mutation<
      BookingMergedDto,
      { id: string; body?: BookingReminderPayload }
    >({
      query: ({ id, body }) => ({
        url: `${BASE}/${id}/reminder`,
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Bookings' as const, id: arg.id },
        { type: 'Bookings' as const, id: 'LIST' },
      ],
    }),

    /**
     * MARK READ (admin) – POST /admin/bookings/:id/read
     */
    markBookingReadAdmin: build.mutation<BookingMergedDto, string>({
      query: (id) => ({
        url: `${BASE}/${id}/read`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Bookings' as const, id },
        { type: 'Bookings' as const, id: 'LIST' },
      ],
    }),

    /**
     * DELETE (admin) – DELETE /admin/bookings/:id
     */
    deleteBookingAdmin: build.mutation<{ ok: boolean } | void, string>({
      query: (id) => ({
        url: `${BASE}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Bookings' as const, id },
        { type: 'Bookings' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListBookingsAdminQuery,
  useGetBookingAdminQuery,
  useCreateBookingAdminMutation,
  useUpdateBookingAdminMutation,
  useAcceptBookingAdminMutation,
  useRejectBookingAdminMutation,
  useSendBookingReminderAdminMutation,
  useMarkBookingReadAdminMutation,
  useDeleteBookingAdminMutation,
} = bookingsAdminApi;
