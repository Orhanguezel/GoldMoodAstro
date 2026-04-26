import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@goldmood/shared-backend/middleware/auth';
import {
  getConsultantHandler,
  getConsultantSlotsHandler,
  listConsultantsHandler,
  registerConsultantHandler,
} from './controller';

export async function registerConsultants(app: FastifyInstance) {
  const BASE = '/consultants';

  app.get(BASE, listConsultantsHandler);
  app.post(`${BASE}/register`, { preHandler: [requireAuth] }, registerConsultantHandler);
  app.get(`${BASE}/:id`, getConsultantHandler);
  app.get(`${BASE}/:id/slots`, getConsultantSlotsHandler);
}
