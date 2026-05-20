// =============================================================
// FILE: backend/src/modules/commissionChange/admin.routes.ts
// Admin guard'lar zaten /admin prefix'inde uygulaniyor.
// =============================================================
import type { FastifyInstance } from 'fastify';
import { sendCommissionNoticeAdminHandler } from './controller';

export async function registerCommissionChangeAdmin(app: FastifyInstance) {
  // POST /api/admin/commission-change/send-notice
  app.post('/commission-change/send-notice', sendCommissionNoticeAdminHandler);
}
