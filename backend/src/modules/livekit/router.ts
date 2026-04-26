import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@goldmood/shared-backend/middleware/auth';
import {
  endLiveKitSessionHandler,
  issueLiveKitTokenHandler,
  liveKitWebhookHandler,
} from './controller';

export async function registerLiveKit(app: FastifyInstance) {
  const BASE = '/livekit';

  app.post(`${BASE}/token`, { preHandler: [requireAuth] }, issueLiveKitTokenHandler);
  app.post(`${BASE}/session/end`, { preHandler: [requireAuth] }, endLiveKitSessionHandler);
  app.post(`${BASE}/webhooks`, liveKitWebhookHandler);
}
