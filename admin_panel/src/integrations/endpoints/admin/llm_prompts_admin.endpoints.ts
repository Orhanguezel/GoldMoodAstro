// =============================================================
// FILE: src/integrations/endpoints/admin/llm_prompts_admin.endpoints.ts
// FAZ 19 / T19-3 — Admin LLM prompt CRUD + "Test Et"
// =============================================================
import { baseApi } from '../../baseApi';
import type {
  LlmPromptDto,
  LlmPromptListQueryParams,
  LlmPromptListResponse,
  LlmPromptCreatePayload,
  LlmPromptUpdatePayload,
  LlmPromptTestPayload,
  LlmPromptTestResult,
} from '@/integrations/shared';

const llmPromptsAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listLlmPrompts: build.query<LlmPromptListResponse, LlmPromptListQueryParams | void>({
      query: (params) => ({ url: '/admin/llm-prompts', params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'LlmPrompt' as const, id })),
              { type: 'LlmPrompt', id: 'LIST' },
            ]
          : [{ type: 'LlmPrompt', id: 'LIST' }],
    }),
    getLlmPrompt: build.query<LlmPromptDto, string>({
      query: (id) => `/admin/llm-prompts/${encodeURIComponent(id)}`,
      providesTags: (_result, _error, id) => [{ type: 'LlmPrompt', id }],
    }),
    createLlmPrompt: build.mutation<LlmPromptDto, LlmPromptCreatePayload>({
      query: (body) => ({ url: '/admin/llm-prompts', method: 'POST', body }),
      invalidatesTags: [{ type: 'LlmPrompt', id: 'LIST' }],
    }),
    updateLlmPrompt: build.mutation<
      LlmPromptDto,
      { id: string; body: LlmPromptUpdatePayload }
    >({
      query: ({ id, body }) => ({
        url: `/admin/llm-prompts/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'LlmPrompt', id },
        { type: 'LlmPrompt', id: 'LIST' },
      ],
    }),
    deleteLlmPrompt: build.mutation<{ ok?: boolean }, string>({
      query: (id) => ({
        url: `/admin/llm-prompts/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'LlmPrompt', id: 'LIST' }],
    }),
    // T19-3 — "Test Et" — vars ile prompt'u sandbox'ta çalıştır
    testLlmPrompt: build.mutation<
      LlmPromptTestResult,
      { id: string; body: LlmPromptTestPayload }
    >({
      query: ({ id, body }) => ({
        url: `/admin/llm-prompts/${encodeURIComponent(id)}/test`,
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useListLlmPromptsQuery,
  useGetLlmPromptQuery,
  useCreateLlmPromptMutation,
  useUpdateLlmPromptMutation,
  useDeleteLlmPromptMutation,
  useTestLlmPromptMutation,
} = llmPromptsAdminApi;
