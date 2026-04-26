// src/modules/orders/router.ts
import type { FastifyInstance } from "fastify";
import * as controller from "./controller";
import { requireAuth } from '../../middleware/auth';

export async function registerOrders(app: FastifyInstance) {
  const BASE = "/orders";

  // ── Sabit path'ler ÖNCE — /:id parametresinden önce kaydedilmeli ──

  // Addresses
  app.get(`${BASE}/addresses`, { preHandler: [requireAuth] }, controller.listAddresses);
  app.post(`${BASE}/addresses`, { preHandler: [requireAuth] }, controller.createAddress);

  // Gateways (sabit → /:id'den önce)
  app.get(`${BASE}/gateways`, controller.listGateways);

  // Callback (sabit → /:id/... den önce)
  app.post(`${BASE}/iyzico/callback`, controller.iyzicoCallback);

  // ── Orders list & create (trailing slash olmadan) ──
  app.get(BASE, { preHandler: [requireAuth] }, controller.listOrders);
  app.post(BASE, { preHandler: [requireAuth] }, controller.createOrder);

  // ── Dinamik parametreli path'ler EN SONDA ──
  app.post<{ Params: { id: string } }>(`${BASE}/:id/init-iyzico`, { preHandler: [requireAuth] }, controller.initIyzico);
  app.get<{ Params: { id: string } }>(`${BASE}/:id`, { preHandler: [requireAuth] }, controller.getOrderDetail);
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
