// src/modules/campaigns/router.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import * as controller from "./controller";
import { requireAuth } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/roles";

export async function registerCampaigns(app: FastifyInstance) {
  const BASE = "/campaigns";
  app.get(`${BASE}/active`, controller.listActive);
  app.get(`${BASE}/me`, { preHandler: [requireAuth] }, controller.listMine);
  app.post(`${BASE}/redeem`, { preHandler: [requireAuth] }, controller.redeem);
}

export async function registerCampaignsAdmin(adminApi: FastifyInstance) {
  const BASE = "/campaigns";
  const adminGuard = async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    await requireAdmin(req, reply);
  };

  adminApi.get(BASE, { preHandler: adminGuard }, controller.adminList);
  adminApi.post(BASE, { preHandler: adminGuard }, controller.adminCreate);
  adminApi.patch(`${BASE}/:id`, { preHandler: adminGuard }, controller.adminUpdate);
  adminApi.delete(`${BASE}/:id`, { preHandler: adminGuard }, controller.adminDelete);
}
