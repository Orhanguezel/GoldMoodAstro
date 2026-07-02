import { z } from 'zod';
import { appConfig } from '@goldmood/shared-config/appConfig';

export function validatePaidServicePrice(data: { is_free?: number; price?: number }, ctx: z.RefinementCtx) {
  if (data.is_free === 1) return;
  if ((data.price ?? 0) <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['price'],
      message: 'paid_service_price_must_be_positive',
    });
  }
}

const localeText = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
});

const i18n = z.record(z.string().trim().min(2).max(8), localeText);

const payloadSchema = z.object({
  category_slug: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(160).optional(),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/, 'slug_format'),
  description: z.string().trim().max(2000).nullable().optional(),
  duration_minutes: z.coerce.number().int().positive().max(appConfig.consultants.maxSessionDurationMinutes).default(45),
  price: z.coerce.number().nonnegative().max(appConfig.consultants.maxSessionPrice).default(0),
  currency: z.string().trim().length(3).default(appConfig.consultants.defaultCurrency),
  media_type: z.enum(['audio', 'video']).default('audio'),
  is_free: z.coerce.number().int().min(0).max(1).default(0),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.coerce.number().int().min(0).max(1).default(1),
  i18n: i18n.optional(),
});

export const createServiceTemplateSchema = payloadSchema.superRefine(validatePaidServicePrice);
export const updateServiceTemplateSchema = payloadSchema.partial().superRefine((data, ctx) => {
  if (data.is_free !== undefined || data.price !== undefined) {
    validatePaidServicePrice(data, ctx);
  }
});
