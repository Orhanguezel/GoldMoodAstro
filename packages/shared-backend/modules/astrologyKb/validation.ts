// =============================================================
// FILE: modules/astrologyKb/validation.ts
// FAZ 19 / T19-3 — Admin astrology_kb CRUD validation
// =============================================================
import { z } from "zod";

export const IdParamSchema = z.object({
  id: z.string().trim().min(1).max(36),
});

const KIND_ENUM = z.enum([
  "planet_sign", "planet_house", "sign_house",
  "aspect", "sign", "house", "planet",
  "transit", "synastry", "misc",
]);

const TONE_ENUM = z.enum(["neutral", "warm", "professional", "poetic", "direct"]);
const REVIEW_STATUS_ENUM = z.enum(["pending", "approved", "rejected"]);

export const KbListParamsSchema = z.object({
  search: z.string().trim().optional(),
  kind: KIND_ENUM.optional(),
  key1: z.string().trim().max(40).optional(),
  key2: z.string().trim().max(40).optional(),
  key3: z.string().trim().max(40).optional(),
  locale: z.string().trim().min(2).max(8).optional(),
  review_status: REVIEW_STATUS_ENUM.optional(),
  is_active: z.preprocess((v) => {
    if (v === undefined || v === null || v === "") return undefined;
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (s === "1" || s === "true") return true;
      if (s === "0" || s === "false") return false;
    }
    return undefined;
  }, z.boolean().optional()),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  orderBy: z.enum(["created_at", "updated_at", "kind", "key1"]).default("kind"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const KbCreateSchema = z.object({
  kind: KIND_ENUM,
  key1: z.string().trim().min(1).max(40),
  key2: z.string().trim().max(40).optional().nullable(),
  key3: z.string().trim().max(40).optional().nullable(),
  locale: z.string().trim().min(2).max(8).default("tr"),
  title: z.string().trim().min(1).max(255),
  content: z.string().min(1),
  short_summary: z.string().max(500).optional().nullable(),
  tone: TONE_ENUM.default("warm"),
  source: z.string().trim().max(255).optional().nullable(),
  author: z.string().trim().max(120).optional().nullable(),
  is_active: z.boolean().default(true),
});

export const KbUpdateSchema = KbCreateSchema.partial();

// Bulk import — admin'den CSV/JSON upload (her satır KbCreateInput ile aynı)
export const KbBulkImportSchema = z.object({
  items: z.array(KbCreateSchema).min(1).max(500),
  upsert: z.boolean().default(true),
});

export const KbTranslationDraftSchema = z.object({
  source_locale: z.string().trim().min(2).max(8).default("en"),
  target_locale: z.string().trim().min(2).max(8).default("tr"),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

export type KbListParams = z.infer<typeof KbListParamsSchema>;
export type KbCreateInput = z.infer<typeof KbCreateSchema>;
export type KbUpdateInput = z.infer<typeof KbUpdateSchema>;
export type KbBulkImportInput = z.infer<typeof KbBulkImportSchema>;
export type KbTranslationDraftInput = z.infer<typeof KbTranslationDraftSchema>;
export type IdParam = z.infer<typeof IdParamSchema>;
