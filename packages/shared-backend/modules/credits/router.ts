// packages/shared-backend/modules/credits/router.ts
import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth';
import * as controller from './controller';

export function registerCreditsRoutes(fastify: FastifyInstance) {
  fastify.get('/credits/packages', controller.handleListPackages);
  fastify.get('/credits/me', { preHandler: requireAuth }, controller.handleGetMe);
  fastify.get('/credits/balance', { preHandler: requireAuth }, controller.handleGetBalance);
  fastify.post('/credits/buy', { preHandler: requireAuth }, controller.handleBuyCredits);
  fastify.post('/credits/verify-receipt', { preHandler: requireAuth }, controller.handleVerifyIapReceipt);
  fastify.post('/credits/iyzico/callback', controller.handleIyzicoCallback);
}

export function registerCreditsAdmin(fastify: FastifyInstance) {
  fastify.get('/credit-packages', controller.handleAdminListCreditPackages);
  fastify.get<{ Params: { id: string } }>('/credit-packages/:id', controller.handleAdminGetCreditPackage);
  fastify.post('/credit-packages', controller.handleAdminCreateCreditPackage);
  fastify.patch<{ Params: { id: string } }>('/credit-packages/:id', controller.handleAdminUpdateCreditPackage);
  fastify.delete<{ Params: { id: string } }>('/credit-packages/:id', controller.handleAdminDeleteCreditPackage);
}

export const registerCredits = registerCreditsRoutes;
