import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@goldmood/shared-backend/middleware/auth';
import { registerFcmTokenHandler } from './controller';

export async function registerFirebasePush(app: FastifyInstance) {
  const BASE = '/push';

  app.post(`${BASE}/register-token`, { preHandler: [requireAuth] }, registerFcmTokenHandler);
}
