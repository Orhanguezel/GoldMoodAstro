import { z } from 'zod';

export const createBirthChartSchema = z.object({
  name: z.string().trim().min(1).max(120),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tob: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  pob_lat: z.coerce.number().min(-90).max(90),
  pob_lng: z.coerce.number().min(-180).max(180),
  pob_label: z.string().trim().min(1).max(255),
  tz_offset: z.coerce.number().int().min(-840).max(840).default(0),
});

export const synastrySchema = z.object({
  chart_a_id: z.string().uuid(),
  chart_b_id: z.string().uuid(),
});

export type CreateBirthChartInput = z.infer<typeof createBirthChartSchema>;
export type SynastryInput = z.infer<typeof synastrySchema>;
