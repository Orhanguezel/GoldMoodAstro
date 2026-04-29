// packages/shared-backend/modules/tarot/repository.ts
import { db } from '../../db/client';
import { eq, and, desc } from 'drizzle-orm';
import { tarotCards, tarotReadings } from './schema';

export async function getCards() {
  return db.select().from(tarotCards);
}

export async function getCardById(id: string) {
  const rows = await db.select().from(tarotCards).where(eq(tarotCards.id, id)).limit(1);
  return rows[0] || null;
}

export async function getCardBySlug(slug: string) {
  const rows = await db.select().from(tarotCards).where(eq(tarotCards.slug, slug)).limit(1);
  return rows[0] || null;
}

export async function createReading(data: any) {
  await db.insert(tarotReadings).values(data);
  return data;
}

export async function getReadingsByUser(userId: string) {
  return db.select()
    .from(tarotReadings)
    .where(eq(tarotReadings.userId, userId))
    .orderBy(desc(tarotReadings.createdAt));
}

export async function getReadingById(id: string) {
  const rows = await db.select().from(tarotReadings).where(eq(tarotReadings.id, id)).limit(1);
  return rows[0] || null;
}
