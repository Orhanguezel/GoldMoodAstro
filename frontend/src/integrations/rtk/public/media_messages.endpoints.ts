import { baseApi } from '../baseApi';

export type MediaKind = 'audio' | 'video';
export type MediaMessageStatus = 'sent' | 'answered' | 'expired' | 'refunded';

export type ConsultantMediaSettings = {
  consultant_id: string;
  audio_enabled: boolean;
  audio_price: number;
  video_enabled: boolean;
  video_price: number;
  reply_sla_hours: number;
  currency: string;
};

export type MediaMessage = {
  id: string;
  user_id: string;
  consultant_id: string;
  parent_id: string | null;
  kind: MediaKind;
  direction: 'question' | 'reply';
  storage_path: string;
  duration_seconds: number | null;
  note: string | null;
  price: number;
  currency: string;
  status: MediaMessageStatus;
  reply_due_at: string | null;
  answered_at: string | null;
  created_at: string;
  consultant_name?: string | null;
  consultant_avatar_url?: string | null;
  customer_name?: string | null;
  customer_avatar_url?: string | null;
  reply_id?: string | null;
  reply_kind?: MediaKind | null;
  reply_storage_path?: string | null;
  reply_duration_seconds?: number | null;
  reply_note?: string | null;
  reply_created_at?: string | null;
};

export type CreateMediaMessageInput = {
  consultant_id: string;
  kind: MediaKind;
  storage_path: string;
  duration_seconds?: number;
  note?: string | null;
};

export type UpdateMediaSettingsInput = {
  audio_enabled: boolean;
  audio_price: number;
  video_enabled: boolean;
  video_price: number;
  reply_sla_hours: number;
};

const mediaMessagesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getConsultantMediaSettings: build.query<ConsultantMediaSettings, string>({
      query: (id) => `/consultants/${encodeURIComponent(id)}/media-settings`,
      transformResponse: (res: { data: ConsultantMediaSettings } | ConsultantMediaSettings) => ((res as any)?.data ?? res) as ConsultantMediaSettings,
      providesTags: (_res, _err, id) => [{ type: 'MediaSettings' as const, id }],
    }),
    updateMyConsultantMediaSettings: build.mutation<ConsultantMediaSettings, UpdateMediaSettingsInput>({
      query: (body) => ({ url: '/me/consultant/media-settings', method: 'PUT', body }),
      transformResponse: (res: { data: ConsultantMediaSettings } | ConsultantMediaSettings) => ((res as any)?.data ?? res) as ConsultantMediaSettings,
      invalidatesTags: ['MediaSettings'],
    }),
    createMediaMessage: build.mutation<MediaMessage, CreateMediaMessageInput>({
      query: (body) => ({ url: '/me/media-messages', method: 'POST', body }),
      transformResponse: (res: { data: MediaMessage } | MediaMessage) => ((res as any)?.data ?? res) as MediaMessage,
      invalidatesTags: ['MediaMessages'],
    }),
    listMyMediaMessages: build.query<MediaMessage[], void>({
      query: () => '/me/media-messages',
      transformResponse: (res: { data: MediaMessage[] }) => res.data ?? [],
      providesTags: ['MediaMessages'],
    }),
    listMyConsultantMediaMessages: build.query<MediaMessage[], void>({
      query: () => '/me/consultant/media-messages',
      transformResponse: (res: { data: MediaMessage[] }) => res.data ?? [],
      providesTags: ['MediaMessages'],
    }),
    replyMediaMessage: build.mutation<MediaMessage, { id: string; kind: MediaKind; storage_path: string; duration_seconds?: number; note?: string | null }>({
      query: ({ id, ...body }) => ({ url: `/me/consultant/media-messages/${encodeURIComponent(id)}/reply`, method: 'POST', body }),
      transformResponse: (res: { data: MediaMessage } | MediaMessage) => ((res as any)?.data ?? res) as MediaMessage,
      invalidatesTags: ['MediaMessages'],
    }),
  }),
});

export const {
  useGetConsultantMediaSettingsQuery,
  useUpdateMyConsultantMediaSettingsMutation,
  useCreateMediaMessageMutation,
  useListMyMediaMessagesQuery,
  useListMyConsultantMediaMessagesQuery,
  useReplyMediaMessageMutation,
} = mediaMessagesApi;
