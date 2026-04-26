// src/modules/wallet/router.ts
import type { FastifyInstance } from "fastify";
import * as controller from "./controller";
import { requireAuth } from '../../middleware/auth';

export async function registerWallet(app: FastifyInstance) {
  const BASE = "/wallet";

  app.get(BASE, { preHandler: [requireAuth] }, controller.getMyWallet);
  app.get(`${BASE}/transactions`, { preHandler: [requireAuth] }, controller.listMyTransactions);
}
