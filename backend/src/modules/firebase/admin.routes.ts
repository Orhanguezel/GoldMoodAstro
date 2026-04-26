import type { FastifyInstance } from 'fastify';
import { sendManualPushHandler } from './admin.controller';

export async function registerFirebaseAdmin(app: FastifyInstance) {
  app.post('/push/send', { config: { auth: true } }, sendManualPushHandler);
}
