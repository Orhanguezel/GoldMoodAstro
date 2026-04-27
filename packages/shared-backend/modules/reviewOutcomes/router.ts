// src/modules/reviewOutcomes/router.ts
import type { FastifyInstance } from "fastify";
import * as controller from "./controller";
import { requireAuth } from "../../middleware/auth";

export async function registerReviewOutcomes(app: FastifyInstance) {
  // PATCH /reviews/:id/outcome — auth (kullanıcı cevap verir)
  app.patch("/reviews/:id/outcome", { preHandler: [requireAuth] }, controller.submitOutcome);

  // GET /consultants/:id/outcomes/score — public (astrolog karne)
  app.get("/consultants/:id/outcomes/score", controller.consultantScore);

  // GET /reviews/me/pending-outcomes — auth
  app.get("/reviews/me/pending-outcomes", { preHandler: [requireAuth] }, controller.myPendingOutcomes);
}
