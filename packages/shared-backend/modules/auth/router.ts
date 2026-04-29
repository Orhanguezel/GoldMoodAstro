import type { FastifyInstance } from 'fastify';
import { authSecurity, fromZodSchema } from '../_shared';
import {
  passwordResetConfirmBody,
  passwordResetRequestBody,
  socialLoginBody,
  signupBody,
  tokenBody,
  updateBody,
} from './validation';
import { signup, token, socialLogin, refresh, passwordResetRequest, passwordResetConfirm, me, status, update, logout } from './controller';
import { handleRequestDeletion, handleCancelDeletion } from './deletion.controller';

export async function registerAuth(app: FastifyInstance) {
  const B = '/auth';

  app.post(`${B}/signup`, {
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } } as any,
    schema: { tags: ['auth'], body: fromZodSchema(signupBody, 'SignupBody') } as any,
  }, signup);
  app.post(`${B}/register`, {
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } } as any,
    schema: { tags: ['auth'], body: fromZodSchema(signupBody, 'SignupBody') } as any,
  }, signup);
  app.post(`${B}/token`, {
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } } as any,
    schema: { tags: ['auth'], body: fromZodSchema(tokenBody, 'TokenBody') } as any,
  }, token);
  app.post(`${B}/login`, {
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } } as any,
    schema: { tags: ['auth'], body: fromZodSchema(tokenBody, 'TokenBody') } as any,
  }, token);
  app.post(`${B}/social-login`, {
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } } as any,
    schema: { tags: ['auth'], body: fromZodSchema(socialLoginBody, 'SocialLoginBody') } as any,
  }, socialLogin);
  app.post(`${B}/token/refresh`, {
    config: { rateLimit: { max: 60, timeWindow: '1 minute' } } as any,
    schema: { tags: ['auth'] } as any,
  }, refresh);
  app.post(`${B}/password-reset/request`, {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } } as any,
    schema: { tags: ['auth'], body: fromZodSchema(passwordResetRequestBody, 'PasswordResetRequestBody') } as any,
  }, passwordResetRequest);
  app.post(`${B}/password-reset/confirm`, {
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } } as any,
    schema: { tags: ['auth'], body: fromZodSchema(passwordResetConfirmBody, 'PasswordResetConfirmBody') } as any,
  }, passwordResetConfirm);

  app.get(`${B}/user`, {
    schema: { tags: ['auth'], security: authSecurity } as any,
  }, me);
  // Mobile compat alias
  app.get(`${B}/me`, {
    schema: { tags: ['auth'], security: authSecurity } as any,
  }, me);
  app.get(`${B}/status`, {
    schema: { tags: ['auth'] } as any,
  }, status);
  app.put(`${B}/user`, {
    schema: { tags: ['auth'], security: authSecurity, body: fromZodSchema(updateBody, 'AuthUpdateBody') } as any,
  }, update);
  app.post(`${B}/logout`, {
    schema: { tags: ['auth'], security: authSecurity } as any,
  }, logout);

  app.post(`${B}/account/delete`, {
    schema: { tags: ['auth'], security: authSecurity } as any,
  }, handleRequestDeletion);
  app.delete(`${B}/account/delete`, {
    schema: { tags: ['auth'], security: authSecurity } as any,
  }, handleCancelDeletion);

  app.get(`${B}/search`, {
    schema: {
      tags: ['auth'],
      security: authSecurity,
      querystring: {
        type: 'object',
        properties: { q: { type: 'string' } },
      },
    } as any,
  }, async (req, reply) => {
    const { q } = req.query as { q: string };
    if (!q || q.length < 3) return reply.send({ data: [] });
    
    const { db } = await import('../../db/client');
    const { users } = await import('./schema');
    const { like, or, and, ne } = await import('drizzle-orm');
    const meId = (req as any).user?.id || (req as any).user?.sub;

    const rows = await db.select({
      id: users.id,
      full_name: users.full_name,
      email: users.email,
    })
    .from(users)
    .where(
      and(
        ne(users.id, meId),
        or(
          like(users.full_name, `%${q}%`),
          like(users.email, `%${q}%`)
        )
      )
    )
    .limit(10);

    return reply.send({ data: rows });
  });
}
