// packages/shared-backend/modules/consultantServices/router.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as controller from './controller';
import { requireAuth } from '../../middleware/auth';
import { requireAdmin, requireConsultant } from '../../middleware/roles';

export async function registerConsultantServices(app: FastifyInstance) {
  // Public — anasayfa + consultant detail page'inde gözüken paket listesi
  app.get('/consultants/:consultantId/services', controller.listPublic);

  // Self — consultant kendi servisleri (giriş yapmış consultant rolündeki kullanıcı)
  const authGuard = async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    await requireConsultant(req, reply);
  };
  app.get('/me/consultant/services', { preHandler: authGuard }, controller.listSelf);
  app.post('/me/consultant/services', { preHandler: authGuard }, controller.createSelf);
  app.patch('/me/consultant/services/:id', { preHandler: authGuard }, controller.updateSelf);
  app.delete('/me/consultant/services/:id', { preHandler: authGuard }, controller.deleteSelf);
  app.post('/me/consultant/services/reorder', { preHandler: authGuard }, controller.reorderSelf);
}

export async function registerConsultantServicesAdmin(adminApi: FastifyInstance) {
  const guard = async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    await requireAdmin(req, reply);
  };
  adminApi.get('/consultants/:consultantId/services', { preHandler: guard }, controller.listAdmin);
  adminApi.post('/consultants/:consultantId/services', { preHandler: guard }, controller.createAdmin);
  adminApi.patch('/consultant-services/:id', { preHandler: guard }, controller.updateAdmin);
  adminApi.delete('/consultant-services/:id', { preHandler: guard }, controller.deleteAdmin);
}
