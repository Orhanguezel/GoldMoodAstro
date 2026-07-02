import { baseApi } from '@/integrations/baseApi';

export type AiAction = 'enhance' | 'improve' | 'meta' | 'summary';

export type AiContentRequest = {
  action: AiAction;
  locale: string;
  title?: string;
  category?: string;
  summary?: string;
  content?: string;
  tags?: string;
};

export type AiContentResult = {
  content?: string;
  meta_title?: string;
  meta_description?: string;
  summary?: string;
  tags?: string;
};

function unwrap(raw: unknown): AiContentResult {
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (o.data && typeof o.data === 'object') return o.data as AiContentResult;
    return o as AiContentResult;
  }
  return {};
}

export const aiContentAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    aiContentAssist: build.mutation<AiContentResult, AiContentRequest>({
      query: (body) => ({ url: '/admin/ai/content', method: 'POST', body }),
      transformResponse: (raw: unknown) => unwrap(raw),
    }),
  }),
});

export const { useAiContentAssistMutation } = aiContentAdminApi;
