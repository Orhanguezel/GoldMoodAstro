// packages/shared-backend/modules/numerology/repository.ts
import { db } from '../../db/client';
import { eq, desc } from 'drizzle-orm';
import { numerologyReadings } from './schema';

export async function createReading(data: any) {
  await db.insert(numerologyReadings).values(data);
  return data;
}

export async function getReadingsByUser(userId: string) {
  return db.select()
    .from(numerologyReadings)
    .where(eq(numerologyReadings.userId, userId))
    .orderBy(desc(numerologyReadings.createdAt));
}

export async function getReadingById(id: string) {
  const rows = await db.select().from(numerologyReadings).where(eq(numerologyReadings.id, id)).limit(1);
  return rows[0] || null;
}
