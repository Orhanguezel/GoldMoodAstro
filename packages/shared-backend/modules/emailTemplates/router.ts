// =============================================================
// FILE: src/modules/email-templates/public.routes.ts
// =============================================================
import type { FastifyInstance } from "fastify";
import {
  listEmailTemplatesPublic,
  getEmailTemplateByKeyPublic,
  renderTemplateByKeyPublic,
} from "./controller";

const BASE = "/email_templates";

export async function registerEmailTemplates(app: FastifyInstance) {
  app.get(`${BASE}`, listEmailTemplatesPublic);
  app.get(`${BASE}/by-key/:key`, getEmailTemplateByKeyPublic);
  app.post(`${BASE}/by-key/:key/render`, renderTemplateByKeyPublic);
}
