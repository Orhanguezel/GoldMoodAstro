// src/modules/campaigns/router.ts
import type { FastifyInstance } from "fastify";
import * as controller from "./controller";
import { requireAuth } from "../../middleware/auth";

export async function registerCampaigns(app: FastifyInstance) {
  const BASE = "/campaigns";
  app.get(`${BASE}/active`, controller.listActive);
  app.post(`${BASE}/redeem`, { preHandler: [requireAuth] }, controller.redeem);
}

export async function registerCampaignsAdmin(adminApi: FastifyInstance) {
  const BASE = "/campaigns";
  adminApi.get(BASE, controller.adminList);
  adminApi.post(BASE, controller.adminCreate);
  adminApi.patch(`${BASE}/:id`, controller.adminUpdate);
  adminApi.delete(`${BASE}/:id`, controller.adminDelete);
}
