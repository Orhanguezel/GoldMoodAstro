import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  ChatThreadsResponse,
  ChatThreadResponse,
  ChatMessagesResponse,
  ChatMessageResponse,
  ChatListThreadsParams,
  ChatListMessagesParams,
  ChatCreateThreadBody,
  ChatPostMessageBody,
} from '@/integrations/shared';

export const chatApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listChatThreads: b.query<ChatThreadsResponse, ChatListThreadsParams | void>({
      query: (args) => ({
        url: '/chat/threads',
        params: args || undefined,
      }),
      providesTags: ['ChatThreads'],
    }),

    createOrGetChatThread: b.mutation<ChatThreadResponse, ChatCreateThreadBody>({
      query: (body) => ({
        url: '/chat/threads',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ChatThreads'],
    }),

    listChatMessages: b.query<ChatMessagesResponse, { threadId: string } & ChatListMessagesParams>({
      query: ({ threadId, ...params }) => ({
        url: `/chat/threads/${threadId}/messages`,
        params,
      }),
      providesTags: ['ChatMessages'],
    }),

    postChatMessage: b.mutation<ChatMessageResponse, { threadId: string } & ChatPostMessageBody>({
      query: ({ threadId, ...body }) => ({
        url: `/chat/threads/${threadId}/messages`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ChatMessages'],
    }),

    requestAdminHandoff: b.mutation<ChatThreadResponse, { threadId: string; note?: string }>({
      query: ({ threadId, note }) => ({
        url: `/chat/threads/${threadId}/request-admin`,
        method: 'POST',
        body: note ? { note } : {},
      }),
      invalidatesTags: ['ChatThreads'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListChatThreadsQuery,
  useCreateOrGetChatThreadMutation,
  useListChatMessagesQuery,
  usePostChatMessageMutation,
  useRequestAdminHandoffMutation,
} = chatApi;
