// src/modules/subscriptions/router.ts
import type { FastifyInstance } from "fastify";
import * as controller from "./controller";
import { requireAuth } from "../../middleware/auth";

export async function registerSubscriptions(app: FastifyInstance) {
  const BASE = "/subscriptions";

  // Public
  app.get(`${BASE}/plans`, controller.listPlans);

  // Auth
  app.get(`${BASE}/me`, { preHandler: [requireAuth] }, controller.getMySubscription);
  app.post(`${BASE}/cancel`, { preHandler: [requireAuth] }, controller.cancelMySubscription);
  app.post(`${BASE}/start`, { preHandler: [requireAuth] }, controller.startSubscription);
  app.post(`${BASE}/webhook`, controller.subscriptionWebhook);
  app.post(`${BASE}/verify-receipt`, { preHandler: [requireAuth] }, controller.verifyReceipt);

  // Note: subscription webhook does not require auth because Iyzipay uses server-to-server callbacks.
}
