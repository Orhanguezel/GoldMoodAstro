// packages/shared-backend/modules/credits/router.ts
import type { FastifyInstance } from 'fastify';
import * as controller from './controller';

export function registerCreditsRoutes(fastify: FastifyInstance) {
  fastify.get('/credits/packages', controller.handleListPackages);
  fastify.get('/credits/balance', controller.handleGetBalance);
  fastify.post('/credits/buy', controller.handleBuyCredits);
  fastify.post('/credits/iyzico/callback', controller.handleIyzicoCallback);
}

export const registerCredits = registerCreditsRoutes;
