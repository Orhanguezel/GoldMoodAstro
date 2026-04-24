import type { FastifyInstance } from 'fastify';
import { registerGutschein } from '@/modules/gutschein/router';
import { registerGutscheinAdmin } from '@/modules/gutschein/admin.routes';
import { registerReportsAdmin } from '@/modules/reports/admin.routes';

export async function registerKonigRoutes(api: FastifyInstance) {
  await registerGutschein(api);

  // Alias: frontend uses custom_pages (underscore), shared-backend uses custom-pages (hyphen)
  api.get('/custom_pages', async (req, reply) => {
    const qs = req.url.split('?')[1] || '';
    return reply.redirect(`/api/v1/custom-pages${qs ? '?' + qs : ''}`);
  });
  api.get('/custom_pages/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const qs = req.url.split('?')[1] || '';
    return reply.redirect(`/api/v1/custom-pages/${slug}${qs ? '?' + qs : ''}`);
  });
}

export async function registerKonigAdmin(adminApi: FastifyInstance) {
  await adminApi.register(registerGutscheinAdmin);
  await adminApi.register(registerReportsAdmin);
}
