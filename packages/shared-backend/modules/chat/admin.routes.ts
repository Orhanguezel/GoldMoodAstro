// =============================================================
// FILE: src/modules/chat/admin.routes.ts
// =============================================================

import type { FastifyInstance } from "fastify";
import { chatAdminController } from "./admin.controller";
import { requireAuth } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/roles";

const BASE = "/chat/threads";

export async function registerChatAdmin(app: FastifyInstance) {
  const c = chatAdminController();

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

  app.post(`${BASE}/:id/messages`, { preHandler: [requireAuth, requireAdmin] }, c.adminPostMessage);
  app.post(`${BASE}/:id/takeover`, { preHandler: [requireAuth, requireAdmin] }, c.takeover);
  app.post(`${BASE}/:id/release-to-ai`, { preHandler: [requireAuth, requireAdmin] }, c.releaseToAi);
  app.patch(`${BASE}/:id/ai-provider`, { preHandler: [requireAuth, requireAdmin] }, c.setProvider);

  app.get("/chat/knowledge", { preHandler: [requireAuth, requireAdmin] }, c.listKnowledge);
  app.get("/chat/knowledge/:id", { preHandler: [requireAuth, requireAdmin] }, c.getKnowledge);
  app.post("/chat/knowledge", { preHandler: [requireAuth, requireAdmin] }, c.createKnowledge);
  app.patch("/chat/knowledge/:id", { preHandler: [requireAuth, requireAdmin] }, c.updateKnowledge);
  app.delete("/chat/knowledge/:id", { preHandler: [requireAuth, requireAdmin] }, c.deleteKnowledge);
}
