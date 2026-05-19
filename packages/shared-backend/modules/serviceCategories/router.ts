import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { requireAuth } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/roles';
import * as controller from './controller';

export async function registerServiceCategories(app: FastifyInstance) {
  app.get('/service-categories', controller.listPublic);
}

export async function registerServiceCategoriesAdmin(adminApi: FastifyInstance) {
  const guard = async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    await requireAdmin(req, reply);
  };

  adminApi.get('/service-categories', { preHandler: guard }, controller.listAdmin);
  adminApi.get('/service-categories/:id', { preHandler: guard }, controller.getAdmin);
  adminApi.post('/service-categories', { preHandler: guard }, controller.createAdmin);
  adminApi.patch('/service-categories/:id', { preHandler: guard }, controller.updateAdmin);
  adminApi.delete('/service-categories/:id', { preHandler: guard }, controller.deleteAdmin);
}
