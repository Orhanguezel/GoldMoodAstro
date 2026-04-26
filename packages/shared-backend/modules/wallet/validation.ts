// src/modules/wallet/validation.ts
import { z } from "zod";

export const depositSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
  transaction_ref: z.string().optional(),
});

export const adminAdjustSchema = z.object({
  user_id: z.string().uuid(),
  type: z.enum(["credit", "debit"]),
  amount: z.number().positive(),
  purpose: z.string().min(1),
  description: z.string().optional(),
  payment_status: z.enum(["pending", "completed", "failed", "refunded"]).default("completed"),
});

export const adminStatusSchema = z.object({
  status: z.enum(["active", "suspended", "closed"]),
});

export const adminTransactionStatusSchema = z.object({
  payment_status: z.enum(["pending", "completed", "failed", "refunded"]),
});
