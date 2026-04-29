// =============================================================
// FAZ 25 / T25-3 — Reusable credit consume helper
// İlerideki tüm "premium feature paywall"larında bu helper kullanılır.
// (synastry, premium readings, video call top-up, vb.)
// =============================================================
import { randomUUID } from 'crypto';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { userCredits, creditTransactions } from './schema';

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

/**
 * Aktif (status='active') ve süresi geçmemiş subscription var mı?
 * Bu helper'ı `consumeCredits`'in içinden çağırmıyoruz — caller karar versin
 * (bazı feature'lar subscription'a rağmen kredi tükettirebilir).
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const [rows] = await (db as any).session.client.query(
    `SELECT 1 FROM subscriptions
     WHERE user_id = ? AND status = 'active'
       AND (ends_at IS NULL OR ends_at > NOW())
     LIMIT 1`,
    [userId],
  );
  return Array.isArray(rows) && rows.length > 0;
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
    // 1) Idempotency: aynı referans önceden consume edilmiş mi?
    const [existing] = await tx
      .select({ id: creditTransactions.id })
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.referenceType, args.referenceType),
          eq(creditTransactions.referenceId, args.referenceId),
          eq(creditTransactions.type, 'consumption'),
        ),
      )
      .limit(1);
    if (existing) {
      return { status: 'already_consumed' as const, reference_id: args.referenceId };
    }

    // 2) Wallet (yoksa oluştur, balance=0)
    let [wallet] = await tx
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, args.userId))
      .limit(1);

    if (!wallet) {
      const walletId = randomUUID();
      await tx.insert(userCredits).values({
        id: walletId,
        userId: args.userId,
        balance: 0,
      } as any);
      [wallet] = await tx
        .select()
        .from(userCredits)
        .where(eq(userCredits.id, walletId))
        .limit(1);
    }

    const currentBalance = Number(wallet?.balance ?? 0);
    if (currentBalance < args.amount) {
      return {
        status: 'insufficient' as const,
        required: args.amount,
        available: currentBalance,
      };
    }

    // 3) Düş + tx kaydı
    const balanceAfter = currentBalance - args.amount;
    await tx
      .update(userCredits)
      .set({ balance: balanceAfter, updatedAt: new Date() })
      .where(eq(userCredits.id, wallet!.id));

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

    return {
      status: 'consumed' as const,
      amount: args.amount,
      balance_after: balanceAfter,
    };
  });
}
