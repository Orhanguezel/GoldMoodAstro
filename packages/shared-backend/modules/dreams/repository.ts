// packages/shared-backend/modules/dreams/repository.ts
import { db } from '../../db/client';
import { eq, desc } from 'drizzle-orm';
import { dreamSymbols, dreamInterpretations } from './schema';

function normalizeLocale(locale?: string | null): string {
  const normalized = String(locale || 'tr').trim().toLowerCase().split('-')[0];
  return normalized || 'tr';
}

function mapSymbol(row: any) {
  return {
    ...row,
    nameTr: row.nameTr ?? row.name_tr,
    meaning: row.meaning_resolved ?? row.meaning,
    name: row.name_resolved ?? row.name ?? row.name_tr,
    createdAt: row.createdAt ?? row.created_at,
  };
}

export async function getSymbols(locale = 'tr') {
  const normalized = normalizeLocale(locale);
  const [rows] = await (db as any).session.client.query(
    `SELECT s.*,
      COALESCE(req_i18n.name, tr_i18n.name, s.name_tr) AS name_resolved,
      COALESCE(req_i18n.meaning, tr_i18n.meaning, s.meaning) AS meaning_resolved,
      COALESCE(req_i18n.category, tr_i18n.category, s.category) AS category_resolved
     FROM dream_symbols s
     LEFT JOIN dream_symbol_i18n req_i18n ON req_i18n.symbol_id = s.id AND req_i18n.locale = ?
     LEFT JOIN dream_symbol_i18n tr_i18n ON tr_i18n.symbol_id = s.id AND tr_i18n.locale = 'tr'`,
    [normalized],
  );
  return (rows as any[]).map((row) => mapSymbol({
    ...row,
    category: row.category_resolved,
  }));
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
