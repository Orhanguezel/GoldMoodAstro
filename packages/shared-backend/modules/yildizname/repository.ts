// FAZ 24 / T24-1
import { db } from '../../db/client';
import { eq, desc } from 'drizzle-orm';
import { yildiznameResults, yildiznameReadings } from './schema';

export async function getResultByMenzil(menzilNo: number) {
  const rows = await db
    .select()
    .from(yildiznameResults)
    .where(eq(yildiznameResults.menzilNo, menzilNo))
    .limit(1);
  return rows[0] || null;
}

export async function getAllResults() {
  return db.select().from(yildiznameResults);
}

export async function createReading(data: typeof yildiznameReadings.$inferInsert) {
  await db.insert(yildiznameReadings).values(data);
  return data;
}

export async function getReadingsByUser(userId: string) {
  return db
    .select()
    .from(yildiznameReadings)
    .where(eq(yildiznameReadings.userId, userId))
    .orderBy(desc(yildiznameReadings.createdAt));
}

export async function getReadingById(id: string) {
  const rows = await db
    .select({
      reading: yildiznameReadings,
      menzil: yildiznameResults,
    })
    .from(yildiznameReadings)
    .leftJoin(yildiznameResults, eq(yildiznameReadings.menzilNo, yildiznameResults.menzilNo))
    .where(eq(yildiznameReadings.id, id))
    .limit(1);

  if (!rows[0]) return null;

  return {
    ...rows[0].reading,
    menzil: rows[0].menzil,
  };
}
