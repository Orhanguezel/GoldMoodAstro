// src/modules/gutschein/validation.ts
import { z } from 'zod';

// ── Products ─────────────────────────────────────────────────────────────────
export const productCreateSchema = z.object({
  name:          z.string().min(1).max(255),
  value:         z.coerce.number().positive().multipleOf(0.01),
  currency:      z.string().min(1).max(10).default('EUR'),
  validity_days: z.coerce.number().int().positive().default(365),
  description:   z.string().max(2000).optional().nullish(),
  is_active:     z.coerce.number().int().min(0).max(1).default(1),
  display_order: z.coerce.number().int().min(0).default(0),
});

export const productUpdateSchema = productCreateSchema.partial();

// ── Public ───────────────────────────────────────────────────────────────────
export const checkCodeSchema = z.object({
  code: z.string().min(1).max(30).transform((v) => v.trim().toUpperCase()),
});

export const purchaseSchema = z.object({
  product_id:       z.string().length(36).optional().nullish(),
  custom_value:     z.coerce.number().positive().min(5).max(5000).multipleOf(0.01).optional().nullish(),
  custom_currency:  z.string().min(1).max(10).optional().nullish(),
  purchaser_name:   z.string().min(1).max(255),
  purchaser_email:  z.string().email().max(255),
  recipient_name:   z.string().min(1).max(255).optional().nullish(),
  recipient_email:  z.string().email().max(255).optional().nullish(),
  personal_message: z.string().max(1000).optional().nullish(),
}).refine(
  (d) => d.product_id || d.custom_value,
  { message: 'product_id or custom_value required', path: ['product_id'] },
);

export const redeemSchema = z.object({
  code:       z.string().min(1).max(30).transform((v) => v.trim().toUpperCase()),
  booking_id: z.string().length(36).optional(),
});

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminCreateSchema = z.object({
  product_id:       z.string().length(36).optional().nullish(),
  value:            z.coerce.number().positive().multipleOf(0.01),
  currency:         z.string().min(1).max(10).default('EUR'),
  validity_days:    z.coerce.number().int().positive().default(365),
  purchaser_name:   z.string().min(1).max(255),
  purchaser_email:  z.string().email().max(255),
  recipient_name:   z.string().max(255).optional().nullish(),
  recipient_email:  z.string().email().max(255).optional().nullish(),
  personal_message: z.string().max(1000).optional().nullish(),
  status:           z.enum(['pending', 'active', 'redeemed', 'expired', 'cancelled']).default('active'),
  admin_note:       z.string().max(2000).optional().nullish(),
});

export const adminUpdateSchema = z.object({
  status:          z.enum(['pending', 'active', 'redeemed', 'expired', 'cancelled']).optional(),
  admin_note:      z.string().max(2000).optional().nullish(),
  recipient_email: z.string().email().max(255).optional().nullish(),
  recipient_name:  z.string().max(255).optional().nullish(),
  expires_at:      z.string().optional().nullish(),
});
