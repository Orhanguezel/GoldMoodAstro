import type { FastifyInstance } from 'fastify';
import {
  listProductsAdmin,
  getProductAdmin,
  createProductAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  listGutscheinsAdmin,
  getGutscheinAdmin,
  createGutscheinAdmin,
  updateGutscheinAdmin,
  cancelGutscheinAdmin,
  activateGutscheinAdmin,
  sendGutscheinEmailAdmin,
  deleteGutscheinAdmin,
} from './admin.controller';

const PRODUCTS_BASE = '/gutschein-products';
const GUTSCHEINS_BASE = '/gutscheins';

export async function registerGutscheinAdmin(app: FastifyInstance) {
  app.get(PRODUCTS_BASE, { config: { auth: true } }, listProductsAdmin);
  app.get(`${PRODUCTS_BASE}/:id`, { config: { auth: true } }, getProductAdmin);
  app.post(PRODUCTS_BASE, { config: { auth: true } }, createProductAdmin);
  app.patch(`${PRODUCTS_BASE}/:id`, { config: { auth: true } }, updateProductAdmin);
  app.delete(`${PRODUCTS_BASE}/:id`, { config: { auth: true } }, deleteProductAdmin);

  app.get(GUTSCHEINS_BASE, { config: { auth: true } }, listGutscheinsAdmin);
  app.get(`${GUTSCHEINS_BASE}/:id`, { config: { auth: true } }, getGutscheinAdmin);
  app.post(GUTSCHEINS_BASE, { config: { auth: true } }, createGutscheinAdmin);
  app.patch(`${GUTSCHEINS_BASE}/:id`, { config: { auth: true } }, updateGutscheinAdmin);
  app.delete(`${GUTSCHEINS_BASE}/:id`, { config: { auth: true } }, deleteGutscheinAdmin);
  app.post(`${GUTSCHEINS_BASE}/:id/cancel`, { config: { auth: true } }, cancelGutscheinAdmin);
  app.post(`${GUTSCHEINS_BASE}/:id/activate`, { config: { auth: true } }, activateGutscheinAdmin);
  app.post(`${GUTSCHEINS_BASE}/:id/send-email`, { config: { auth: true } }, sendGutscheinEmailAdmin);
}
