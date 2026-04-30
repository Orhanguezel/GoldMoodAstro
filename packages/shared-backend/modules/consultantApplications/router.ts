import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { requireAuth, tryAuth } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/roles';
import {
  approveConsultantApplication,
  createConsultantApplication,
  getConsultantApplication,
  listConsultantApplications,
  rejectConsultantApplication,
} from './controller';

export async function registerConsultantApplications(app: FastifyInstance) {
  app.post('/consultants/apply', { preHandler: tryAuth }, createConsultantApplication);
}

export async function registerConsultantApplicationsAdmin(app: FastifyInstance) {
  const adminGuard = async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    await requireAdmin(req, reply);
  };

  const B = '/consultant-applications';
  app.get(B, { preHandler: adminGuard }, listConsultantApplications);
  app.get(`${B}/:id`, { preHandler: adminGuard }, getConsultantApplication);
  app.post(`${B}/:id/approve`, { preHandler: adminGuard }, approveConsultantApplication);
  app.post(`${B}/:id/reject`, { preHandler: adminGuard }, rejectConsultantApplication);
}
