// src/modules/credits/controller.ts
// FAZ 10 / T10-2 — minimal handlers (paket listele, me bakiye + işlemler)
// purchase (Iyzipay) ve live_session consumption → Codex'e bırakıldı

import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from '../../db/client';
import { creditPackages, userCredits, creditTransactions } from "./schema";
import { eq, desc } from "drizzle-orm";

function getUser(req: { user?: unknown }) {
  const u = req.user as Record<string, unknown> | undefined;
  const id = (u?.id ?? u?.sub ?? "") as string;
  return { id };
}

async function getOrCreateUserCredit(userId: string) {
  const [existing] = await db.select().from(userCredits).where(eq(userCredits.user_id, userId)).limit(1);
  if (existing) return existing;
  const id = randomUUID();
  await db.insert(userCredits).values({ id, user_id: userId, balance: 0 });
  const [created] = await db.select().from(userCredits).where(eq(userCredits.id, id)).limit(1);
  return created;
}

/** GET /credits/packages — public */
export const listPackages: RouteHandler = async (_req, reply) => {
  const rows = await db
    .select()
    .from(creditPackages)
    .where(eq(creditPackages.is_active, 1))
    .orderBy(creditPackages.display_order);
  return reply.send({ data: rows });
};

/** GET /credits/me — auth, bakiye + son 20 işlem */
export const getMyCredits: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);
  if (!userId) return reply.code(401).send({ error: { message: "unauthorized" } });

  const wallet = await getOrCreateUserCredit(userId);

  const txs = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.user_id, userId))
    .orderBy(desc(creditTransactions.created_at))
    .limit(20);

  return reply.send({
    data: {
      balance: wallet.balance,
      currency: wallet.currency,
      recent_transactions: txs,
    },
  });
};
