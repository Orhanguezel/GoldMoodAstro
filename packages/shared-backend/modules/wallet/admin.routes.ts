// src/modules/wallet/admin.routes.ts
import type { FastifyInstance, RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from '../../db/client';
import { wallets, walletTransactions } from "./schema";
import { users } from "@goldmood/shared-backend/modules/auth/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { adminAdjustSchema, adminStatusSchema, adminTransactionStatusSchema } from "./validation";

const BASE = "/wallets";
const TX_BASE = "/wallet_transactions";

/** Admin: list all wallets (with user email) */
const listWalletsAdmin: RouteHandler = async (req, reply) => {
  const { page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const rows = await db
    .select({
      id: wallets.id,
      user_id: wallets.user_id,
      email: users.email,
      full_name: users.full_name,
      balance: wallets.balance,
      total_earnings: wallets.total_earnings,
      total_withdrawn: wallets.total_withdrawn,
      currency: wallets.currency,
      status: wallets.status,
      created_at: wallets.created_at,
      updated_at: wallets.updated_at,
    })
    .from(wallets)
    .leftJoin(users, eq(wallets.user_id, users.id))
    .orderBy(desc(wallets.created_at))
    .limit(limitNum)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(wallets);

  reply.header("x-total-count", String(count));
  return reply.send({ data: rows, page: pageNum, limit: limitNum, total: count });
};

/** Admin: get single wallet */
const getWalletAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const [row] = await db
    .select({
      id: wallets.id,
      user_id: wallets.user_id,
      email: users.email,
      full_name: users.full_name,
      balance: wallets.balance,
      total_earnings: wallets.total_earnings,
      total_withdrawn: wallets.total_withdrawn,
      currency: wallets.currency,
      status: wallets.status,
      created_at: wallets.created_at,
      updated_at: wallets.updated_at,
    })
    .from(wallets)
    .leftJoin(users, eq(wallets.user_id, users.id))
    .where(eq(wallets.id, req.params.id))
    .limit(1);

  if (!row) return reply.code(404).send({ error: "Wallet not found" });
  return reply.send(row);
};

/** Admin: update wallet status */
const updateWalletStatusAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const parsed = adminStatusSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: "validation_error", issues: parsed.error.issues });

  await db.update(wallets).set({ status: parsed.data.status }).where(eq(wallets.id, req.params.id));
  return reply.send({ success: true });
};

/** Admin: manually adjust wallet balance */
const adjustWalletAdmin: RouteHandler = async (req, reply) => {
  const parsed = adminAdjustSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: "validation_error", issues: parsed.error.issues });

  const { user_id, type, amount, purpose, description, payment_status } = parsed.data;

  // Get or create wallet
  let [wallet] = await db.select().from(wallets).where(eq(wallets.user_id, user_id)).limit(1);
  if (!wallet) {
    const wid = randomUUID();
    await db.insert(wallets).values({ id: wid, user_id });
    [wallet] = await db.select().from(wallets).where(eq(wallets.id, wid)).limit(1);
  }

  const txId = randomUUID();
  await db.insert(walletTransactions).values({
    id: txId,
    wallet_id: wallet.id,
    user_id,
    type,
    amount: amount.toString(),
    purpose,
    description: description ?? null,
    payment_status,
    is_admin_created: 1,
  });

  // Update wallet balance
  if (payment_status === "completed") {
    const current = parseFloat(wallet.balance);
    const newBalance = type === "credit" ? current + amount : Math.max(0, current - amount);
    const updates: Partial<typeof wallet> = { balance: newBalance.toFixed(2) };
    if (type === "credit") {
      updates.total_earnings = (parseFloat(wallet.total_earnings) + amount).toFixed(2) as any;
    } else {
      updates.total_withdrawn = (parseFloat(wallet.total_withdrawn) + amount).toFixed(2) as any;
    }
    await db.update(wallets).set(updates).where(eq(wallets.id, wallet.id));
  }

  return reply.send({ success: true, transaction_id: txId });
};

/** Admin: list transactions for a wallet */
const listTransactionsAdmin: RouteHandler<{ Params: { walletId: string } }> = async (req, reply) => {
  const { page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const rows = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.wallet_id, req.params.walletId))
    .orderBy(desc(walletTransactions.created_at))
    .limit(limitNum)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(walletTransactions)
    .where(eq(walletTransactions.wallet_id, req.params.walletId));

  reply.header("x-total-count", String(count));
  return reply.send({ data: rows, page: pageNum, limit: limitNum, total: count });
};

/** Admin: update transaction payment status */
const updateTransactionStatusAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const parsed = adminTransactionStatusSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: "validation_error", issues: parsed.error.issues });

  const [tx] = await db.select().from(walletTransactions).where(eq(walletTransactions.id, req.params.id)).limit(1);
  if (!tx) return reply.code(404).send({ error: "Transaction not found" });

  const prevStatus = tx.payment_status;
  const newStatus = parsed.data.payment_status;

  await db.update(walletTransactions).set({ payment_status: newStatus }).where(eq(walletTransactions.id, req.params.id));

  // Apply balance change if transitioning to completed
  if (prevStatus !== "completed" && newStatus === "completed") {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, tx.wallet_id)).limit(1);
    if (wallet) {
      const amount = parseFloat(tx.amount);
      const current = parseFloat(wallet.balance);
      const newBalance = tx.type === "credit" ? current + amount : Math.max(0, current - amount);
      const updates: Partial<typeof wallet> = { balance: newBalance.toFixed(2) };
      if (tx.type === "credit") {
        updates.total_earnings = (parseFloat(wallet.total_earnings) + amount).toFixed(2) as any;
      } else {
        updates.total_withdrawn = (parseFloat(wallet.total_withdrawn) + amount).toFixed(2) as any;
      }
      await db.update(wallets).set(updates).where(eq(wallets.id, wallet.id));
    }
  }

  return reply.send({ success: true });
};

export async function registerWalletAdmin(app: FastifyInstance) {
  app.get(BASE, { config: { auth: true } }, listWalletsAdmin);
  app.get(`${BASE}/:id`, { config: { auth: true } }, getWalletAdmin);
  app.patch(`${BASE}/:id/status`, { config: { auth: true } }, updateWalletStatusAdmin);
  app.post(`${BASE}/adjust`, { config: { auth: true } }, adjustWalletAdmin);
  app.get(`${BASE}/:walletId/transactions`, { config: { auth: true } }, listTransactionsAdmin);
  app.patch(`${TX_BASE}/:id/status`, { config: { auth: true } }, updateTransactionStatusAdmin);
}
