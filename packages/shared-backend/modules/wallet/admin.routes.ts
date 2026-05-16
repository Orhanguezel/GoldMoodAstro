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
const DEPOSITS_BASE = "/wallet_deposits";

/** Deposit predicate: kullanıcı kaynaklı para yükleme talebi (kazanç/adjust değil) */
function isDepositRow(tx: { type: string; is_admin_created: number }) {
  return tx.type === "credit" && Number(tx.is_admin_created) === 0;
}
function appendDesc(prev: string | null, note: string) {
  return prev && prev.trim() ? `${prev}\n${note}` : note;
}

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

/** Admin: list deposit requests (type=credit & user-initiated). FAZ wallet-deposits §v1 */
const listWalletDepositsAdmin: RouteHandler = async (req, reply) => {
  const q = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(q.page ?? "1", 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(q.limit ?? "20", 10)));
  const offset = (pageNum - 1) * limitNum;

  const conds = [
    eq(walletTransactions.type, "credit"),
    eq(walletTransactions.is_admin_created, 0),
  ];
  if (q.payment_status && ["pending", "completed", "failed", "refunded"].includes(q.payment_status)) {
    conds.push(eq(walletTransactions.payment_status, q.payment_status as any));
  }
  if (q.user_id) conds.push(eq(walletTransactions.user_id, q.user_id));
  const whereCond = and(...conds);

  const rows = await db
    .select({
      id: walletTransactions.id,
      wallet_id: walletTransactions.wallet_id,
      user_id: walletTransactions.user_id,
      type: walletTransactions.type,
      amount: walletTransactions.amount,
      currency: walletTransactions.currency,
      purpose: walletTransactions.purpose,
      description: walletTransactions.description,
      payment_status: walletTransactions.payment_status,
      transaction_ref: walletTransactions.transaction_ref,
      is_admin_created: walletTransactions.is_admin_created,
      created_at: walletTransactions.created_at,
      user_email: users.email,
      user_full_name: users.full_name,
    })
    .from(walletTransactions)
    .leftJoin(users, eq(walletTransactions.user_id, users.id))
    .where(whereCond)
    .orderBy(desc(walletTransactions.created_at))
    .limit(limitNum)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(walletTransactions)
    .where(whereCond);

  reply.header("x-total-count", String(count));
  return reply.send({ data: rows, page: pageNum, limit: limitNum, total: count });
};

/** Admin: approve deposit — idempotent, atomik (pending→completed + bakiye). */
const approveWalletDepositAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const adminId = (req as any).user?.sub ?? (req as any).user?.id ?? "admin";
  const [tx] = await db.select().from(walletTransactions).where(eq(walletTransactions.id, req.params.id)).limit(1);
  if (!tx) return reply.code(404).send({ error: "deposit_not_found" });
  if (!isDepositRow(tx)) return reply.code(400).send({ error: "not_a_deposit" });
  if (tx.payment_status === "completed") return reply.send({ success: true, idempotent: true });
  if (tx.payment_status !== "pending") return reply.code(409).send({ error: "invalid_transition", from: tx.payment_status });
  const amount = parseFloat(tx.amount);
  if (!Number.isFinite(amount) || amount <= 0) return reply.code(400).send({ error: "invalid_amount" });

  await db.transaction(async (trx) => {
    // Re-read in-tx; yalnız hâlâ pending ise işle (çift kredi koruması)
    const [cur] = await trx.select().from(walletTransactions).where(eq(walletTransactions.id, tx.id)).limit(1);
    if (!cur || cur.payment_status !== "pending") return;
    await trx
      .update(walletTransactions)
      .set({
        payment_status: "completed",
        description: appendDesc(cur.description, `[approved by ${adminId} @ ${new Date().toISOString()}]`),
      })
      .where(eq(walletTransactions.id, tx.id));
    const [wallet] = await trx.select().from(wallets).where(eq(wallets.id, tx.wallet_id)).limit(1);
    if (wallet) {
      const newBalance = (parseFloat(wallet.balance) + amount).toFixed(2);
      await trx.update(wallets).set({ balance: newBalance }).where(eq(wallets.id, wallet.id));
    }
  });

  return reply.send({ success: true });
};

/** Admin: reject deposit — idempotent, bakiye DEĞİŞMEZ. */
const rejectWalletDepositAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const adminId = (req as any).user?.sub ?? (req as any).user?.id ?? "admin";
  const reason = ((req.body as any)?.reason ?? "").toString().slice(0, 500);
  const [tx] = await db.select().from(walletTransactions).where(eq(walletTransactions.id, req.params.id)).limit(1);
  if (!tx) return reply.code(404).send({ error: "deposit_not_found" });
  if (!isDepositRow(tx)) return reply.code(400).send({ error: "not_a_deposit" });
  if (tx.payment_status === "failed" || tx.payment_status === "refunded") {
    return reply.send({ success: true, idempotent: true });
  }
  if (tx.payment_status === "completed") return reply.code(409).send({ error: "already_completed" });

  await db
    .update(walletTransactions)
    .set({
      payment_status: "failed",
      description: appendDesc(tx.description, `[rejected${reason ? `: ${reason}` : ""} by ${adminId} @ ${new Date().toISOString()}]`),
    })
    .where(eq(walletTransactions.id, tx.id));

  return reply.send({ success: true });
};

export async function registerWalletAdmin(app: FastifyInstance) {
  app.get(BASE, { config: { auth: true } }, listWalletsAdmin);
  app.get(`${BASE}/:id`, { config: { auth: true } }, getWalletAdmin);
  app.patch(`${BASE}/:id/status`, { config: { auth: true } }, updateWalletStatusAdmin);
  app.post(`${BASE}/adjust`, { config: { auth: true } }, adjustWalletAdmin);
  app.get(`${BASE}/:walletId/transactions`, { config: { auth: true } }, listTransactionsAdmin);
  app.patch(`${TX_BASE}/:id/status`, { config: { auth: true } }, updateTransactionStatusAdmin);
  // wallet-deposits §v1 (deposit onay/red iş akışı)
  app.get(DEPOSITS_BASE, { config: { auth: true } }, listWalletDepositsAdmin);
  app.post(`${DEPOSITS_BASE}/:id/approve`, { config: { auth: true } }, approveWalletDepositAdmin);
  app.post(`${DEPOSITS_BASE}/:id/reject`, { config: { auth: true } }, rejectWalletDepositAdmin);
}
