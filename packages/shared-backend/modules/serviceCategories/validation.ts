import { z } from 'zod';

const slug = z.string().trim().min(1).max(64).regex(/^[a-z0-9_-]+$/, 'slug_format');

const localeText = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).nullable().optional(),
});

// { tr: {name, description}, en: {...}, de: {...} } — en az bir dil (tercihen tr).
const i18n = z.record(z.string().trim().min(2).max(8), localeText);

export const createServiceCategorySchema = z.object({
  slug,
  // name/description geriye uyumlu (i18n yoksa tr kabul edilir); i18n varsa ondan türetilir.
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  icon: z.string().trim().max(64).nullable().optional(),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.coerce.number().int().min(0).max(1).default(1),
  i18n: i18n.optional(),
});

export const updateServiceCategorySchema = createServiceCategorySchema.partial();
