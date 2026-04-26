// =============================================================
// FILE: src/modules/support/admin.routes.ts
// =============================================================

import type { FastifyInstance } from "fastify";
import { SupportAdminController } from "./admin.controller";

export async function registerSupportAdmin(app: FastifyInstance) {
  const BASE = "/support_tickets";
  const REPLIES_BASE = "/ticket_replies";

  // Tickets (admin)
  app.get(
    `${BASE}`,
    { config: { auth: true } },
    SupportAdminController.list,
  );
  app.get(
    `${BASE}/:id`,
    { config: { auth: true } },
    SupportAdminController.get,
  );
  app.patch(
    `${BASE}/:id`,
    { config: { auth: true } },
    SupportAdminController.update,
  );
  app.delete(
    `${BASE}/:id`,
    { config: { auth: true } },
    SupportAdminController.remove,
  );

  // :action = "close" | "reopen"
  app.post(
    `${BASE}/:id/:action`,
    { config: { auth: true } },
    SupportAdminController.toggle,
  );

  // Replies (admin)
  app.get(
    `${REPLIES_BASE}/by-ticket/:ticketId`,
    { config: { auth: true } },
    SupportAdminController.listReplies,
  );
  app.post(
    `${REPLIES_BASE}`,
    { config: { auth: true } },
    SupportAdminController.createReply,
  );
  app.delete(
    `${REPLIES_BASE}/:id`,
    { config: { auth: true } },
    SupportAdminController.removeReply,
  );
}
