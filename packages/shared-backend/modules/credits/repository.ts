// packages/shared-backend/modules/credits/repository.ts
import { db } from '../../db/client';
import { eq, and, desc, sql as drizzleSql } from 'drizzle-orm';
import { creditPackages, userCredits, creditTransactions } from './schema';
import { v4 as uuidv4 } from 'uuid';

export async function listActivePackages() {
  return db.select()
    .from(creditPackages)
    .where(eq(creditPackages.isActive, 1))
    .orderBy(creditPackages.displayOrder);
}

export async function getPackageById(id: string) {
  const rows = await db.select().from(creditPackages).where(eq(creditPackages.id, id)).limit(1);
  return rows[0] || null;
}

export async function getUserBalance(userId: string) {
  const rows = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
  if (rows.length === 0) {
    // Create record if not exists
    const id = uuidv4();
    await db.insert(userCredits).values({ id, userId, balance: 0 });
    return { userId, balance: 0 };
  }
  return rows[0];
}

export async function addCredits(userId: string, amount: number, type: any, reference: { type?: string, id?: string, orderId?: string, description?: string }) {
  return db.transaction(async (tx) => {
    // 1) Get current balance
    const rows = await tx.select().from(userCredits).where(eq(userCredits.userId, userId));
    let currentBalance = 0;
    let balanceId = uuidv4();

    if (rows.length > 0) {
      currentBalance = rows[0].balance;
      balanceId = rows[0].id;
    }

    const newBalance = currentBalance + amount;

    // 2) Update balance
    if (rows.length > 0) {
      await tx.update(userCredits).set({ balance: newBalance }).where(eq(userCredits.id, balanceId));
    } else {
      await tx.insert(userCredits).values({ id: balanceId, userId, balance: newBalance });
    }

    // 3) Log transaction
    const txId = uuidv4();
    await tx.insert(creditTransactions).values({
      id: txId,
      userId,
      type,
      amount,
      balanceAfter: newBalance,
      referenceType: reference.type,
      referenceId: reference.id,
      orderId: reference.orderId,
      description: reference.description
    });

    return { balance: newBalance };
  });
}

export async function getTransactionHistory(userId: string) {
  return db.select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(50);
}
