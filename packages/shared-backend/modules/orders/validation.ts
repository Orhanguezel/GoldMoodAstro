// src/modules/orders/validation.ts
import { z } from "zod";

const idLike = z.string().length(36);

export const addressCreateSchema = z.object({
  title: z.string().min(1).max(255),
  full_name: z.string().min(1).max(255),
  phone: z.string().min(1).max(50),
  email: z.string().email().optional().nullish(),
  address_line: z.string().min(1),
  city: z.string().min(1).max(128),
  district: z.string().min(1).max(128),
  postal_code: z.string().max(32).optional().nullish(),
  is_default: z.coerce.number().int().min(0).max(1).optional(),
});

export const orderCreateSchema = z.object({
  booking_id: idLike,
  billing_address_id: idLike.optional(),
  payment_gateway_slug: z.string().min(1),
  notes: z.string().optional().nullish(),
});

export const paymentSessionSchema = z.object({
  order_id: idLike,
});
