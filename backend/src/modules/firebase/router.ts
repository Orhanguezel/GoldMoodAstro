import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@goldmood/shared-backend/middleware/auth';
import { registerFcmTokenHandler, unregisterFcmTokenHandler } from './controller';

export async function registerFirebasePush(app: FastifyInstance) {
  const BASE = '/push';
  const tokenRateLimit = { max: 20, timeWindow: '1 minute' };

  app.post(`${BASE}/register-token`, {
    preHandler: [requireAuth],
    config: { rateLimit: tokenRateLimit },
  }, registerFcmTokenHandler);
  app.post(`${BASE}/unregister-token`, {
    preHandler: [requireAuth],
    config: { rateLimit: tokenRateLimit },
  }, unregisterFcmTokenHandler);
}
