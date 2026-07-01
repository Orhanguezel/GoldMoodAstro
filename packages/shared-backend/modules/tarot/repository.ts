// packages/shared-backend/modules/tarot/repository.ts
import { db } from '../../db/client';
import { eq, and, desc } from 'drizzle-orm';
import { tarotCards, tarotReadings } from './schema';

function normalizeLocale(locale?: string | null): string {
  const normalized = String(locale || 'tr').trim().toLowerCase().split('-')[0];
  return normalized || 'tr';
}

function mapCard(row: any) {
  return {
    ...row,
    nameTr: row.nameTr ?? row.name_tr,
    nameEn: row.nameEn ?? row.name_en,
    uprightMeaning: row.uprightMeaning ?? row.upright_meaning,
    reversedMeaning: row.reversedMeaning ?? row.reversed_meaning,
    imageUrl: row.imageUrl ?? row.image_url,
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
  };
}

export async function getCards(locale = 'tr') {
  const normalized = normalizeLocale(locale);
  const [rows] = await (db as any).session.client.query(
    `SELECT c.*,
      COALESCE(req_i18n.name, tr_i18n.name, IF(? = 'en', c.name_en, c.name_tr), c.name_tr) AS name,
      COALESCE(req_i18n.upright_meaning, tr_i18n.upright_meaning, c.upright_meaning) AS upright_meaning_resolved,
      COALESCE(req_i18n.reversed_meaning, tr_i18n.reversed_meaning, c.reversed_meaning) AS reversed_meaning_resolved,
      COALESCE(req_i18n.keywords, tr_i18n.keywords, c.keywords) AS keywords_resolved
     FROM tarot_cards c
     LEFT JOIN tarot_card_i18n req_i18n ON req_i18n.card_id = c.id AND req_i18n.locale = ?
     LEFT JOIN tarot_card_i18n tr_i18n ON tr_i18n.card_id = c.id AND tr_i18n.locale = 'tr'`,
    [normalized, normalized],
  );
  return (rows as any[]).map((row) => mapCard({
    ...row,
    uprightMeaning: row.upright_meaning_resolved,
    reversedMeaning: row.reversed_meaning_resolved,
    keywords: row.keywords_resolved,
  }));
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
