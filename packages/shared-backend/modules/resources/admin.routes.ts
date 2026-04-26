// =============================================================
// FILE: src/modules/resources/admin.routes.ts
// FINAL — Admin resources routes
// NOTE: register with prefix '/admin'
// =============================================================

import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth';

import {
  listResourcesAdminHandler,
  getResourceAdminHandler,
  createResourceAdminHandler,
  updateResourceAdminHandler,
  deleteResourceAdminHandler,
} from './admin.controller';

export async function registerResourcesAdmin(app: FastifyInstance) {
  const BASE = '/resources';

  app.get(BASE, { preHandler: [requireAuth] }, listResourcesAdminHandler);
  app.get(`${BASE}/:id`, { preHandler: [requireAuth] }, getResourceAdminHandler);

  app.post(BASE, { preHandler: [requireAuth] }, createResourceAdminHandler);
  app.patch(`${BASE}/:id`, { preHandler: [requireAuth] }, updateResourceAdminHandler);
  app.delete(`${BASE}/:id`, { preHandler: [requireAuth] }, deleteResourceAdminHandler);
}
