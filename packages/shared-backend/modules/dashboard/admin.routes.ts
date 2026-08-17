// ===================================================================
// FILE: src/modules/dashboard/admin.routes.ts
// FINAL — Admin Dashboard Summary Routes
// - GET /api/admin/dashboard/summary
// ===================================================================

import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth';
import {
  getDashboardAnalyticsAdmin,
  getDashboardSummaryAdmin,
  getMarketingDashboardAdmin,
  getConsultantEarningsAdmin,
} from './admin.controller';

const BASE = '/dashboard';

export async function registerDashboardAdmin(app: FastifyInstance) {
  app.get(`${BASE}/summary`, { preHandler: [requireAuth] }, getDashboardSummaryAdmin);
  app.get(`${BASE}/analytics`, { preHandler: [requireAuth] }, getDashboardAnalyticsAdmin);
  app.get(`${BASE}/marketing`, { preHandler: [requireAuth] }, getMarketingDashboardAdmin);
  app.get(`${BASE}/consultant-earnings`, { preHandler: [requireAuth] }, getConsultantEarningsAdmin);
}
