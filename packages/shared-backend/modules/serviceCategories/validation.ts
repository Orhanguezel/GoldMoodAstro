import { z } from 'zod';

const slug = z.string().trim().min(1).max(64).regex(/^[a-z0-9_-]+$/, 'slug_format');

export const createServiceCategorySchema = z.object({
  slug,
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).nullable().optional(),
  icon: z.string().trim().max(64).nullable().optional(),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.coerce.number().int().min(0).max(1).default(1),
});

export const updateServiceCategorySchema = createServiceCategorySchema.partial();
