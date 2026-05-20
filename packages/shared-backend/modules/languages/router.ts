import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { requireAuth } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/roles';
import * as controller from './controller';

export async function registerLanguages(app: FastifyInstance) {
  app.get('/languages', controller.listPublic);
}

export async function registerLanguagesAdmin(adminApi: FastifyInstance) {
  const guard = async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    await requireAdmin(req, reply);
  };

  adminApi.get('/languages', { preHandler: guard }, controller.listAdmin);
  adminApi.get('/languages/:id', { preHandler: guard }, controller.getAdmin);
  adminApi.post('/languages', { preHandler: guard }, controller.createAdmin);
  adminApi.patch('/languages/:id', { preHandler: guard }, controller.updateAdmin);
  adminApi.delete('/languages/:id', { preHandler: guard }, controller.deleteAdmin);
}
