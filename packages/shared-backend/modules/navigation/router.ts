// src/modules/navigation/router.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import * as controller from "./controller";
import { requireAuth } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/roles";

export async function registerNavigation(app: FastifyInstance) {
  // Public — menu_items (underscore for legacy frontend compat)
  app.get("/menu_items", controller.listMenuItemsPublic);
  app.get("/menu_items/:id", controller.getMenuItemPublic);

  // Public — footer_sections
  app.get("/footer_sections", controller.listFooterSectionsPublic);
  app.get("/footer_sections/by-slug/:slug", controller.getFooterSectionBySlugPublic);
  app.get("/footer_sections/:id", controller.getFooterSectionPublic);
}

export async function registerNavigationAdmin(adminApi: FastifyInstance) {
  const adminGuard = async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    await requireAdmin(req, reply);
  };

  // Admin — menu_items
  adminApi.get("/menu_items", { preHandler: adminGuard }, controller.listMenuItemsAdmin);
  adminApi.post("/menu_items/reorder", { preHandler: adminGuard }, controller.reorderMenuItems);
  adminApi.get("/menu_items/:id", { preHandler: adminGuard }, controller.getMenuItemAdmin);
  adminApi.post("/menu_items", { preHandler: adminGuard }, controller.createMenuItem);
  adminApi.patch("/menu_items/:id", { preHandler: adminGuard }, controller.updateMenuItem);
  adminApi.delete("/menu_items/:id", { preHandler: adminGuard }, controller.deleteMenuItem);

  // Admin — footer_sections
  adminApi.get("/footer_sections", { preHandler: adminGuard }, controller.listFooterSectionsAdmin);
  adminApi.post("/footer_sections", { preHandler: adminGuard }, controller.createFooterSection);
  adminApi.patch("/footer_sections/:id", { preHandler: adminGuard }, controller.updateFooterSection);
  adminApi.delete("/footer_sections/:id", { preHandler: adminGuard }, controller.deleteFooterSection);
}
