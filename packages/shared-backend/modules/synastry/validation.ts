// FAZ 25 / T25-1
import { z } from 'zod';

export const partnerDataSchema = z.object({
  name: z.string().trim().min(2).max(120),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD bekleniyor'),
  tob: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  pob_lat: z.coerce.number().min(-90).max(90),
  pob_lng: z.coerce.number().min(-180).max(180),
  pob_label: z.string().max(255).optional(),
  tz_iana: z.string().max(60).optional(),
});

export const synastryManualSchema = z.object({
  partner_data: partnerDataSchema,
  /** Hangi user chart kullanılsın (yoksa kullanıcının ilk chart'ı) */
  chart_id: z.string().max(36).optional(),
  locale: z.string().min(2).max(8).default('tr'),
});

const SIGN_KEYS = [
  'aries','taurus','gemini','cancer','leo','virgo',
  'libra','scorpio','sagittarius','capricorn','aquarius','pisces',
] as const;

export const synastryQuickSchema = z.object({
  sign_a: z.enum(SIGN_KEYS),
  sign_b: z.enum(SIGN_KEYS),
  locale: z.string().min(2).max(8).default('tr'),
});

export const synastryInviteSchema = z.object({
  partner_user_id: z.string().uuid(),
  chart_id: z.string().uuid().optional(),
});

export type PartnerData = z.infer<typeof partnerDataSchema>;
export type SynastryManualInput = z.infer<typeof synastryManualSchema>;
export type SynastryQuickInput = z.infer<typeof synastryQuickSchema>;
export type SynastryInviteInput = z.infer<typeof synastryInviteSchema>;
