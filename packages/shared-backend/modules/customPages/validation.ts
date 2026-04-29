// src/modules/customPages/validation.ts
import { z } from "zod";

const boolish = z
  .union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("1"), z.literal("0"), z.literal(1), z.literal(0)])
  .transform((v) => v === true || v === "true" || v === 1 || v === "1");

export const ListQuerySchema = z.object({
  q: z.string().optional(),
  slug: z.string().optional(),
  module_key: z.string().optional(),
  is_published: boolish.optional(),
  featured: boolish.optional(),
  locale: z.string().min(2).max(8).optional(),
  default_locale: z.string().min(2).max(8).optional(),
  sort: z.enum(["created_at", "updated_at", "display_order", "order_num"]).optional(),
  order: z.string().optional(), // "display_order.asc"
  orderDir: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  select: z.string().optional(),
});

export const CreateSchema = z.object({
  // i18n
  locale: z.string().min(2).max(8).default("tr"),
  title: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/i, "slug must be url-safe"),
  content: z.string(),
  summary: z.string().nullable().optional(),
  featured_image_alt: z.string().nullable().optional(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  // parent
  module_key: z.string().max(64).optional(),
  is_published: boolish.optional(),
  featured: boolish.optional(),
  featured_image: z.string().nullable().optional(),
  featured_image_asset_id: z.string().nullable().optional(),
  display_order: z.coerce.number().int().optional(),
  order_num: z.coerce.number().int().optional(),
  image_url: z.string().nullable().optional(),
  storage_asset_id: z.string().nullable().optional(),
  images: z.array(z.string()).nullable().optional(),
  storage_image_ids: z.array(z.string()).nullable().optional(),
});

export const UpdateSchema = CreateSchema.partial();

export const ReorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      display_order: z.coerce.number().int(),
    }),
  ),
});

export const IdParamSchema = z.object({ id: z.string().min(1) });
export const SlugParamSchema = z.object({ slug: z.string().min(1) });
