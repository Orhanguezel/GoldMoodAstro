// FAZ 24 / T24-1
import { db } from '../../db/client';
import { eq, and, desc } from 'drizzle-orm';
import { yildiznameResults, yildiznameResultsI18n, yildiznameReadings } from './schema';

function normLocale(locale?: string | null): string {
  return String(locale ?? 'tr').trim().toLowerCase().split(/[-_]/)[0] || 'tr';
}

export async function getResultByMenzil(menzilNo: number, locale?: string | null) {
  const rows = await db
    .select()
    .from(yildiznameResults)
    .where(eq(yildiznameResults.menzilNo, menzilNo))
    .limit(1);
  const base = rows[0] || null;
  if (!base) return null;

  const loc = normLocale(locale);
  if (loc === 'tr') return base;

  // en/de çevirisi varsa name/short_summary/content override; yoksa tr'ye düş
  const i18nRows = await db
    .select()
    .from(yildiznameResultsI18n)
    .where(and(eq(yildiznameResultsI18n.menzilNo, menzilNo), eq(yildiznameResultsI18n.locale, loc)))
    .limit(1);
  const tr = i18nRows[0];
  if (!tr) return base;

  return {
    ...base,
    nameTr: tr.name || base.nameTr,
    shortSummary: tr.shortSummary || base.shortSummary,
    content: tr.content || base.content,
  };
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
