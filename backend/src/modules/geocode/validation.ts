import { z } from 'zod';

export const geocodeQuerySchema = z.object({
  q: z.string().trim().min(2).max(120),
});

export type GeocodeQuery = z.infer<typeof geocodeQuerySchema>;
