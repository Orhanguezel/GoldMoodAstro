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

  // TODO (Codex): POST /credits/purchase (Iyzipay order yarat → bonus credit ekle)
  // TODO (Codex): consumption helper — live_session.ended → kredi düş
}
