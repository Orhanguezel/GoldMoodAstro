import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/roles';
import {
  getSeoQualityDetailAdmin,
  getGscSummaryAdmin,
  inspectGscUrlsAdmin,
  listSeoQualityAdmin,
  recalculateSeoAdmin,
  updateSeoQualityAdmin,
} from './controller';

export async function registerSeoQualityAdmin(app: FastifyInstance) {
  const guard = { preHandler: [requireAuth, requireAdmin] };

  app.get('/seo/quality', guard, listSeoQualityAdmin);
  app.get('/seo/quality/:type/:id', guard, getSeoQualityDetailAdmin);
  app.get('/seo/gsc/summary', guard, getGscSummaryAdmin);
  app.post('/seo/gsc/inspect', guard, inspectGscUrlsAdmin);
  app.post('/seo/recalculate', guard, recalculateSeoAdmin);
  app.patch('/seo/quality/:type/:id', guard, updateSeoQualityAdmin);
}

export async function registerSeoQuality(_app: FastifyInstance) {
  // Public score surface intentionally empty for now.
}
