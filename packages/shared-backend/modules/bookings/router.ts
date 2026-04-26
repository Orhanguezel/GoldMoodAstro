// =============================================================
// FILE: src/modules/bookings/router.ts
// FINAL — Public booking routes
// =============================================================

import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth';
import {
  createBookingPublicHandler,
  listMyBookingsHandler,
  getMyBookingHandler,
  cancelMyBookingHandler,
} from './controller';

export async function registerBookings(app: FastifyInstance) {
  const BASE = '/bookings';
  app.get(`${BASE}/me`, { preHandler: [requireAuth] }, listMyBookingsHandler);
  app.post(BASE, { preHandler: [requireAuth] }, createBookingPublicHandler);
  app.get(`${BASE}/:id`, { preHandler: [requireAuth] }, getMyBookingHandler);
  app.patch(`${BASE}/:id/cancel`, { preHandler: [requireAuth] }, cancelMyBookingHandler);
}
