// src/modules/navigation/validation.ts
import { z } from "zod";

const boolish = z
  .union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("1"), z.literal("0"), z.literal(1), z.literal(0)])
  .transform((v) => v === true || v === "true" || v === 1 || v === "1");

export const LocationEnum = z.enum(["header", "footer"]);
export const TypeEnum = z.enum(["page", "custom"]);

// ----- MENU ITEMS -------------------------------------------------------

export const PublicMenuListQuerySchema = z.object({
  location: LocationEnum.optional(),
  parent_id: z.string().nullable().optional(),
  section_id: z.string().nullable().optional(),
  is_active: boolish.optional(),
  locale: z.string().min(2).max(8).optional(),
  nested: boolish.optional(),
  order: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  select: z.string().optional(),
});

export const AdminMenuListQuerySchema = z.object({
  q: z.string().optional(),
  location: LocationEnum.optional(),
  section_id: z.string().nullable().optional(),
  parent_id: z.string().nullable().optional(),
  is_active: boolish.optional(),
  sort: z.enum(["display_order", "created_at", "title"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  locale: z.string().min(2).max(8).optional(),
  nested: boolish.optional(),
});

export const MenuItemCreateSchema = z.object({
  title: z.string().min(1).max(255),
  url: z.string().nullable().optional(),
  type: TypeEnum.default("custom"),
  page_id: z.string().nullable().optional(),
  parent_id: z.string().nullable().optional(),
  location: LocationEnum,
  icon: z.string().nullable().optional(),
  section_id: z.string().nullable().optional(),
  is_active: boolish.optional(),
  display_order: z.coerce.number().int().optional(),
  locale: z.string().min(2).max(8).default("tr"),
});

export const MenuItemUpdateSchema = MenuItemCreateSchema.partial();

export const MenuItemReorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      display_order: z.coerce.number().int(),
    }),
  ),
});

// ----- FOOTER SECTIONS --------------------------------------------------

export const FooterListQuerySchema = z.object({
  q: z.string().optional(),
  slug: z.string().optional(),
  is_active: boolish.optional(),
  locale: z.string().min(2).max(8).optional(),
  order: z.string().optional(), // "display_order.asc"
  sort: z.enum(["display_order", "created_at", "updated_at"]).optional(),
  orderDir: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const FooterCreateSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  description: z.string().nullable().optional(),
  locale: z.string().min(2).max(8).default("tr"),
  is_active: boolish.optional(),
  display_order: z.coerce.number().int().optional(),
});

export const FooterUpdateSchema = FooterCreateSchema.partial();

export const IdParamSchema = z.object({ id: z.string().min(1) });
export const SlugParamSchema = z.object({ slug: z.string().min(1) });
