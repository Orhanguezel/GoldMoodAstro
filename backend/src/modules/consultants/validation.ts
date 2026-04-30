import { z } from 'zod';

const csvOrStringArray = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  });

export const listConsultantsQuerySchema = z.object({
  expertise: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  // Anasayfa "Öne Çıkan / Popüler / Yeni / Çevrimiçi" section'ları için.
  // featured = rating+sessions, popular = sessions, new = created_at, online = is_available + rating.
  sort: z.enum(['featured', 'popular', 'new', 'online']).optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  onlineOnly: z.coerce.boolean().optional(),
  light: z.coerce.boolean().optional(),
});

export const adminListConsultantsQuerySchema = z.object({
  approval_status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

// :id parametresi UUID ya da slug olabilir (slug: a-z0-9-, max 100 karakter).
export const consultantIdParamsSchema = z.object({
  id: z.string().min(1).max(100).regex(/^[A-Za-z0-9-]+$/, 'invalid_id_or_slug'),
});

export const consultantSlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const rejectConsultantBodySchema = z.object({
  rejection_reason: z.string().trim().min(2).max(2000),
});

export const registerConsultantBodySchema = z.object({
  bio: z.string().trim().max(5000).optional(),
  expertise: csvOrStringArray.default(['astrology']),
  languages: csvOrStringArray.default(['tr']),
  session_price: z.coerce.number().positive(),
  session_duration: z.coerce.number().int().positive().max(240).default(30),
  currency: z.string().trim().length(3).default('TRY'),
});

export type ListConsultantsQuery = z.infer<typeof listConsultantsQuerySchema>;
export type AdminListConsultantsQuery = z.infer<typeof adminListConsultantsQuerySchema>;
export type RegisterConsultantBody = z.infer<typeof registerConsultantBodySchema>;
