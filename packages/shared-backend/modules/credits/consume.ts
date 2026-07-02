// =============================================================
// FAZ 25 / T25-3 — Reusable credit consume helper
// İlerideki tüm "premium feature paywall"larında bu helper kullanılır.
// (synastry, premium readings, video call top-up, vb.)
// =============================================================
import { randomUUID } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { userCredits, creditTransactions } from './schema';
import { hasPremiumSubscription } from '../subscriptions/summary';

export type ConsumeResult =
  | { status: 'consumed'; amount: number; balance_after: number }
  | { status: 'already_consumed'; reference_id: string }
  | { status: 'insufficient'; required: number; available: number }
  | { status: 'free'; reason: 'subscription' | 'no_charge' };

export type ConsumeArgs = {
  userId: string;
  amount: number;                              // Pozitif tam sayı (kredi adedi)
  referenceType: string;                       // 'synastry_manual', 'premium_reading' vb.
  referenceId: string;                         // İdempotency anahtarı (aynı referanstan iki kez düşülmez)
  description?: string;
};

export type RefundArgs = {
  userId: string;
  amount: number;
  referenceType: string;
  referenceId: string;
  description?: string;
};

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  return hasPremiumSubscription(userId);
}

function affectedRows(result: unknown): number {
  return Number((result as any)?.[0]?.affectedRows ?? (result as any)?.affectedRows ?? 0);
}

function isDuplicate(err: unknown): boolean {
  const anyErr = err as any;
  return anyErr?.code === 'ER_DUP_ENTRY' || String(anyErr?.message || '').includes('Duplicate');
}

/**
 * Atomik credit düşürme — transaction içinde.
 * - referenceId daha önce consume edildiyse `already_consumed` döner (idempotent)
 * - balance < amount → `insufficient`, kayıt oluşturulmaz
 * - amount <= 0 → `free` (no_charge)
 */
export async function consumeCredits(args: ConsumeArgs): Promise<ConsumeResult> {
  if (args.amount <= 0) {
    return { status: 'free', reason: 'no_charge' };
  }

  return await db.transaction(async (tx) => {
    await tx.execute(sql`
      INSERT INTO user_credits (id, user_id, balance, currency, created_at, updated_at)
      VALUES (${randomUUID()}, ${args.userId}, 0, 'TRY-CREDIT', NOW(3), NOW(3))
      ON DUPLICATE KEY UPDATE updated_at = updated_at
    `);

    const updateResult = await tx.execute(sql`
      UPDATE user_credits
      SET balance = balance - ${args.amount}, updated_at = NOW(3)
      WHERE user_id = ${args.userId} AND balance >= ${args.amount}
    `);

    if (affectedRows(updateResult) < 1) {
      const [wallet] = await tx.select().from(userCredits).where(eq(userCredits.userId, args.userId)).limit(1);
      return {
        status: 'insufficient' as const,
        required: args.amount,
        available: Number(wallet?.balance ?? 0),
      };
    }

    const [wallet] = await tx.select().from(userCredits).where(eq(userCredits.userId, args.userId)).limit(1);
    const balanceAfter = Number(wallet?.balance ?? 0);

    try {
      await tx.insert(creditTransactions).values({
        id: randomUUID(),
        userId: args.userId,
        type: 'consumption',
        amount: -args.amount,
        balanceAfter,
        referenceType: args.referenceType,
        referenceId: args.referenceId,
        orderId: null,
        description: args.description ?? null,
      } as any);
    } catch (err) {
      if (!isDuplicate(err)) throw err;
      await tx.execute(sql`
        UPDATE user_credits
        SET balance = balance + ${args.amount}, updated_at = NOW(3)
        WHERE user_id = ${args.userId}
      `);
      return { status: 'already_consumed' as const, reference_id: args.referenceId };
    }

    return {
      status: 'consumed' as const,
      amount: args.amount,
      balance_after: balanceAfter,
    };
  });
}

export async function refundCredits(args: RefundArgs) {
  if (args.amount <= 0) return { status: 'free' as const };

  return await db.transaction(async (tx) => {
    try {
      await tx.insert(creditTransactions).values({
        id: randomUUID(),
        userId: args.userId,
        type: 'refund',
        amount: args.amount,
        balanceAfter: 0,
        referenceType: args.referenceType,
        referenceId: args.referenceId,
        orderId: null,
        description: args.description ?? null,
      } as any);
    } catch (err) {
      if (!isDuplicate(err)) throw err;
      const [wallet] = await tx.select().from(userCredits).where(eq(userCredits.userId, args.userId)).limit(1);
      return { status: 'already_refunded' as const, balance: Number(wallet?.balance ?? 0) };
    }

    await tx.execute(sql`
      INSERT INTO user_credits (id, user_id, balance, currency, created_at, updated_at)
      VALUES (${randomUUID()}, ${args.userId}, 0, 'TRY-CREDIT', NOW(3), NOW(3))
      ON DUPLICATE KEY UPDATE updated_at = updated_at
    `);

    const updateResult = await tx.execute(sql`
      UPDATE user_credits
      SET balance = balance + ${args.amount}, updated_at = NOW(3)
      WHERE user_id = ${args.userId}
    `);
    if (affectedRows(updateResult) < 1) throw new Error('credit_refund_failed');

    const [wallet] = await tx.select().from(userCredits).where(eq(userCredits.userId, args.userId)).limit(1);
    const balanceAfter = Number(wallet?.balance ?? 0);
    await tx
      .update(creditTransactions)
      .set({ balanceAfter })
      .where(eq(creditTransactions.referenceId, args.referenceId));

    return { status: 'refunded' as const, balance: balanceAfter };
  });
}
