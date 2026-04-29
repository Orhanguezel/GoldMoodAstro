// packages/shared-backend/modules/auth/deletion.repository.ts
import { db } from '../../db/client';
import { eq, and } from 'drizzle-orm';
import { accountDeletionRequests } from './deletion.schema';

export async function createDeletionRequest(data: any) {
  await db.insert(accountDeletionRequests).values(data);
  return data;
}

export async function getActiveRequest(userId: string) {
  const rows = await db.select()
    .from(accountDeletionRequests)
    .where(and(
      eq(accountDeletionRequests.userId, userId),
      eq(accountDeletionRequests.status, 'pending')
    ))
    .limit(1);
  return rows[0] || null;
}

export async function cancelRequest(id: string) {
  await db.update(accountDeletionRequests)
    .set({
      status: 'cancelled',
      cancelledAt: new Date()
    })
    .where(eq(accountDeletionRequests.id, id));
}
