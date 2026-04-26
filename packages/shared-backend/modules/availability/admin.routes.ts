// =============================================================
// FILE: src/modules/availability/admin.routes.ts
// FINAL — Admin availability routes
// NOTE: register with prefix '/admin'
// =============================================================

import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth';

import {
  listWorkingHoursAdmin,
  upsertWorkingHourAdmin,
  deleteWorkingHourAdmin,
  listSlotsAdmin,
  getSlotAvailabilityAdmin,
  getDailyPlanAdmin,
  generateSlotsForDateAdmin,
  overrideDayAdmin,
  overrideSlotAdmin,
} from './admin.controller';

export async function registerAvailabilityAdmin(app: FastifyInstance) {
  const resourceWH = '/resource-working-hours';
  const resourceSlots = '/resource-slots';

  // working hours
  app.get(resourceWH, { preHandler: [requireAuth] }, listWorkingHoursAdmin);
  app.post(resourceWH, { preHandler: [requireAuth] }, upsertWorkingHourAdmin);
  app.delete(`${resourceWH}/:id`, { preHandler: [requireAuth] }, deleteWorkingHourAdmin);

  // slots
  app.get(resourceSlots, { preHandler: [requireAuth] }, listSlotsAdmin);
  app.get(`${resourceSlots}/availability`, { preHandler: [requireAuth] }, getSlotAvailabilityAdmin);

  // deterministic plan
  app.get(`${resourceSlots}/plan`, { preHandler: [requireAuth] }, getDailyPlanAdmin);
  app.post(`${resourceSlots}/generate`, { preHandler: [requireAuth] }, generateSlotsForDateAdmin);

  // overrides
  app.post(`${resourceSlots}/override-day`, { preHandler: [requireAuth] }, overrideDayAdmin);
  app.post(`${resourceSlots}/override`, { preHandler: [requireAuth] }, overrideSlotAdmin);
}
