import { z } from 'zod';

export const signupBody = z.object({
  email: z.string().email(),
  password: z.string().min(6),

  // Top-level opsiyonel alanlar:
  full_name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(6).max(50).optional(),
  rules_accepted: z.literal(true, { errorMap: () => ({ message: 'rules_accepted_required' }) }),

  // Supabase benzeri payload uyumu:
  options: z
    .object({
      emailRedirectTo: z.string().url().optional(),
      data: z
        .object({
          full_name: z.string().trim().min(2).max(100).optional(),
          phone: z.string().trim().min(6).max(50).optional(),
          role: z.enum(['user', 'consultant']).optional(),
        })
        .partial()
        .optional(),
    })
    .optional(),
});

export const tokenBody = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  grant_type: z.literal("password").optional(),
});

export const updateBody = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

export const googleBody = z.object({
  id_token: z.string().min(10),
});

export const socialLoginBody = z.object({
  type: z.enum(['google', 'facebook', 'apple']),
  access_token: z.string().min(10).optional(),
  id_token: z.string().min(10).optional(),
  /** Apple identity_token (JWT) — Apple Sign In response.authorization.id_token */
  identity_token: z.string().min(10).optional(),
  /** Apple authorization_code (server-to-server için opsiyonel; şu an kullanmıyoruz) */
  authorization_code: z.string().min(10).optional(),
  /** Apple sadece İLK login'de ad/soyadı döner — frontend `response.user.name`'i geçer */
  apple_user_name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().optional(),
}).superRefine((value, ctx) => {
  if (value.type === 'google' && !value.access_token && !value.id_token) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['access_token'],
      message: 'access_token_or_id_token_required',
    });
  }
  if (value.type === 'facebook' && !value.access_token) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['access_token'],
      message: 'facebook_access_token_required',
    });
  }
  if (value.type === 'apple' && !value.identity_token) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['identity_token'],
      message: 'apple_identity_token_required',
    });
  }
});

export const passwordResetRequestBody = z.object({
  email: z.string().trim().email(),
});

export const passwordResetConfirmBody = z.object({
  token: z.string().min(10),
  password: z.string().min(6),
});
