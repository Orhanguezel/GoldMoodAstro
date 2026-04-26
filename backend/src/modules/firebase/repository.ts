import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@goldmood/shared-backend/modules/auth/schema';

export async function saveFcmToken(userId: string, token: string) {
  await db
    .update(users)
    .set({ fcm_token: token, updated_at: new Date() } as any)
    .where(eq(users.id, userId));

  const [row] = await db
    .select({ id: users.id, fcm_token: users.fcm_token })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return row ?? null;
}
