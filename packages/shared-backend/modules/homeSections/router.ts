// packages/shared-backend/modules/homeSections/router.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as controller from './controller';
import { requireAuth } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/roles';

export async function registerHomeSections(app: FastifyInstance) {
  // Public — anasayfa SSR'ı buradan layout'u çeker
  app.get('/home/layout', controller.listPublic);
}

export async function registerHomeSectionsAdmin(adminApi: FastifyInstance) {
  const guard = async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    await requireAdmin(req, reply);
  };

  adminApi.get('/home/sections', { preHandler: guard }, controller.listAdmin);
  adminApi.post('/home/sections/reorder', { preHandler: guard }, controller.reorderAdmin);
  adminApi.get('/home/sections/:id', { preHandler: guard }, controller.getAdmin);
  adminApi.post('/home/sections', { preHandler: guard }, controller.createAdmin);
  adminApi.patch('/home/sections/:id', { preHandler: guard }, controller.updateAdmin);
  adminApi.delete('/home/sections/:id', { preHandler: guard }, controller.deleteAdmin);
}
