// =============================================================
// FILE: src/modules/announcements/validation.ts
// =============================================================
import { z } from "zod";

export const AnnouncementAudience = z.enum(["all", "users", "consultants"]);

const optionalDate = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return null;
  return value;
}, z.coerce.date().nullable());

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const publicListQuerySchema = z.object({
  audience: AnnouncementAudience.optional().default("all"),
  include_all: z.coerce.boolean().optional().default(true),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const adminListQuerySchema = z.object({
  audience: AnnouncementAudience.optional(),
  is_active: z.coerce.boolean().optional(),
  q: z.string().trim().min(1).max(255).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const createBaseSchema = z.object({
  title: z.string().trim().min(1).max(255),
  body: z.string().trim().min(1).max(5000),
  audience: AnnouncementAudience.default("all"),
  is_active: z.coerce.boolean().optional().default(true),
  starts_at: optionalDate.optional(),
  ends_at: optionalDate.optional(),
});

export const createSchema = createBaseSchema.refine(
  (value) => !value.starts_at || !value.ends_at || value.starts_at <= value.ends_at,
  { message: "starts_at ends_at tarihinden sonra olamaz.", path: ["ends_at"] },
);

export const updateSchema = createBaseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "Boş güncelleme gönderilemez." },
).refine(
  (value) => !value.starts_at || !value.ends_at || value.starts_at <= value.ends_at,
  { message: "starts_at ends_at tarihinden sonra olamaz.", path: ["ends_at"] },
);

export const setStatusSchema = z.object({
  is_active: z.coerce.boolean().optional(),
  is_published: z.coerce.boolean().optional(),
}).transform((value) => ({
  is_active: value.is_active ?? value.is_published ?? true,
}));

export type PublicListQuery = z.infer<typeof publicListQuerySchema>;
export type AdminListQuery = z.infer<typeof adminListQuerySchema>;
export type CreateBody = z.infer<typeof createSchema>;
export type UpdateBody = z.infer<typeof updateSchema>;
