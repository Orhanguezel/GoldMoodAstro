// =============================================================
// FILE: src/modules/bookings/admin.routes.ts
// FINAL — Admin booking routes
// NOTE: register with prefix '/admin'
// =============================================================

import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth';

import {
  listBookingsAdminHandler,
  getBookingAdminHandler,
  createBookingAdminHandler,
  updateBookingAdminHandler,
  deleteBookingAdminHandler,
  markBookingReadAdminHandler,
  sendBookingReminderAdminHandler,
  acceptBookingAdminHandler,
  rejectBookingAdminHandler,
} from './admin.controller';

export async function registerBookingsAdmin(app: FastifyInstance) {
  const BASE = '/bookings';

  app.get(BASE, { preHandler: [requireAuth] }, listBookingsAdminHandler);
  app.get(`${BASE}/:id`, { preHandler: [requireAuth] }, getBookingAdminHandler);

  app.post(BASE, { preHandler: [requireAuth] }, createBookingAdminHandler);
  app.patch(`${BASE}/:id`, { preHandler: [requireAuth] }, updateBookingAdminHandler);

  app.post(`${BASE}/:id/read`, { preHandler: [requireAuth] }, markBookingReadAdminHandler);
  app.post(`${BASE}/:id/reminder`, { preHandler: [requireAuth] }, sendBookingReminderAdminHandler);
  app.delete(`${BASE}/:id`, { preHandler: [requireAuth] }, deleteBookingAdminHandler);

app.post(`${BASE}/:id/accept`, { preHandler: [requireAuth] }, acceptBookingAdminHandler);
app.post(`${BASE}/:id/reject`, { preHandler: [requireAuth] }, rejectBookingAdminHandler);

}
