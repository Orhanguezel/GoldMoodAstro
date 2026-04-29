// =============================================================
// FILE: modules/llmPrompts/admin.routes.ts
// FAZ 19 / T19-3 — /admin/llm_prompts CRUD + test
// =============================================================
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  listPromptsAdmin,
  getPromptAdmin,
  createPromptAdmin,
  updatePromptAdmin,
  deletePromptAdmin,
  testPromptAdmin,
} from "./admin.controller";
import { requireAuth } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/roles";

const BASE = "/llm-prompts";  // adminApi already prefixed with /admin
                              // kebab-case: matches existing admin UI route convention

export async function registerLlmPromptsAdmin(app: FastifyInstance) {
  const adminGuard = async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    await requireAdmin(req, reply);
  };

  app.get(BASE, { preHandler: adminGuard }, listPromptsAdmin);
  app.get(`${BASE}/:id`, { preHandler: adminGuard }, getPromptAdmin);
  app.post(BASE, { preHandler: adminGuard }, createPromptAdmin);
  app.patch(`${BASE}/:id`, { preHandler: adminGuard }, updatePromptAdmin);
  app.delete(`${BASE}/:id`, { preHandler: adminGuard }, deletePromptAdmin);
  app.post(`${BASE}/:id/test`, { preHandler: adminGuard }, testPromptAdmin);
}
