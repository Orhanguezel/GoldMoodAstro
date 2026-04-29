// packages/shared-backend/modules/dreams/repository.ts
import { db } from '../../db/client';
import { eq, desc } from 'drizzle-orm';
import { dreamSymbols, dreamInterpretations } from './schema';

export async function getSymbols() {
  return db.select().from(dreamSymbols);
}

export async function createInterpretation(data: any) {
  await db.insert(dreamInterpretations).values(data);
  return data;
}

export async function getInterpretationsByUser(userId: string) {
  return db.select()
    .from(dreamInterpretations)
    .where(eq(dreamInterpretations.userId, userId))
    .orderBy(desc(dreamInterpretations.createdAt));
}

export async function getInterpretationById(id: string) {
  const rows = await db.select().from(dreamInterpretations).where(eq(dreamInterpretations.id, id)).limit(1);
  return rows[0] || null;
}
