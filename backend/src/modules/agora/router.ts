import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@goldmood/shared-backend/middleware/auth';
import { endAgoraSessionHandler, issueAgoraTokenHandler } from './controller';

export async function registerAgora(app: FastifyInstance) {
  const BASE = '/agora';

  app.post(`${BASE}/token`, { preHandler: [requireAuth] }, issueAgoraTokenHandler);
  app.post(`${BASE}/session/end`, { preHandler: [requireAuth] }, endAgoraSessionHandler);
}
