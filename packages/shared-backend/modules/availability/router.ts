// =============================================================
// FILE: src/modules/availability/router.ts
// FINAL — Public availability routes
// =============================================================

import type { FastifyInstance } from 'fastify';
import {
  listAvailabilitySlotsPublic,
  getAvailabilityPublic,
  listWorkingHoursPublicHandler,
  getWeeklyPlanPublic,
} from './controller';

const BASE = '/availability';

export async function registerAvailability(app: FastifyInstance) {
  app.get(`${BASE}/slots`, listAvailabilitySlotsPublic);
  app.get(`${BASE}`, getAvailabilityPublic);

  // ✅ NEW: GET /availability/working-hours?resource_id=...
  app.get(`${BASE}/working-hours`, listWorkingHoursPublicHandler);

  app.get(`${BASE}/weekly-plan`, getWeeklyPlanPublic);
}
