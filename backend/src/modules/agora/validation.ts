import { z } from 'zod';

export const tokenBodySchema = z.object({
  booking_id: z.string().uuid(),
});

export const endSessionBodySchema = z.object({
  booking_id: z.string().uuid(),
});

export type TokenBody = z.infer<typeof tokenBodySchema>;
export type EndSessionBody = z.infer<typeof endSessionBodySchema>;
