// =============================================================
// FILE: src/modules/chat/admin.routes.ts
// =============================================================

import type { FastifyInstance } from "fastify";
import { chatAdminController } from "./admin.controller";
import { requireAuth } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/roles";

const BASE = "/chat/threads";

export async function registerChatAdmin(app: FastifyInstance) {
  const c = chatAdminController(app);

  app.get(
    `${BASE}`,
    { preHandler: [requireAuth, requireAdmin] },
    c.adminListThreads,
  );

  app.get(
    `${BASE}/:id/messages`,
    { preHandler: [requireAuth, requireAdmin] },
    c.adminListMessages,
  );
}
