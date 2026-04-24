// ===================================================================
// FILE: src/modules/reports/admin.routes.ts
// ===================================================================

import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@vps/shared-backend/middleware/auth';
import {
  getKpiReportAdmin,
  getUsersPerformanceReportAdmin,
  getLocationsReportAdmin,
} from './admin.controller';

const BASE = '/reports';

export async function registerReportsAdmin(app: FastifyInstance) {
  app.get(`${BASE}/kpi`, { preHandler: [requireAuth] }, getKpiReportAdmin);
  app.get(
    `${BASE}/users-performance`,
    { preHandler: [requireAuth] },
    getUsersPerformanceReportAdmin,
  );
  app.get(`${BASE}/locations`, { preHandler: [requireAuth] }, getLocationsReportAdmin);
}
