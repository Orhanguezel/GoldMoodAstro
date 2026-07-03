import { z } from 'zod';

export const mediaKindSchema = z.enum(['audio', 'video']);

export const updateMediaSettingsSchema = z.object({
  audio_enabled: z.coerce.boolean().default(false),
  audio_price: z.coerce.number().min(0).max(100000).default(0),
  video_enabled: z.coerce.boolean().default(false),
  video_price: z.coerce.number().min(0).max(100000).default(0),
  reply_sla_hours: z.coerce.number().int().min(1).max(336).default(72),
}).superRefine((data, ctx) => {
  if (data.audio_enabled && data.audio_price <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['audio_price'], message: 'audio_price_required' });
  }
  if (data.video_enabled && data.video_price <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['video_price'], message: 'video_price_required' });
  }
});

export const createMediaMessageSchema = z.object({
  consultant_id: z.string().trim().min(1).max(36),
  kind: mediaKindSchema,
  storage_path: z.string().trim().min(1).max(500),
  duration_seconds: z.coerce.number().int().min(1).max(1800).optional(),
  note: z.string().trim().max(1000).optional().nullable(),
});

export const replyMediaMessageSchema = z.object({
  kind: mediaKindSchema,
  storage_path: z.string().trim().min(1).max(500),
  duration_seconds: z.coerce.number().int().min(1).max(1800).optional(),
  note: z.string().trim().max(1000).optional().nullable(),
});

