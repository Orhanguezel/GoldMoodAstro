// =============================================================
// FILE: src/modules/chat/validation.ts
// =============================================================

import { z } from "zod";

export const ChatContextTypeEnum = z.enum(["job", "request"]);
export type ChatContextType = z.infer<typeof ChatContextTypeEnum>;

export const ChatRoleEnum = z.enum(["buyer", "vendor", "admin"]);
export type ChatRole = z.infer<typeof ChatRoleEnum>;

export const ThreadIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const CreateOrGetThreadBodySchema = z.object({
  context_type: ChatContextTypeEnum,
  context_id: z.string().uuid(),
});

export const ListThreadsQuerySchema = z.object({
  context_type: ChatContextTypeEnum.optional(),
  context_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const ListMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  // "before" pagination (created_at or message_id) MVP: created_at ISO
  before: z.string().datetime().optional(),
});

export const PostMessageBodySchema = z.object({
  text: z.string().trim().min(1).max(2000),
  client_id: z.string().trim().min(8).max(64).optional(),
});

export const WsQuerySchema = z.object({
  thread_id: z.string().uuid(),
});

// WS message protocol
export const WsClientMessageSchema = z.object({
  type: z.literal("message"),
  text: z.string().trim().min(1).max(2000),
  client_id: z.string().trim().min(8).max(64),
});

export type WsClientMessage = z.infer<typeof WsClientMessageSchema>;
