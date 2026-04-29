// packages/shared-backend/modules/history/router.ts
// FAZ 28 / T28-1
// Routes are mounted under /me prefix in backend/src/routes/goldmood.ts,
// so final paths become /api/me/history, /api/me/readings/recent, etc.
import type { FastifyInstance } from 'fastify';
import * as controller from './controller';
import { requireAuth } from '../../middleware/auth';

export function registerHistoryRoutes(fastify: FastifyInstance) {
  // Mevcut: tüm geçmiş (snippet ile)
  fastify.get('/history', { preHandler: requireAuth }, controller.handleGetHistory);
  // Geriye dönük alias
  fastify.get('/history/me', { preHandler: requireAuth }, controller.handleGetHistory);

  // Yeni: dashboard için son N (varsayılan 10)
  fastify.get('/readings/recent', { preHandler: requireAuth }, controller.handleGetRecent);

  // Tek kayıt sil
  fastify.delete(
    '/readings/:type/:id',
    { preHandler: requireAuth },
    controller.handleDeleteReading,
  );

  // Tümünü sil (KVKK)
  fastify.delete(
    '/readings/all',
    { preHandler: requireAuth },
    controller.handleDeleteAllReadings,
  );

  // T28-6 — Danışman: müşteri son okumaları (canlı görüşmede)
  fastify.get(
    '/customers/:userId/readings',
    { preHandler: requireAuth },
    controller.handleGetCustomerReadingsForConsultant,
  );
}
