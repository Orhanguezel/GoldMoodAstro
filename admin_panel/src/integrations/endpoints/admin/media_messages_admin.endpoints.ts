import { baseApi } from '@/integrations/baseApi';

export type AdminMediaMessage = {
  id: string;
  user_id: string;
  consultant_id: string;
  kind: 'audio' | 'video';
  status: 'sent' | 'answered' | 'expired' | 'refunded';
  price: number;
  currency: string;
  note: string | null;
  created_at: string;
  reply_due_at: string | null;
  answered_at: string | null;
  customer_name: string | null;
  consultant_name: string | null;
  reply_id: string | null;
  reply_kind: 'audio' | 'video' | null;
};

export type AdminMediaMessageStats = {
  total: number;
  answered: number;
  refunded: number;
  waiting: number;
  response_rate: number;
};

export const mediaMessagesAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listMediaMessagesAdmin: builder.query<AdminMediaMessage[], { status?: string } | void>({
      query: (args) => ({ url: '/admin/media-messages', params: args?.status ? { status: args.status } : undefined }),
      transformResponse: (res: { data: AdminMediaMessage[] }) => res.data ?? [],
      providesTags: ['MediaMessages'],
    }),
    getMediaMessageStatsAdmin: builder.query<AdminMediaMessageStats, void>({
      query: () => '/admin/media-messages/stats',
      transformResponse: (res: { data: AdminMediaMessageStats }) => res.data,
      providesTags: ['MediaMessages'],
    }),
  }),
});

export const {
  useListMediaMessagesAdminQuery,
  useGetMediaMessageStatsAdminQuery,
} = mediaMessagesAdminApi;

