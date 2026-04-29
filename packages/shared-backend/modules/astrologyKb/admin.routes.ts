// =============================================================
// FILE: modules/astrologyKb/admin.routes.ts
// FAZ 19 / T19-3 — /admin/astrology_kb CRUD + bulk
// =============================================================
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  approveKbAdmin,
  bulkImportKbAdmin,
  createKbAdmin,
  createTranslationDraftsAdmin,
  deleteKbAdmin,
  getKbAdmin,
  listKbAdmin,
  rejectKbAdmin,
  updateKbAdmin,
} from "./admin.controller";
import { requireAuth } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/roles";

const BASE = "/astrology-kb";  // adminApi already prefixed with /admin
                               // kebab-case for URL consistency with admin UI

export async function registerAstrologyKbAdmin(app: FastifyInstance) {
  const adminGuard = async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    await requireAdmin(req, reply);
  };

  app.get(BASE, { preHandler: adminGuard }, listKbAdmin);
  app.get(`${BASE}/:id`, { preHandler: adminGuard }, getKbAdmin);
  app.post(BASE, { preHandler: adminGuard }, createKbAdmin);
  app.post(`${BASE}/translation-drafts`, { preHandler: adminGuard }, createTranslationDraftsAdmin);
  app.post(`${BASE}/:id/approve`, { preHandler: adminGuard }, approveKbAdmin);
  app.post(`${BASE}/:id/reject`, { preHandler: adminGuard }, rejectKbAdmin);
  app.patch(`${BASE}/:id`, { preHandler: adminGuard }, updateKbAdmin);
  app.delete(`${BASE}/:id`, { preHandler: adminGuard }, deleteKbAdmin);
  app.post(`${BASE}/bulk-import`, { preHandler: adminGuard }, bulkImportKbAdmin);
}
