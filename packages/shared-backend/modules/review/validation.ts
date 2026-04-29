// =============================================================
// FILE: src/modules/review/validation.ts
// =============================================================
import { z } from "zod";
import { LOCALES } from '../../core/i18n';

/** :id param */
export const IdParamSchema = z.object({
  id: z.string().min(1, "id gereklidir"),
});

/** Query boolean'ı güvenle çöz: "0"/"1"/"false"/"true"/0/1/boolean */
const boolQuery = z.preprocess((v) => {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "1" || s === "true") return true;
    if (s === "0" || s === "false") return false;
  }
  return undefined;
}, z.boolean().optional());

const LOCALE_ENUM = z.enum(LOCALES as unknown as [string, ...string[]]);

// -------------------------------------------------------------
// LIST QUERY
// -------------------------------------------------------------
export const ReviewListParamsSchema = z
  .object({
    search: z.string().trim().optional(),
    approved: boolQuery,
    active: boolQuery,
    verified: boolQuery,        // T17-7 — is_verified=1 (doğrulanmış görüşme)
    auto_flagged: boolQuery,    // T17-7 — moderation_flags NOT NULL AND is_approved=0
    has_outcome: boolQuery,     // T17-7 — review_outcomes.user_response IS NOT NULL
    minRating: z.coerce.number().int().min(1).max(5).optional(),
    maxRating: z.coerce.number().int().min(1).max(5).optional(),
    limit: z.coerce.number().int().min(1).max(500).default(100),
    offset: z.coerce.number().int().min(0).default(0),
    orderBy: z
      .enum(["created_at", "updated_at", "display_order", "rating", "name", "helpful_count"])
      .default("display_order"),
    order: z.enum(["asc", "desc"]).default("asc"),

    // Listelemede isteğe bağlı locale override
    locale: LOCALE_ENUM.optional(),

    // Hedef filtreleri (product, news, custom_page vs.)
    target_type: z.string().trim().optional(),
    target_id: z.string().trim().optional(),
  })
  .refine(
    (o) =>
      o.minRating === undefined ||
      o.maxRating === undefined ||
      o.minRating <= o.maxRating,
    { message: "minRating maxRating'den büyük olamaz", path: ["minRating"] },
  );

// -------------------------------------------------------------
// CREATE PAYLOAD
// -------------------------------------------------------------
export const ReviewCreateSchema = z.object({
  // Hangi modul / kayıt için?
  target_type: z
    .string()
    .trim()
    .min(1, "target_type gereklidir")
    .max(50, "target_type en fazla 50 karakter olabilir")
    .default("consultant"),
  target_id: z
    .string()
    .trim()
    .min(1, "target_id gereklidir")
    .max(36, "target_id en fazla 36 karakter olabilir"),

  // Yorumun gönderildiği dil (opsiyonel, yoksa server req.locale kullanır)
  locale: LOCALE_ENUM.optional(),

  name: z.string().trim().min(2).max(255).optional(),
  email: z.string().trim().email().max(255).optional(),
  rating: z.number().int().min(1).max(5),

  // Yorum metni i18n tabloda; API aynı kalıyor
  comment: z.string().trim().min(5),
  title: z.string().trim().max(255).optional(),

  // Testimonials extras (optional)
  role: z.string().trim().max(255).optional(),
  company: z.string().trim().max(255).optional(),
  avatar_url: z.string().trim().max(500).optional(),
  logo_url: z.string().trim().max(500).optional(),
  profile_href: z.string().trim().max(500).optional(),

  is_active: z.boolean().optional(),
  is_approved: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),

  // T17-1 — Doğrulanmış görüşme rozeti için: booking_id verilirse repository
  // booking.user_id + booking.status='completed' kontrolü yapar, is_verified=1.
  // Auth'lu request'te user_id req.user'dan alınır.
  booking_id: z.string().trim().min(1).max(36).optional(),
  user_id: z.string().trim().min(1).max(36).optional(),
});

// T17-2 — Astrolog kendi review'ına cevap (consultant_reply)
export const ConsultantReplySchema = z.object({
  consultant_reply: z.string().trim().min(1).max(5000),
  locale: LOCALE_ENUM.optional(),
});

// -------------------------------------------------------------
// UPDATE PAYLOAD (partial)
// -------------------------------------------------------------
export const ReviewUpdateSchema = ReviewCreateSchema.partial().extend({
  // Admin reply (i18n). Only for update; not allowed on public create.
  admin_reply: z.string().trim().max(5000).nullable().optional(),
});

// -------------------------------------------------------------
// REACTION PAYLOAD
// -------------------------------------------------------------
export const ReviewReactionSchema = z.object({
  type: z.enum(["like", "dislike"]).optional(),
});

// -------------------------------------------------------------
// BULK MODERATION (T17-7)
// -------------------------------------------------------------
export const ReviewBulkModerationSchema = z.object({
  ids: z.array(z.string().trim().min(1).max(36)).min(1).max(200),
  approved: z.boolean(),
});

// -------------------------------------------------------------
// TIPLER
// -------------------------------------------------------------
export type ReviewListParams = z.infer<typeof ReviewListParamsSchema>;
export type ReviewCreateInput = z.infer<typeof ReviewCreateSchema>;
export type ReviewUpdateInput = z.infer<typeof ReviewUpdateSchema>;
export type ReviewReactionInput = z.infer<typeof ReviewReactionSchema>;
export type ConsultantReplyInput = z.infer<typeof ConsultantReplySchema>;
export type ReviewBulkModerationInput = z.infer<typeof ReviewBulkModerationSchema>;
export type IdParam = z.infer<typeof IdParamSchema>;
