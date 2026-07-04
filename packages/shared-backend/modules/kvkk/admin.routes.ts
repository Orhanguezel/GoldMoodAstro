import type { FastifyInstance } from 'fastify';
import { listAccountDeletionRequestsAdmin } from './admin.controller';

export async function registerKvkkAdmin(app: FastifyInstance) {
  app.get('/account-deletion-requests', listAccountDeletionRequestsAdmin);
}
