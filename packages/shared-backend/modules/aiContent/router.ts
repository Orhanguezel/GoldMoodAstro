import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/roles';
import { aiContentAssist } from './controller';

export async function registerAiContentAdmin(app: FastifyInstance) {
  const guard = { preHandler: [requireAuth, requireAdmin] };
  app.post('/ai/content', guard, aiContentAssist);
}
