// src/modules/orders/router.ts
import type { FastifyInstance } from "fastify";
import * as controller from "./controller";
import { requireAuth } from '../../middleware/auth';

export async function registerOrders(app: FastifyInstance) {
  const BASE = "/orders";
  const readRateLimit = { max: 60, timeWindow: "1 minute" };
  const writeRateLimit = { max: 20, timeWindow: "5 minutes" };
  const checkoutRateLimit = { max: 12, timeWindow: "5 minutes" };

  // ── Sabit path'ler ÖNCE — /:id parametresinden önce kaydedilmeli ──

  // Addresses
  app.get(`${BASE}/addresses`, { preHandler: [requireAuth], config: { rateLimit: readRateLimit } }, controller.listAddresses);
  app.post(`${BASE}/addresses`, { preHandler: [requireAuth], config: { rateLimit: writeRateLimit } }, controller.createAddress);

  // Gateways (sabit → /:id'den önce)
  app.get(`${BASE}/gateways`, { config: { rateLimit: readRateLimit } }, controller.listGateways);

  // Callback (sabit → /:id/... den önce)
  app.post(`${BASE}/iyzico/callback`, { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } }, controller.iyzicoCallback);

  // ── Orders list & create (trailing slash olmadan) ──
  app.get(BASE, { preHandler: [requireAuth], config: { rateLimit: readRateLimit } }, controller.listOrders);
  app.post(BASE, { preHandler: [requireAuth], config: { rateLimit: writeRateLimit } }, controller.createOrder);

  // ── Dinamik parametreli path'ler EN SONDA ──
  app.post<{ Params: { id: string } }>(`${BASE}/:id/init-iyzico`, { preHandler: [requireAuth], config: { rateLimit: checkoutRateLimit } }, controller.initIyzico);
  app.get<{ Params: { id: string } }>(`${BASE}/:id`, { preHandler: [requireAuth], config: { rateLimit: readRateLimit } }, controller.getOrderDetail);
}

export async function registerOrdersAdmin(app: FastifyInstance) {
  app.get("/orders", controller.listOrdersAdmin);
  app.get<{ Params: { id: string } }>("/orders/:id", controller.getOrderAdmin);
  app.patch<{ Params: { id: string } }>("/orders/:id", controller.updateOrderAdmin);
  app.post<{ Params: { id: string } }>("/orders/:id/refund", controller.refundOrderAdmin);

  app.get("/payment-gateways", controller.listPaymentGatewaysAdmin);
  app.post("/payment-gateways", controller.createPaymentGatewayAdmin);
  app.patch<{ Params: { id: string } }>("/payment-gateways/:id", controller.updatePaymentGatewayAdmin);
}
