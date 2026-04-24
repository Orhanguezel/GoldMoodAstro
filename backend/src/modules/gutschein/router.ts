// src/modules/gutschein/router.ts
import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@vps/shared-backend/middleware/auth';
import { listProducts, checkCode, purchaseGutschein, redeemGutschein, captureGutscheinPaypal, printGutschein } from './controller';

export async function registerGutschein(app: FastifyInstance) {
  const BASE = '/gutscheins';

  app.get(`${BASE}/products`, listProducts);
  app.post(`${BASE}/check`, checkCode);
  app.post(`${BASE}/purchase`, purchaseGutschein);
  app.post(`${BASE}/redeem`, { preHandler: [requireAuth] }, redeemGutschein);
  app.post(`${BASE}/:id/paypal/capture`, captureGutscheinPaypal);
  app.get(`${BASE}/:id/print`, printGutschein);
}
