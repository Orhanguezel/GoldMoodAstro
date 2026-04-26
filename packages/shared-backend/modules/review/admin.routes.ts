// =============================================================
// FILE: src/modules/review/admin.routes.ts (ADMIN)
// =============================================================
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  listReviewsAdmin,
  getReviewAdmin,
  createReviewAdmin,
  updateReviewAdmin,
  removeReviewAdmin,
} from "./admin.controller";
import { requireAuth } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/roles';

const BASE = "/reviews";

export async function registerReviewsAdmin(app: FastifyInstance) {
  // Admin guard (aynı contact modülündeki gibi)
  const adminGuard = async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    await requireAdmin(req, reply);
  };

  // LIST
  app.get<{ Querystring: Record<string, any> }>(
    `${BASE}`,
    { preHandler: adminGuard },
    listReviewsAdmin,
  );

  // GET by id
  app.get<{ Params: { id: string } }>(
    `${BASE}/:id`,
    { preHandler: adminGuard },
    getReviewAdmin,
  );

  // CREATE
  app.post<{ Body: unknown }>(
    `${BASE}`,
    { preHandler: adminGuard },
    createReviewAdmin,
  );

  // UPDATE
  app.patch<{ Params: { id: string }; Body: unknown }>(
    `${BASE}/:id`,
    { preHandler: adminGuard },
    updateReviewAdmin,
  );

  // DELETE
  app.delete<{ Params: { id: string } }>(
    `${BASE}/:id`,
    { preHandler: adminGuard },
    removeReviewAdmin,
  );
}
