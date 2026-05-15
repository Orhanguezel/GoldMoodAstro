import { z } from 'zod';

export const geocodeQuerySchema = z.object({
  q: z.string().trim().min(2).max(120),
});

export const timezoneQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export type GeocodeQuery = z.infer<typeof geocodeQuerySchema>;
export type TimezoneQuery = z.infer<typeof timezoneQuerySchema>;
