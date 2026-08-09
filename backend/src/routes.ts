import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@goldmood/shared-backend/middleware/auth';
import { requireAdmin } from '@goldmood/shared-backend/middleware/roles';
import { registerSharedPublic, registerSharedAdmin } from './routes/shared';
import { registerGoldmoodPublic, registerGoldmoodAdmin } from './routes/goldmood';
import { requireServiceToken } from './modules/ext/service-auth';
import { registerExtApi } from './modules/ext/routes';

export async function registerAllRoutes(app: FastifyInstance) {
  await app.register(async (api) => {
    await api.register(async (adminApi) => {
      adminApi.addHook('onRequest', requireAuth);
      adminApi.addHook('onRequest', requireAdmin);
      await registerSharedAdmin(adminApi);
      await registerGoldmoodAdmin(adminApi);
    }, { prefix: '/admin' });

    // Dış tüketici (ekosistem sosyal medya) — salt-okuma, servis API key (X-Api-Key).
    // Fail-closed: EXT_API_KEY yoksa requireServiceToken tüm istekleri 503 ile reddeder.
    await api.register(async (extApi) => {
      extApi.addHook('onRequest', requireServiceToken);
      await registerExtApi(extApi);
    }, { prefix: '/ext' });

    await registerSharedPublic(api);
    await registerGoldmoodPublic(api);
  }, { prefix: '/api' });
}
