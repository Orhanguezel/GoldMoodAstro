import type { FastifyInstance } from 'fastify';
import { requireAuth, tryAuth } from '@goldmood/shared-backend/middleware/auth';
import {
  getConsultantHandler,
  getConsultantSlotsHandler,
  listConsultantsHandler,
  registerConsultantHandler,
  trackConsultantViewHandler,
} from './controller';

export async function registerConsultants(app: FastifyInstance) {
  const BASE = '/consultants';

  app.get(BASE, { preHandler: [tryAuth] }, listConsultantsHandler);
  app.post(`${BASE}/register`, { preHandler: [requireAuth] }, registerConsultantHandler);
  app.get(`${BASE}/:id`, { preHandler: [tryAuth] }, getConsultantHandler);
  app.post(`${BASE}/:id/view`, trackConsultantViewHandler);
  app.get(`${BASE}/:id/slots`, getConsultantSlotsHandler);
}
