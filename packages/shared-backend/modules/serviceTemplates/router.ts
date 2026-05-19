import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { requireAuth } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/roles';
import * as controller from './controller';

export async function registerServiceTemplatesAdmin(adminApi: FastifyInstance) {
  const guard = async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    await requireAdmin(req, reply);
  };

  adminApi.get('/service-templates', { preHandler: guard }, controller.listAdmin);
  adminApi.get('/service-templates/:id', { preHandler: guard }, controller.getAdmin);
  adminApi.post('/service-templates', { preHandler: guard }, controller.createAdmin);
  adminApi.patch('/service-templates/:id', { preHandler: guard }, controller.updateAdmin);
  adminApi.delete('/service-templates/:id', { preHandler: guard }, controller.deleteAdmin);
}
