// src/modules/wallet/controller.ts
import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from '../../db/client';
import { wallets, walletTransactions } from "./schema";
import { eq, desc } from "drizzle-orm";
import { depositSchema } from "./validation";

function getUser(req: { user?: unknown }) {
  const u = req.user as Record<string, unknown> | undefined;
  const id = (u?.id ?? u?.sub ?? "") as string;
  return { id };
}

/** Get or create wallet for current user */
async function getOrCreateWallet(userId: string) {
  const [existing] = await db.select().from(wallets).where(eq(wallets.user_id, userId)).limit(1);
  if (existing) return existing;

  const id = randomUUID();
  await db.insert(wallets).values({ id, user_id: userId });
  const [created] = await db.select().from(wallets).where(eq(wallets.id, id)).limit(1);
  return created;
}

/** GET /wallet — get current user's wallet info */
export const getMyWallet: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);
  const wallet = await getOrCreateWallet(userId);
  return reply.send(wallet);
};

/** GET /wallet/transactions — list current user's transactions */
export const listMyTransactions: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);
  const wallet = await getOrCreateWallet(userId);

  const { page = "1", limit = "20", type } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const rows = await db
    .select()
    .from(walletTransactions)
    .where(
      type
        ? eq(walletTransactions.wallet_id, wallet.id)
        : eq(walletTransactions.wallet_id, wallet.id)
    )
    .orderBy(desc(walletTransactions.created_at))
    .limit(limitNum)
    .offset(offset);

  return reply.send({ data: rows, page: pageNum, limit: limitNum });
};
