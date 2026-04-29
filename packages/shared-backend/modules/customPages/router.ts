// src/modules/customPages/router.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import * as controller from "./controller";
import { requireAuth } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/roles";

export async function registerCustomPages(app: FastifyInstance) {
  // Public — kebab-case
  app.get("/custom-pages", controller.listPublic);
  app.get("/custom-pages/by-slug/:slug", controller.getBySlugPublic);
  app.get("/custom-pages/:id", controller.getByIdPublic);
}

export async function registerCustomPagesAdmin(adminApi: FastifyInstance) {
  const adminGuard = async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    await requireAdmin(req, reply);
  };

  // Admin — underscore (legacy frontend convention)
  adminApi.get("/custom_pages", { preHandler: adminGuard }, controller.listAdmin);
  adminApi.post("/custom_pages/reorder", { preHandler: adminGuard }, controller.reorder);
  adminApi.get("/custom_pages/by-slug/:slug", { preHandler: adminGuard }, controller.getBySlugAdmin);
  adminApi.get("/custom_pages/:id", { preHandler: adminGuard }, controller.getByIdAdmin);
  adminApi.post("/custom_pages", { preHandler: adminGuard }, controller.create);
  adminApi.patch("/custom_pages/:id", { preHandler: adminGuard }, controller.update);
  adminApi.delete("/custom_pages/:id", { preHandler: adminGuard }, controller.remove);
}
