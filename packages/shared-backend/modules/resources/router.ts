// =============================================================
// FILE: src/modules/resources/router.ts
// FINAL — Public resources routes
// =============================================================

import type { FastifyInstance } from 'fastify';
import { listResourcesPublicHandler } from './controller';

const BASE = '/resources';

export async function registerResources(app: FastifyInstance) {
  app.get(BASE, listResourcesPublicHandler);
}
