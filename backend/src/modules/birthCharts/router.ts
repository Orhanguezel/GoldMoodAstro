import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@goldmood/shared-backend/middleware/auth';
import {
  birthChartReadingHandler,
  birthChartSynastryHandler,
  birthChartTransitHandler,
  createBirthChartHandler,
  deleteBirthChartHandler,
  getBirthChartHandler,
  listBirthChartsHandler,
  previewBirthChartHandler,
  previewBigThreeHandler,
  updateBirthChartHandler,
} from './controller';

export async function registerBirthCharts(app: FastifyInstance) {
  const BASE = '/birth-charts';
  app.post(`${BASE}/preview`, previewBirthChartHandler);
  // FAZ 20 / T20-3 + T20-4 — Yükselen + Güneş + Ay preview (auth opsiyonel)
  app.post(`${BASE}/preview-big-three`, previewBigThreeHandler);
  app.get(BASE, { preHandler: [requireAuth] }, listBirthChartsHandler);
  app.post(BASE, { preHandler: [requireAuth] }, createBirthChartHandler);
  app.post(`${BASE}/synastry`, { preHandler: [requireAuth] }, birthChartSynastryHandler);
  app.get(`${BASE}/:id`, { preHandler: [requireAuth] }, getBirthChartHandler);
  app.patch(`${BASE}/:id`, { preHandler: [requireAuth] }, updateBirthChartHandler);
  app.delete(`${BASE}/:id`, { preHandler: [requireAuth] }, deleteBirthChartHandler);
  app.post(`${BASE}/:id/transit`, { preHandler: [requireAuth] }, birthChartTransitHandler);
  app.post(`${BASE}/:id/reading`, { preHandler: [requireAuth] }, birthChartReadingHandler);
}
