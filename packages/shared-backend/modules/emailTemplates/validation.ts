// =============================================================
// FILE: src/modules/email-templates/validation.ts
// =============================================================
import { z } from "zod";

const jsonArrayStr = z
  .string()
  .refine((s) => {
    try {
      const v = JSON.parse(s);
      return Array.isArray(v) && v.every((x) => typeof x === "string");
    } catch {
      return false;
    }
  }, "variables must be a JSON string of string[]");

const variablesUnion = z
  .union([z.array(z.string()), jsonArrayStr, z.null(), z.undefined()])
  .transform((v) => {
    if (v == null) return null;
    if (Array.isArray(v)) return JSON.stringify(v);
    return v; // string(JSON)
  });

/**
 * Create:
 * - parent: template_key, variables, is_active
 * - i18n: template_name, subject, content, locale
 */
export const emailTemplateCreateSchema = z.object({
  template_key: z.string().min(1).max(100),

  // i18n alanları (zorunlu)
  template_name: z.string().min(1).max(150),
  subject: z.string().min(1).max(255),
  content: z.string().min(1), // HTML

  // parent alanları
  variables: variablesUnion.optional().nullable(),
  is_active: z
    .union([z.boolean(), z.literal(0), z.literal(1), z.string()])
    .optional(),

  // i18n hedef locale (yoksa DEFAULT_LOCALE kullanılacak)
  locale: z.string().min(2).max(10).nullable().optional(),
});

export const emailTemplateUpdateSchema = z.object({
  // parent alanları
  template_key: z.string().min(1).max(100).optional(),
  variables: variablesUnion.optional().nullable(),
  is_active: z
    .union([z.boolean(), z.literal(0), z.literal(1), z.string()])
    .optional(),

  // i18n alanları (patch)
  template_name: z.string().min(1).max(150).optional(),
  subject: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),

  // i18n hangi locale için patch yapılacağı
  locale: z.string().min(2).max(10).nullable().optional(),
});

export const renderByIdSchema = z.object({
  id: z.string().uuid(),
  params: z.record(z.unknown()).default({}),
});

export const renderByKeySchema = z.object({
  key: z.string().min(1).max(100),
  locale: z.string().min(2).max(10).nullable().optional(),
  params: z.record(z.unknown()).default({}),
});

/** Query parse için Zod (router generic kullanmıyoruz) */
export const listQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  // public/admin list için istenen locale (i18n tablosu)
  locale: z
    .string()
    .transform((s) => (s === "null" || s === "" ? null : s))
    .optional(),
  is_active: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

export type EmailTemplateCreateInput = z.infer<typeof emailTemplateCreateSchema>;
export type EmailTemplateUpdateInput = z.infer<typeof emailTemplateUpdateSchema>;
