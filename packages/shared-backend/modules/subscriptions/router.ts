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

  // TODO (Codex): POST /subscriptions/start (Iyzipay subscription form)
  // TODO (Codex): POST /subscriptions/webhook/iyzipay
  // TODO (Codex): POST /subscriptions/verify-receipt (Apple/Google IAP)
}
