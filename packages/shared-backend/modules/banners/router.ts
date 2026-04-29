// src/modules/banners/router.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import * as controller from "./controller";
import { requireAuth } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/roles";

export async function registerBanners(app: FastifyInstance) {
  const BASE = "/banners";
  app.get(BASE, controller.listActive);
  app.post(`${BASE}/:id/click`, controller.trackClick);
}

export async function registerBannersAdmin(adminApi: FastifyInstance) {
  const BASE = "/banners";
  const adminGuard = async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    await requireAdmin(req, reply);
  };

  adminApi.get(BASE, { preHandler: adminGuard }, controller.adminList);
  adminApi.post(BASE, { preHandler: adminGuard }, controller.adminCreate);
  adminApi.patch(`${BASE}/:id`, { preHandler: adminGuard }, controller.adminUpdate);
  adminApi.delete(`${BASE}/:id`, { preHandler: adminGuard }, controller.adminDelete);
}
