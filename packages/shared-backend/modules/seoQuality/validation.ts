import { z } from 'zod';

export const entityTypeSchema = z.enum(['custom_page', 'consultant', 'astro_landing']);

export const listSeoQualityQuerySchema = z.object({
  entity_type: entityTypeSchema.optional(),
  locale: z.string().trim().max(8).optional(),
  q: z.string().trim().max(160).optional(),
  min_score: z.coerce.number().int().min(0).max(100).optional(),
  max_score: z.coerce.number().int().min(0).max(100).optional(),
  adsense_ready: z.coerce.number().int().min(0).max(1).optional(),
  index_ready: z.coerce.number().int().min(0).max(1).optional(),
  duplicate_slug: z.coerce.number().int().min(0).max(1).optional(),
  sort: z.enum(['overall_score', 'word_count']).default('overall_score'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(200).default(50),
});

export const detailParamsSchema = z.object({
  type: entityTypeSchema,
  id: z.string().trim().min(1).max(191),
});

export const detailQuerySchema = z.object({
  locale: z.string().trim().max(8).default('tr'),
});

export const recalculateSeoSchema = z.object({
  type: entityTypeSchema.optional(),
  id: z.string().trim().min(1).max(191).optional(),
  locale: z.string().trim().max(8).optional(),
});

export const updateSeoIndexSchema = z.object({
  seo_index: z.union([z.literal(0), z.literal(1), z.boolean()]).transform((v) => (v === true ? 1 : v === false ? 0 : v)),
});

export const gscInspectSchema = z.object({
  urls: z.array(z.string().trim().url().max(512)).min(1).max(100).optional(),
  url: z.string().trim().url().max(512).optional(),
}).refine((v) => Boolean(v.url || v.urls?.length), {
  message: 'url_or_urls_required',
});

export type ListSeoQualityQuery = z.infer<typeof listSeoQualityQuerySchema>;
export type SeoEntityType = z.infer<typeof entityTypeSchema>;
