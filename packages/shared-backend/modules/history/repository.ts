// packages/shared-backend/modules/history/repository.ts
// FAZ 28 / T28-1 — Reading history aggregation + DELETE
import { db } from '../../db/client';
import { sql, type SQL } from 'drizzle-orm';

export type ReadingType =
  | 'tarot'
  | 'coffee'
  | 'dream'
  | 'numerology'
  | 'yildizname'
  | 'synastry';

export const READING_TYPES: ReadingType[] = [
  'tarot',
  'coffee',
  'dream',
  'numerology',
  'yildizname',
  'synastry',
];

export type HistoryRow = {
  type: ReadingType;
  id: string;
  created_at: string;
  title: string;
  snippet: string | null;
};

export async function getUserHistory(
  userId: string,
  limit = 50,
): Promise<HistoryRow[]> {
  // Birleşik UNION — her tip için title + snippet
  const query = sql`
    SELECT 'tarot' as type, id, created_at,
           CONCAT('Tarot · ', spread_type) as title,
           SUBSTRING(interpretation, 1, 140) as snippet
    FROM tarot_readings
    WHERE user_id = ${userId}

    UNION ALL

    SELECT 'coffee' as type, id, created_at,
           'Kahve Falı' as title,
           SUBSTRING(interpretation, 1, 140) as snippet
    FROM coffee_readings
    WHERE user_id = ${userId}

    UNION ALL

    SELECT 'dream' as type, id, created_at,
           'Rüya Tabiri' as title,
           SUBSTRING(COALESCE(interpretation, dream_text), 1, 140) as snippet
    FROM dream_interpretations
    WHERE user_id = ${userId}

    UNION ALL

    SELECT 'numerology' as type, id, created_at,
           CONCAT('Numeroloji · ', full_name) as title,
           SUBSTRING(interpretation, 1, 140) as snippet
    FROM numerology_readings
    WHERE user_id = ${userId}

    UNION ALL

    SELECT 'yildizname' as type, yildizname_readings.id, yildizname_readings.created_at,
           CONCAT('Yıldızname · ', COALESCE(yildizname_results.name_tr, CONCAT('Menzil ', yildizname_readings.menzil_no))) as title,
           SUBSTRING(yildizname_readings.result_text, 1, 140) as snippet
    FROM yildizname_readings
    LEFT JOIN yildizname_results ON yildizname_results.menzil_no = yildizname_readings.menzil_no
    WHERE yildizname_readings.user_id = ${userId}

    UNION ALL

    SELECT 'synastry' as type, id, created_at,
           CONCAT('Sinastri · ', mode) as title,
           NULL as snippet
    FROM synastry_reports
    WHERE user_id = ${userId}

    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  const result = await db.execute(query);
  const rows = Array.isArray((result as unknown as unknown[])?.[0])
    ? ((result as unknown as unknown[])[0] as HistoryRow[])
    : (result as unknown as HistoryRow[]);
  return rows ?? [];
}

// Per-type DELETE — tablo adı whitelist'ten gelir, id+userId parametreli
function deleteQuery(type: ReadingType, id: string, userId: string): SQL<unknown> {
  switch (type) {
    case 'tarot':
      return sql`DELETE FROM tarot_readings WHERE id = ${id} AND user_id = ${userId}`;
    case 'coffee':
      return sql`DELETE FROM coffee_readings WHERE id = ${id} AND user_id = ${userId}`;
    case 'dream':
      return sql`DELETE FROM dream_interpretations WHERE id = ${id} AND user_id = ${userId}`;
    case 'numerology':
      return sql`DELETE FROM numerology_readings WHERE id = ${id} AND user_id = ${userId}`;
    case 'yildizname':
      return sql`DELETE FROM yildizname_readings WHERE id = ${id} AND user_id = ${userId}`;
    case 'synastry':
      return sql`DELETE FROM synastry_reports WHERE id = ${id} AND user_id = ${userId}`;
  }
}

function deleteAllForTypeQuery(type: ReadingType, userId: string): SQL<unknown> {
  switch (type) {
    case 'tarot':
      return sql`DELETE FROM tarot_readings WHERE user_id = ${userId}`;
    case 'coffee':
      return sql`DELETE FROM coffee_readings WHERE user_id = ${userId}`;
    case 'dream':
      return sql`DELETE FROM dream_interpretations WHERE user_id = ${userId}`;
    case 'numerology':
      return sql`DELETE FROM numerology_readings WHERE user_id = ${userId}`;
    case 'yildizname':
      return sql`DELETE FROM yildizname_readings WHERE user_id = ${userId}`;
    case 'synastry':
      return sql`DELETE FROM synastry_reports WHERE user_id = ${userId}`;
  }
}

export async function deleteReading(
  userId: string,
  type: ReadingType,
  id: string,
): Promise<boolean> {
  const result: any = await db.execute(deleteQuery(type, id, userId));
  // mysql2 returns ResultSetHeader as first element of array
  const header = Array.isArray(result) ? result[0] : result;
  return Boolean(header?.affectedRows);
}

export async function deleteAllReadings(
  userId: string,
): Promise<{ deleted: Record<ReadingType, number>; total: number }> {
  const deleted: Record<ReadingType, number> = {
    tarot: 0,
    coffee: 0,
    dream: 0,
    numerology: 0,
    yildizname: 0,
    synastry: 0,
  };

  for (const type of READING_TYPES) {
    const result: any = await db.execute(deleteAllForTypeQuery(type, userId));
    const header = Array.isArray(result) ? result[0] : result;
    deleted[type] = header?.affectedRows ?? 0;
  }

  const total = Object.values(deleted).reduce((a, b) => a + b, 0);
  return { deleted, total };
}

/**
 * Consultant tarafı: müşterinin son N okumasını snippet ile göster.
 * Yetkilendirme controller'da (consultant role + booking owner).
 */
export async function getRecentReadingsForConsultant(
  customerUserId: string,
  limit = 10,
): Promise<HistoryRow[]> {
  return getUserHistory(customerUserId, limit);
}
