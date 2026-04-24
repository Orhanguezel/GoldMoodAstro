'use client';

import { useCallback } from 'react';
import {
  useCreateOrGetChatThreadMutation,
  useListChatMessagesQuery,
  usePostChatMessageMutation,
  useRequestAdminHandoffMutation,
} from '@/integrations/rtk/public/chat.endpoints';
import {
  useListChatThreadsAdminQuery,
  useListChatMessagesAdminQuery,
  useTakeOverChatThreadAdminMutation,
} from '@/integrations/rtk/hooks';
import type { ChatCreateThreadBody } from '@/integrations/shared';

// ─── createOrGetChatThread ───────────────────────────────────

type MutateOpts<T> = { onSuccess?: (data: T) => void; onError?: (err: unknown) => void };

export function useCreateOrGetChatThread() {
  const [trigger, result] = useCreateOrGetChatThreadMutation();
  const mutate = useCallback(
    (body: ChatCreateThreadBody, opts?: MutateOpts<any>) => {
      trigger(body)
        .unwrap()
        .then((data) => opts?.onSuccess?.(data))
        .catch((err) => opts?.onError?.(err));
    },
    [trigger],
  );
  return { mutate, isPending: result.isLoading };
}

// ─── useChatMessages ─────────────────────────────────────────

export function useChatMessages(
  threadId: string,
  params: { limit?: number },
  opts?: { enabled?: boolean; refetchInterval?: number },
) {
  return useListChatMessagesQuery(
    { threadId, limit: params.limit },
    {
      skip: opts?.enabled === false || !threadId,
      pollingInterval: opts?.refetchInterval,
    },
  );
}

// ─── usePostChatMessage ──────────────────────────────────────

export function usePostChatMessage(threadId: string) {
  const [trigger, result] = usePostChatMessageMutation();
  const mutate = useCallback(
    (body: { text: string; client_id?: string }, opts?: MutateOpts<any>) => {
      if (!threadId) return;
      trigger({ threadId, ...body })
        .unwrap()
        .then((data) => opts?.onSuccess?.(data))
        .catch((err) => opts?.onError?.(err));
    },
    [trigger, threadId],
  );
  return { mutate, isPending: result.isLoading };
}

// ─── useRequestAdminHandoff ──────────────────────────────────

export function useRequestAdminHandoff(threadId: string) {
  const [trigger, result] = useRequestAdminHandoffMutation();
  const mutate = useCallback(
    (_?: undefined, opts?: MutateOpts<any>) => {
      if (!threadId) return;
      trigger({ threadId })
        .unwrap()
        .then((data) => opts?.onSuccess?.(data))
        .catch((err) => opts?.onError?.(err));
    },
    [trigger, threadId],
  );
  return { mutate, isPending: result.isLoading };
}

// ─── Admin: useAdminChatThreads ──────────────────────────────

export function useAdminChatThreads(
  params: { handoff_mode?: 'ai' | 'admin'; limit?: number; offset?: number },
  opts?: { enabled?: boolean; refetchInterval?: number; retry?: boolean },
) {
  return useListChatThreadsAdminQuery(params, {
    skip: opts?.enabled === false,
    pollingInterval: opts?.refetchInterval,
  });
}

// ─── Admin: useAdminChatMessages ─────────────────────────────

export function useAdminChatMessages(
  threadId: string,
  params: { limit?: number },
  opts?: { enabled?: boolean; refetchInterval?: number; retry?: boolean },
) {
  return useListChatMessagesAdminQuery(
    { threadId, params: { limit: params.limit } },
    {
      skip: opts?.enabled === false || !threadId,
      pollingInterval: opts?.refetchInterval,
    },
  );
}

// ─── Admin: useAdminTakeOverThread ───────────────────────────

export function useAdminTakeOverThread(threadId: string) {
  const [trigger, result] = useTakeOverChatThreadAdminMutation();
  const mutate = useCallback(
    (_?: undefined, opts?: MutateOpts<any>) => {
      if (!threadId) return;
      trigger({ threadId })
        .unwrap()
        .then((data) => opts?.onSuccess?.(data))
        .catch((err) => opts?.onError?.(err));
    },
    [trigger, threadId],
  );
  return { mutate, isPending: result.isLoading };
}
