// src/modules/reviewOutcomes/controller.ts
// FAZ 17 / T17-6

import type { RouteHandler } from "fastify";
import { db } from "../../db/client";
import { reviewOutcomes } from "./schema";
import { eq, and, desc, sql } from "drizzle-orm";

function getUser(req: { user?: unknown }) {
  const u = req.user as Record<string, unknown> | undefined;
  const id = (u?.id ?? u?.sub ?? "") as string;
  return { id };
}

/**
 * PATCH /reviews/:id/outcome — auth, kullanıcı 6 ay sonraki cevabını verir
 * Body: { user_response: 'happened'|'partially'|'did_not_happen'|'no_answer', notes?: string }
 */
export const submitOutcome: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);
  if (!userId) return reply.code(401).send({ error: { message: "unauthorized" } });

  const { id: reviewId } = req.params as { id: string };
  const body = req.body as { user_response?: string; notes?: string };

  const valid = ["happened", "partially", "did_not_happen", "no_answer"];
  if (!body.user_response || !valid.includes(body.user_response)) {
    return reply.code(400).send({ error: { message: "invalid_user_response" } });
  }

  const [outcome] = await db
    .select()
    .from(reviewOutcomes)
    .where(and(eq(reviewOutcomes.review_id, reviewId), eq(reviewOutcomes.user_id, userId)))
    .limit(1);

  if (!outcome) return reply.code(404).send({ error: { message: "outcome_not_found" } });
  if (outcome.user_response) {
    return reply.code(409).send({ error: { message: "already_answered" } });
  }

  await db
    .update(reviewOutcomes)
    .set({
      user_response: body.user_response as "happened" | "partially" | "did_not_happen" | "no_answer",
      user_response_at: new Date(),
      notes: body.notes ?? null,
    })
    .where(eq(reviewOutcomes.id, outcome.id));

  return reply.send({ data: { id: outcome.id, user_response: body.user_response } });
};

/**
 * GET /consultants/:id/outcomes/score — public, astrolog karne özeti
 * Response: { total_followups, happened, partially, did_not_happen, no_answer, score (0-100) }
 *
 * Skor hesabı: happened * 1.0 + partially * 0.5 = pozitif puan
 *              total_answered = happened + partially + did_not_happen
 *              score = round((happened + partially*0.5) / total_answered * 100)
 */
export const consultantScore: RouteHandler = async (req, reply) => {
  const { id: consultantId } = req.params as { id: string };

  const rows = await db.execute(sql`
    SELECT
      COUNT(*) AS total_followups,
      SUM(CASE WHEN user_response = 'happened' THEN 1 ELSE 0 END) AS happened,
      SUM(CASE WHEN user_response = 'partially' THEN 1 ELSE 0 END) AS partially,
      SUM(CASE WHEN user_response = 'did_not_happen' THEN 1 ELSE 0 END) AS did_not_happen,
      SUM(CASE WHEN user_response = 'no_answer' OR user_response IS NULL THEN 1 ELSE 0 END) AS no_answer
    FROM review_outcomes
    WHERE consultant_id = ${consultantId}
  `);

  const arr = Array.isArray((rows as unknown as unknown[])?.[0]) ? (rows as unknown as unknown[][])[0] : rows;
  const r = (Array.isArray(arr) ? arr[0] : null) as {
    total_followups: number;
    happened: number;
    partially: number;
    did_not_happen: number;
    no_answer: number;
  } | null;

  const happened = Number(r?.happened ?? 0);
  const partially = Number(r?.partially ?? 0);
  const didNot = Number(r?.did_not_happen ?? 0);
  const noAnswer = Number(r?.no_answer ?? 0);
  const totalAnswered = happened + partially + didNot;

  const score = totalAnswered > 0
    ? Math.round(((happened + partially * 0.5) / totalAnswered) * 100)
    : null;

  return reply.send({
    data: {
      consultant_id: consultantId,
      total_followups: Number(r?.total_followups ?? 0),
      happened, partially, did_not_happen: didNot, no_answer: noAnswer,
      total_answered: totalAnswered,
      score,
    },
  });
};

/** GET /reviews/me/pending-outcomes — auth, kullanıcının cevap bekleyen karne soruları */
export const myPendingOutcomes: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);
  if (!userId) return reply.code(401).send({ error: { message: "unauthorized" } });

  const now = new Date();
  const rows = await db
    .select()
    .from(reviewOutcomes)
    .where(
      and(
        eq(reviewOutcomes.user_id, userId),
        sql`user_response IS NULL`,
        sql`follow_up_at <= ${now}`,
      )
    )
    .orderBy(desc(reviewOutcomes.follow_up_at))
    .limit(20);

  return reply.send({ data: rows });
};
