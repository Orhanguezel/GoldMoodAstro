import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../../middleware/auth';
import { heartbeatHandler } from './controller';

export async function registerPresence(app: FastifyInstance) {
  app.post('/me/consultant/heartbeat', { preHandler: [requireAuth] }, heartbeatHandler);
}

