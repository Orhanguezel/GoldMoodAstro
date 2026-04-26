import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@goldmood/shared-backend/middleware/auth';
import { requireAdmin } from '@goldmood/shared-backend/middleware/roles';
import { registerSharedPublic, registerSharedAdmin } from './routes/shared';
import { registerGoldmoodPublic, registerGoldmoodAdmin } from './routes/goldmood';

export async function registerAllRoutes(app: FastifyInstance) {
  await app.register(async (api) => {
    api.get('/health', async () => ({ ok: true }));

    await api.register(async (v1) => {
      await v1.register(async (adminApi) => {
        adminApi.addHook('onRequest', requireAuth);
        adminApi.addHook('onRequest', requireAdmin);
        await registerSharedAdmin(adminApi);
        await registerGoldmoodAdmin(adminApi);
      }, { prefix: '/admin' });

      await registerSharedPublic(v1);
      await registerGoldmoodPublic(v1);
    }, { prefix: '/v1' });
  }, { prefix: '/api' });
}
