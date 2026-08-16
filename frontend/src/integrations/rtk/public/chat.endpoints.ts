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
  ChatSupportSessionResponse,
  ChatSupportMessagesResponse,
  ChatSupportPostResponse,
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
    createSupportSession: b.mutation<ChatSupportSessionResponse, { locale: string; visitor_token?: string }>({
      query: (body) => ({ url: '/chat/support/session', method: 'POST', body }),
    }),
    listSupportMessages: b.query<ChatSupportMessagesResponse, { threadId: string; visitor_token?: string }>({
      query: ({ threadId, visitor_token }) => ({ url: `/chat/support/${threadId}/messages`, params: visitor_token ? { visitor_token } : undefined }),
      providesTags: ['ChatMessages'],
    }),
    postSupportMessage: b.mutation<ChatSupportPostResponse, { threadId: string; visitor_token?: string; text: string; client_id?: string }>({
      query: ({ threadId, ...body }) => ({ url: `/chat/support/${threadId}/messages`, method: 'POST', body }),
      invalidatesTags: ['ChatMessages'],
    }),
    requestSupportAdmin: b.mutation<ChatThreadResponse, { threadId: string; visitor_token?: string }>({
      query: ({ threadId, visitor_token }) => ({ url: `/chat/support/${threadId}/request-admin`, method: 'POST', body: visitor_token ? { visitor_token } : {} }),
      invalidatesTags: ['ChatMessages'],
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
  useCreateSupportSessionMutation,
  useListSupportMessagesQuery,
  usePostSupportMessageMutation,
  useRequestSupportAdminMutation,
} = chatApi;
