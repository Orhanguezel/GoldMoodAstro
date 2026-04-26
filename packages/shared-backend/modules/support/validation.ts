// =============================================================
// FILE: src/modules/support/validation.ts
// =============================================================

import { z } from "zod";

/* --------- ortak enum'lar --------- */
export const SupportTicketStatus = z.enum([
  "open",
  "in_progress",
  "waiting_response",
  "closed",
]);

export const SupportTicketPriority = z.enum([
  "low",
  "medium",
  "high",
  "urgent",
]);

/* --------- public şemalar --------- */
export const listTicketsQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  status: SupportTicketStatus.optional(),
  priority: SupportTicketPriority.optional(),
  q: z.string().trim().min(1).max(255).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(["created_at", "updated_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;

export const createTicketBodySchema = z.object({
  user_id: z.string().uuid(),
  subject: z.string().trim().min(1).max(255),
  message: z.string().trim().min(1).max(2000),
  priority: SupportTicketPriority.default("medium").optional(),
  // DB’de yok; gelirse yok sayacağız:
  category: z.string().trim().max(40).optional().nullable(),
});

export type CreateTicketBody = z.infer<typeof createTicketBodySchema>;

export const updateTicketBodySchema = z
  .object({
    subject: z.string().trim().min(1).max(255).optional(),
    message: z.string().trim().min(1).max(2000).optional(),
    status: SupportTicketStatus.optional(),
    priority: SupportTicketPriority.optional(),
    category: z.string().trim().max(40).optional().nullable(), // yok sayılacak
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "Boş patch gönderilemez.",
  });

export type UpdateTicketBody = z.infer<typeof updateTicketBodySchema>;

export const createReplyBodySchema = z.object({
  ticket_id: z.string().uuid(),
  user_id: z.string().uuid().optional().nullable(),
  message: z.string().trim().min(1).max(2000),
  is_admin: z.boolean().optional(), // non-admin için zorla false
});

export type CreateReplyBody = z.infer<typeof createReplyBodySchema>;

/* --------- admin şemaları --------- */

export const adminListQuerySchema = listTicketsQuerySchema;
export type AdminListTicketsQuery = z.infer<typeof adminListQuerySchema>;

export const adminUpdateTicketBodySchema = updateTicketBodySchema;
export type AdminUpdateTicketBody = z.infer<typeof adminUpdateTicketBodySchema>;

export const adminCreateReplyBodySchema = z.object({
  ticket_id: z.string().uuid(),
  user_id: z.string().uuid().optional().nullable(),
  message: z.string().trim().min(1).max(2000),
});
export type AdminCreateReplyBody = z.infer<typeof adminCreateReplyBodySchema>;

export const adminActionSchema = z.enum(["close", "reopen"]);
export type AdminAction = z.infer<typeof adminActionSchema>;
