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
} from './controller';

export async function registerBirthCharts(app: FastifyInstance) {
  const BASE = '/birth-charts';
  app.post(`${BASE}/preview`, previewBirthChartHandler);
  app.get(BASE, { preHandler: [requireAuth] }, listBirthChartsHandler);
  app.post(BASE, { preHandler: [requireAuth] }, createBirthChartHandler);
  app.post(`${BASE}/synastry`, { preHandler: [requireAuth] }, birthChartSynastryHandler);
  app.get(`${BASE}/:id`, { preHandler: [requireAuth] }, getBirthChartHandler);
  app.delete(`${BASE}/:id`, { preHandler: [requireAuth] }, deleteBirthChartHandler);
  app.post(`${BASE}/:id/transit`, { preHandler: [requireAuth] }, birthChartTransitHandler);
  app.post(`${BASE}/:id/reading`, { preHandler: [requireAuth] }, birthChartReadingHandler);
}
