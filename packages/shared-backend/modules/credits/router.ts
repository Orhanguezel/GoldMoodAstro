// packages/shared-backend/modules/credits/router.ts
import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth';
import * as controller from './controller';

export function registerCreditsRoutes(fastify: FastifyInstance) {
  fastify.get('/credits/packages', controller.handleListPackages);
  fastify.get('/credits/balance', { preHandler: requireAuth }, controller.handleGetBalance);
  fastify.post('/credits/buy', { preHandler: requireAuth }, controller.handleBuyCredits);
  fastify.post('/credits/iyzico/callback', controller.handleIyzicoCallback);
}

export const registerCredits = registerCreditsRoutes;
