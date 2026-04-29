import { z } from 'zod';

const tokenSchema = z.string().trim().min(20).max(4096);

export const registerFcmTokenBodySchema = z
  .object({
    token: tokenSchema.optional(),
    fcm_token: tokenSchema.optional(),
  })
  .transform((body, ctx) => {
    const token = body.token ?? body.fcm_token;
    if (!token) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['token'],
        message: 'token is required',
      });
      return z.NEVER;
    }

    return { token };
  });

export type RegisterFcmTokenBody = z.infer<typeof registerFcmTokenBodySchema>;
