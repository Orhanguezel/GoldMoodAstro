import type { FastifyInstance } from 'fastify';
import {
  approveConsultantAdminHandler,
  getConsultantAdminHandler,
  getConsultantSessionUserReadingsAdminHandler,
  listConsultantsAdminHandler,
  rejectConsultantAdminHandler,
} from './controller';

export async function registerConsultantsAdmin(app: FastifyInstance) {
  const BASE = '/consultants';

  app.get(BASE, listConsultantsAdminHandler);
  app.get(`${BASE}/sessions/:bookingId/user-readings`, getConsultantSessionUserReadingsAdminHandler);
  app.get(`${BASE}/:id`, getConsultantAdminHandler);
  app.patch(`${BASE}/:id/approve`, approveConsultantAdminHandler);
  app.patch(`${BASE}/:id/reject`, rejectConsultantAdminHandler);
}
