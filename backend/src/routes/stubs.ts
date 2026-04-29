// backend/src/routes/stubs.ts

import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';

/**
 * Stub routes to prevent 404s for modules not yet fully migrated 
 * or removed but still called by legacy frontend code.
 */
export async function registerStubs(api: FastifyInstance) {
  // Menu Items + Footer Sections — now served by navigation module
  // Custom Pages — now served by customPages module

  // FAQs
  api.get('/faqs', async () => ([]));

  // Newsletter
  api.post('/newsletter/subscribe', async (req) => {
    const { email, locale, meta } = req.body as {
      email?: string;
      locale?: string;
      meta?: Record<string, unknown>;
    };
    const now = new Date().toISOString();
    return {
      id: randomUUID(),
      email: email ?? '',
      is_verified: false,
      locale: locale ?? null,
      meta: meta ?? null,
      created_at: now,
      updated_at: now,
      unsubscribed_at: null,
      subscribeDate: now,
      unsubscribeDate: null,
    };
  });

  api.post('/newsletter/unsubscribe', async () => ({ ok: true }));
  
  // Popups
  api.get('/popups', async () => ([]));

  // Fallback for some common site settings keys that might be missing
  api.get('/site_settings/by-key', async (req) => {
    const { key } = req.query as { key: string };
    return { key, value: null };
  });

  api.get('/site_settings/ga4_measurement_id', async () => ({ value: null }));
  api.get('/site_settings/facebook_pixel_id', async () => ({ value: null }));
}
