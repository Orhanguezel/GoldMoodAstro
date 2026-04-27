import { z } from 'zod';

// FAZ 8.5 — IANA timezone + nullable tob (doğum saati bilinmiyorsa)
// Backward-compat: tz_offset legacy alan korunur; tz_iana tercih edilir.

export const createBirthChartSchema = z.object({
  name: z.string().trim().min(1).max(120),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

  // Doğum saati — bilinmiyorsa undefined/'' veya tob_known=false ile gönder.
  tob: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().or(z.literal('')),
  tob_known: z.boolean().optional().default(true),

  pob_lat: z.coerce.number().min(-90).max(90),
  pob_lng: z.coerce.number().min(-180).max(180),
  pob_label: z.string().trim().min(1).max(255),

  // Tercih edilen: IANA timezone string. DST-safe.
  tz_iana: z.string().trim().min(1).max(64).optional(),
  // Legacy fallback: sabit offset (DST yok). tz_iana varsa görmezden gelinir.
  tz_offset: z.coerce.number().int().min(-840).max(840).optional().default(0),
}).refine(
  (d) => !d.tob_known || (typeof d.tob === 'string' && d.tob.length > 0),
  { message: 'tob_required_when_tob_known', path: ['tob'] },
);

export const synastrySchema = z.object({
  chart_a_id: z.string().uuid(),
  chart_b_id: z.string().uuid(),
});

export type CreateBirthChartInput = z.infer<typeof createBirthChartSchema>;
export type SynastryInput = z.infer<typeof synastrySchema>;
