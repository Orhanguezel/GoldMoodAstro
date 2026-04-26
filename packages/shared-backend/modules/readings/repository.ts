import { randomUUID } from 'crypto';
import { and, desc, eq, gte } from 'drizzle-orm';
import { db, getPool } from '../../db/client';
import { dailyReadings } from './schema';
import type { BirthChartForReading, DailyReadingRow } from './types';

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoYmd(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export async function getBirthChartForUser(userId: string, chartId: string): Promise<BirthChartForReading | null> {
  const [rows] = await getPool().query(
    'SELECT id, user_id, chart_data FROM birth_charts WHERE id = ? AND user_id = ? LIMIT 1',
    [chartId, userId],
  );
  const row = Array.isArray(rows) ? (rows[0] as any) : null;
  if (!row) return null;
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    chart_data: typeof row.chart_data === 'string' ? JSON.parse(row.chart_data) : row.chart_data,
  };
}

export async function getTodayReading(userId: string, date = todayYmd()) {
  const [row] = await db
    .select()
    .from(dailyReadings)
    .where(and(eq(dailyReadings.user_id, userId), eq(dailyReadings.reading_date, date as never)))
    .limit(1);
  return (row as unknown as DailyReadingRow | undefined) ?? null;
}

export async function listRecentReadings(userId: string, days = 30) {
  const rows = await db
    .select()
    .from(dailyReadings)
    .where(and(eq(dailyReadings.user_id, userId), gte(dailyReadings.reading_date, daysAgoYmd(days) as never)))
    .orderBy(desc(dailyReadings.reading_date));
  return rows as unknown as DailyReadingRow[];
}

export async function insertDailyReading(input: Omit<DailyReadingRow, 'id' | 'created_at' | 'updated_at'>) {
  const id = randomUUID();
  await db
    .insert(dailyReadings)
    .values({
      id,
      user_id: input.user_id,
      chart_id: input.chart_id,
      reading_date: input.reading_date as never,
      content: input.content,
      embedding: input.embedding,
      transits_snapshot: input.transits_snapshot,
      model_used: input.model_used,
    })
    .onDuplicateKeyUpdate({
      set: {
        chart_id: input.chart_id,
        content: input.content,
        embedding: input.embedding,
        transits_snapshot: input.transits_snapshot,
        model_used: input.model_used,
        updated_at: new Date(),
      },
    });

  const row = await getTodayReading(input.user_id, String(input.reading_date));
  if (!row) throw new Error('daily_reading_insert_failed');
  return row;
}
