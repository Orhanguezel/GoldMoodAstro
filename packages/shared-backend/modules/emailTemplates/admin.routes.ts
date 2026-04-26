// =============================================================
// FILE: src/modules/email-templates/admin.routes.ts
// =============================================================
import type { FastifyInstance } from "fastify";
import {
  listEmailTemplatesAdmin,
  getEmailTemplateAdmin,
  createEmailTemplateAdmin,
  updateEmailTemplateAdmin,
  deleteEmailTemplateAdmin,
} from "./admin.controller";
import { requireAuth } from "../../middleware/auth";

export async function registerEmailTemplatesAdmin(app: FastifyInstance) {
  const base = "/email_templates";

  app.get(base, { preHandler: [requireAuth] }, listEmailTemplatesAdmin);
  app.get(`${base}/:id`, { preHandler: [requireAuth] }, getEmailTemplateAdmin);
  app.post(base, { preHandler: [requireAuth] }, createEmailTemplateAdmin);
  app.patch(`${base}/:id`, { preHandler: [requireAuth] }, updateEmailTemplateAdmin);
  app.delete(`${base}/:id`, { preHandler: [requireAuth] }, deleteEmailTemplateAdmin);
}
