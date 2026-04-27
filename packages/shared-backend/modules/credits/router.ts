// src/modules/credits/router.ts
import type { FastifyInstance } from "fastify";
import * as controller from "./controller";
import { requireAuth } from "../../middleware/auth";

export async function registerCredits(app: FastifyInstance) {
  const BASE = "/credits";

  // Public
  app.get(`${BASE}/packages`, controller.listPackages);

  // Auth
  app.get(`${BASE}/me`, { preHandler: [requireAuth] }, controller.getMyCredits);
  app.post(`${BASE}/purchase`, { preHandler: [requireAuth] }, controller.purchaseCredits);
  app.post(`${BASE}/webhook`, controller.creditWebhook);

  // Note: /credits/webhook is a server-to-server callback endpoint.
}
