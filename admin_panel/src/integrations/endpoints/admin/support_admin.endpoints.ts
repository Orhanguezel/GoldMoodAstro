import { baseApi } from '../../baseApi';
import type { SupportTicketView, TicketReplyView } from '../../shared/support';

export const supportAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listSupportTicketsAdmin: builder.query<SupportTicketView[], void>({
      query: () => '/admin/support_tickets',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'SupportTicket' as const, id })), { type: 'SupportTicket', id: 'LIST' }]
          : [{ type: 'SupportTicket', id: 'LIST' }],
    }),
    getSupportTicketAdmin: builder.query<SupportTicketView, string>({
      query: (id) => `/admin/support_tickets/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'SupportTicket', id }],
    }),
    updateSupportTicketAdmin: builder.mutation<SupportTicketView, { id: string; patch: Partial<SupportTicketView> }>({
      query: ({ id, patch }) => ({
        url: `/admin/support_tickets/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'SupportTicket', id },
        { type: 'SupportTicket', id: 'LIST' },
      ],
    }),
    toggleSupportTicketAdmin: builder.mutation<SupportTicketView, { id: string; action: 'close' | 'reopen' }>({
      query: ({ id, action }) => ({
        url: `/admin/support_tickets/${id}/${action}`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'SupportTicket', id },
        { type: 'SupportTicket', id: 'LIST' },
      ],
    }),
    listTicketRepliesAdmin: builder.query<TicketReplyView[], string>({
      query: (ticketId) => `/admin/ticket_replies/by-ticket/${ticketId}`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'TicketReply' as const, id })), { type: 'TicketReply', id: 'LIST' }]
          : [{ type: 'TicketReply', id: 'LIST' }],
    }),
    createTicketReplyAdmin: builder.mutation<TicketReplyView, { ticket_id: string; message: string }>({
      query: (body) => ({
        url: '/admin/ticket_replies',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'TicketReply', id: 'LIST' }, { type: 'SupportTicket', id: 'LIST' }],
    }),
  }),
});

export const {
  useListSupportTicketsAdminQuery,
  useGetSupportTicketAdminQuery,
  useUpdateSupportTicketAdminMutation,
  useToggleSupportTicketAdminMutation,
  useListTicketRepliesAdminQuery,
  useCreateTicketReplyAdminMutation,
} = supportAdminApi;
