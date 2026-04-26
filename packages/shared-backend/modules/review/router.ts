// =============================================================
// FILE: src/modules/review/router.ts (PUBLIC)
// =============================================================
import type { FastifyInstance } from "fastify";
import {
  listReviewsPublic,
  getReviewPublic,
  createReviewPublic,
  addReviewReactionPublic,
} from "./controller";

const BASE = "/reviews";

export async function registerReviews(app: FastifyInstance) {
  app.get(`${BASE}`, { config: { public: true } }, listReviewsPublic);
  app.get(`${BASE}/:id`, { config: { public: true } }, getReviewPublic);
  app.post(`${BASE}`, { config: { public: true } }, createReviewPublic);

  // Reaction endpoint: şimdilik sadece "like" sayacı
  app.post(
    `${BASE}/:id/reactions`,
    { config: { public: true } },
    addReviewReactionPublic,
  );
}
