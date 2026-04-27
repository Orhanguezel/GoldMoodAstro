// src/modules/subscriptions/controller.ts
// FAZ 10 / T10-1 — minimal handlers (plans listele, me, cancel)
// Iyzipay subscription start + webhook → Codex'e bırakıldı (büyük entegrasyon işi)

import type { RouteHandler } from "fastify";
import { db } from '../../db/client';
import { subscriptionPlans, subscriptions } from "./schema";
import { eq, and, desc } from "drizzle-orm";

function getUser(req: { user?: unknown }) {
  const u = req.user as Record<string, unknown> | undefined;
  const id = (u?.id ?? u?.sub ?? "") as string;
  return { id };
}

/** GET /subscriptions/plans — public, aktif planlar */
export const listPlans: RouteHandler = async (_req, reply) => {
  const rows = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.is_active, 1))
    .orderBy(subscriptionPlans.display_order);
  return reply.send({ data: rows });
};

/** GET /subscriptions/me — auth, kullanıcının aktif aboneliği (yoksa null) */
export const getMySubscription: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);
  if (!userId) return reply.code(401).send({ error: { message: "unauthorized" } });

  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.user_id, userId))
    .orderBy(desc(subscriptions.created_at))
    .limit(1);

  return reply.send({ data: rows[0] ?? null });
};

/** POST /subscriptions/cancel — auth, 1-tıkla iptal (anti-dark-pattern: friction yok) */
export const cancelMySubscription: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);
  if (!userId) return reply.code(401).send({ error: { message: "unauthorized" } });

  const body = (req.body ?? {}) as { reason?: string };

  const [active] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.user_id, userId), eq(subscriptions.status, "active")))
    .limit(1);

  if (!active) return reply.code(404).send({ error: { message: "no_active_subscription" } });

  await db
    .update(subscriptions)
    .set({
      status: "cancelled",
      cancelled_at: new Date(),
      cancellation_reason: body.reason ?? null,
      auto_renew: 0,
    })
    .where(eq(subscriptions.id, active.id));

  return reply.send({ data: { id: active.id, status: "cancelled", ends_at: active.ends_at } });
};
