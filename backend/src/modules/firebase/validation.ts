import { z } from 'zod';

export const registerFcmTokenBodySchema = z.object({
  token: z.string().trim().min(20).max(4096),
});

export type RegisterFcmTokenBody = z.infer<typeof registerFcmTokenBodySchema>;
