// src/modules/banners/router.ts
import type { FastifyInstance } from "fastify";
import * as controller from "./controller";

export async function registerBanners(app: FastifyInstance) {
  const BASE = "/banners";
  app.get(BASE, controller.listActive);
  app.post(`${BASE}/:id/click`, controller.trackClick);
}

export async function registerBannersAdmin(adminApi: FastifyInstance) {
  const BASE = "/banners";
  adminApi.get(BASE, controller.adminList);
  adminApi.post(BASE, controller.adminCreate);
  adminApi.patch(`${BASE}/:id`, controller.adminUpdate);
  adminApi.delete(`${BASE}/:id`, controller.adminDelete);
}
