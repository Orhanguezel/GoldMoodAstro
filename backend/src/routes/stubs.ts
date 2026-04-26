// backend/src/routes/stubs.ts

import type { FastifyInstance } from 'fastify';

/**
 * Stub routes to prevent 404s for modules not yet fully migrated 
 * or removed but still called by legacy frontend code.
 */
export async function registerStubs(api: FastifyInstance) {
  // Menu Items
  api.get('/menu_items', async () => ([]));
  
  // Footer Sections
  api.get('/footer_sections', async () => ([]));
  
  // Custom Pages
  api.get('/custom-pages', async () => ([]));
  
  // FAQs
  api.get('/faqs', async () => ([]));
  
  // Popups
  api.get('/popups', async () => ([]));

  // Fallback for some common site settings keys that might be missing
  // We handle these in the controller usually, but if the FE calls direct endpoints:
  api.get('/site_settings/ga4_measurement_id', async () => ({ value: null }));
  api.get('/site_settings/facebook_pixel_id', async () => ({ value: null }));
}
