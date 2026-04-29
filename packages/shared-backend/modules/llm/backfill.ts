// =============================================================
// FAZ 19 / T19-5 — Embedding backfill helpers
// Mevcut text alanlarını embedding'e çevirip JSON kolonlarına yazar.
// Hedef tablolar: astrology_kb, daily_horoscopes, tarot_readings,
//                 coffee_readings, dream_interpretations, yildizname_readings.
//
// Kullanım: admin endpoint POST /admin/embeddings/backfill
//          Body: { table: 'astrology_kb', limit: 100 }
// =============================================================
import { db } from '../../db/client';
import { embedBulk, isEmbeddingAvailable } from './embedding';

const SUPPORTED_TABLES = [
  'astrology_kb',
  'daily_horoscopes',
  'tarot_readings',
  'coffee_readings',
  'dream_interpretations',
] as const;

export type BackfillTable = (typeof SUPPORTED_TABLES)[number];

/** Tablo başına embedding'lenecek text alanı + UNIQUE id alanı eşleşmeleri */
const TABLE_MAP: Record<BackfillTable, { textCol: string; idCol: string }> = {
  astrology_kb:        { textCol: 'content',        idCol: 'id' },
  daily_horoscopes:    { textCol: 'content',        idCol: 'id' },
  tarot_readings:      { textCol: 'interpretation', idCol: 'id' },
  coffee_readings:     { textCol: 'interpretation', idCol: 'id' },
  dream_interpretations: { textCol: 'interpretation', idCol: 'id' },
};

export type BackfillResult = {
  table: BackfillTable;
  scanned: number;
  embedded: number;
  failed: number;
  skipped_no_text: number;
};

/**
 * Belirli tablo için embedding'i NULL olan satırları bul, batch'le embed et,
 * JSON kolonuna yaz. `limit` ile rate-limit kontrolü.
 */
export async function backfillEmbeddings(
  table: BackfillTable,
  opts: { limit?: number } = {},
): Promise<BackfillResult> {
  if (!isEmbeddingAvailable()) {
    throw new Error('embedding_provider_not_configured');
  }
  const map = TABLE_MAP[table];
  if (!map) throw new Error(`unsupported_table: ${table}`);

  const limit = Math.max(1, Math.min(opts.limit ?? 50, 200));

  // 1) Eksik embedding'i olan satırları çek
  const [rows] = await (db as any).session.client.query(
    `SELECT \`${map.idCol}\` AS id, \`${map.textCol}\` AS text
     FROM \`${table}\`
     WHERE embedding IS NULL AND \`${map.textCol}\` IS NOT NULL AND CHAR_LENGTH(\`${map.textCol}\`) > 30
     LIMIT ?`,
    [limit],
  );

  const items = rows as Array<{ id: string; text: string | null }>;
  const result: BackfillResult = {
    table,
    scanned: items.length,
    embedded: 0,
    failed: 0,
    skipped_no_text: 0,
  };

  if (!items.length) return result;

  // 2) Boş/kısa metinleri ele
  const validItems = items.filter((r) => {
    if (!r.text || r.text.trim().length < 30) {
      result.skipped_no_text++;
      return false;
    }
    return true;
  });

  if (!validItems.length) return result;

  // 3) Bulk embed (OpenAI 1 API call)
  let vectors;
  try {
    vectors = await embedBulk(validItems.map((r) => r.text!));
  } catch (err) {
    console.error('[backfill] embedBulk failed', err);
    result.failed = validItems.length;
    return result;
  }

  // 4) Her satıra JSON yaz (paralel UPDATE — küçük batch için sorun değil)
  for (let i = 0; i < validItems.length; i++) {
    try {
      await (db as any).session.client.query(
        `UPDATE \`${table}\` SET embedding = ? WHERE \`${map.idCol}\` = ?`,
        [JSON.stringify(vectors[i]), validItems[i].id],
      );
      result.embedded++;
    } catch (err) {
      result.failed++;
      console.warn('[backfill] update_failed', { id: validItems[i].id, err });
    }
  }

  return result;
}

/** Tüm tabloları sırayla backfill et — uzun sürer, manuel admin trigger'la çağrılır. */
export async function backfillAllTables(opts: { perTableLimit?: number } = {}): Promise<BackfillResult[]> {
  const results: BackfillResult[] = [];
  for (const t of SUPPORTED_TABLES) {
    try {
      const r = await backfillEmbeddings(t, { limit: opts.perTableLimit ?? 50 });
      results.push(r);
    } catch (err) {
      console.warn(`[backfill] table_failed ${t}`, err);
      results.push({ table: t, scanned: 0, embedded: 0, failed: -1, skipped_no_text: 0 });
    }
  }
  return results;
}

export { SUPPORTED_TABLES };
