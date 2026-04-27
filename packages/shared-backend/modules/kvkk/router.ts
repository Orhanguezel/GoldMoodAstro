// src/modules/kvkk/router.ts
import type { FastifyInstance } from 'fastify';
import * as controller from './controller';
import { requireAuth } from '../../middleware/auth';

export async function registerKvkk(app: FastifyInstance) {
  // GET /me/export — kullanıcının tüm verisini JSON olarak indir
  app.get('/me/export', { preHandler: [requireAuth] }, controller.exportMyData);

  // GET /me/delete-account — pending talebi gör
  app.get('/me/delete-account', { preHandler: [requireAuth] }, controller.getDeletionStatus);

  // POST /me/delete-account — talep yarat (7 gün cooling-off)
  app.post('/me/delete-account', { preHandler: [requireAuth] }, controller.requestAccountDeletion);

  // DELETE /me/delete-account — pending talebi iptal
  app.delete('/me/delete-account', { preHandler: [requireAuth] }, controller.cancelAccountDeletion);
}
