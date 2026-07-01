import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { requireAuth } from '@goldmood/shared-backend/middleware/auth';
import { requireAdmin, requireConsultant } from '@goldmood/shared-backend/middleware/roles';
import * as controller from './controller';

async function consultantGuard(req: FastifyRequest, reply: FastifyReply) {
  await requireAuth(req, reply);
  await requireConsultant(req, reply);
}

async function adminGuard(req: FastifyRequest, reply: FastifyReply) {
  await requireAuth(req, reply);
  await requireAdmin(req, reply);
}

export async function registerServiceBoosts(app: FastifyInstance) {
  app.get('/me/consultant/services/boost/packages', { preHandler: consultantGuard }, controller.getPackages);
  app.post('/me/consultant/services/:id/boost/checkout', { preHandler: consultantGuard }, controller.createCheckout);
  app.get('/me/consultant/services/:id/boost/status', { preHandler: consultantGuard }, controller.getStatus);
  app.post('/service-boosts/iyzico/callback', controller.iyzicoCallback);
}

export async function registerServiceBoostsAdmin(app: FastifyInstance) {
  app.get('/service-boosts', { preHandler: adminGuard }, controller.listAdmin);
  app.post('/service-boosts/:id/cancel', { preHandler: adminGuard }, controller.cancelAdmin);
}
