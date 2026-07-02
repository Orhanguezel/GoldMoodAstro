import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@goldmood/shared-backend/middleware/auth';
import { requirePremium } from '@goldmood/shared-backend/middleware/premium';
import { generateDailyReadingHandler } from './controller';

export async function registerReadings(app: FastifyInstance) {
  app.post('/readings/daily', { preHandler: [requireAuth, requirePremium] }, generateDailyReadingHandler);
}
