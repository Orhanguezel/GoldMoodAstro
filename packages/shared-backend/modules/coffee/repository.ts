// packages/shared-backend/modules/coffee/repository.ts
import { db } from '../../db/client';
import { eq, and, desc } from 'drizzle-orm';
import { coffeeSymbols, coffeeReadings } from './schema';

export async function getSymbols() {
  return db.select().from(coffeeSymbols);
}

export async function getSymbolBySlug(slug: string) {
  const rows = await db.select().from(coffeeSymbols).where(eq(coffeeSymbols.slug, slug)).limit(1);
  return rows[0] || null;
}

export async function createReading(data: any) {
  await db.insert(coffeeReadings).values(data);
  return data;
}

export async function updateReading(id: string, data: any) {
  await db.update(coffeeReadings).set(data).where(eq(coffeeReadings.id, id));
}

export async function getReadingsByUser(userId: string) {
  return db.select()
    .from(coffeeReadings)
    .where(eq(coffeeReadings.userId, userId))
    .orderBy(desc(coffeeReadings.createdAt));
}

export async function getReadingById(id: string) {
  const rows = await db.select().from(coffeeReadings).where(eq(coffeeReadings.id, id)).limit(1);
  return rows[0] || null;
}
