import { z } from 'zod';

const slug = z.string().trim().min(2).max(8).regex(/^[a-z]{2,8}$/i, 'slug_format');

export const createLanguageSchema = z.object({
  slug: slug.transform((value) => value.toLowerCase()),
  name_tr: z.string().trim().min(1).max(50),
  name_en: z.string().trim().min(1).max(50),
  name_de: z.string().trim().min(1).max(50).nullable().optional(),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.coerce.number().int().min(0).max(1).default(1),
});

export const updateLanguageSchema = createLanguageSchema.partial();
