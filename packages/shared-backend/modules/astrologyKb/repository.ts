// =============================================================
// FILE: modules/astrologyKb/repository.ts
// FAZ 19 / T19-3 — DB ops for astrology_kb (admin CRUD + bulk)
// =============================================================
import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import type {
  KbBulkImportInput,
  KbCreateInput,
  KbListParams,
  KbTranslationDraftInput,
  KbUpdateInput,
} from "./validation";

export type AstrologyKbView = {
  id: string;
  kind: string;
  key1: string;
  key2: string | null;
  key3: string | null;
  locale: string;
  title: string;
  content: string;
  short_summary: string | null;
  tone: string;
  source: string | null;
  author: string | null;
  is_active: boolean;
  review_status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(r: any): AstrologyKbView {
  return {
    id: String(r.id),
    kind: String(r.kind),
    key1: String(r.key1),
    key2: r.key2 ?? null,
    key3: r.key3 ?? null,
    locale: String(r.locale),
    title: String(r.title),
    content: String(r.content ?? ""),
    short_summary: r.short_summary ?? null,
    tone: String(r.tone ?? "warm"),
    source: r.source ?? null,
    author: r.author ?? null,
    is_active: Number(r.is_active ?? 0) === 1,
    review_status: r.reviewed_at
      ? Number(r.is_active ?? 0) === 1
        ? "approved"
        : "rejected"
      : "pending",
    reviewed_by: r.reviewed_by ?? null,
    reviewed_at: r.reviewed_at ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function safeOrderBy(col?: string) {
  switch (col) {
    case "created_at":
    case "updated_at":
    case "kind":
    case "key1":
      return col;
    default:
      return "kind";
  }
}

export async function listKb(
  app: FastifyInstance,
  q: KbListParams,
): Promise<{ items: AstrologyKbView[]; total: number }> {
  const mysql = (app as any).mysql;
  const where: string[] = [];
  const args: any[] = [];

  if (q.search) {
    where.push("(k.title LIKE ? OR k.content LIKE ? OR k.key1 LIKE ?)");
    const s = `%${q.search}%`;
    args.push(s, s, s);
  }
  if (q.kind) { where.push("k.kind = ?"); args.push(q.kind); }
  if (q.key1) { where.push("k.key1 = ?"); args.push(q.key1); }
  if (q.key2) { where.push("k.key2 = ?"); args.push(q.key2); }
  if (q.key3) { where.push("k.key3 = ?"); args.push(q.key3); }
  if (q.locale) { where.push("k.locale = ?"); args.push(q.locale); }
  if (q.review_status === "pending") {
    where.push("k.reviewed_at IS NULL");
  } else if (q.review_status === "approved") {
    where.push("k.reviewed_at IS NOT NULL AND k.is_active = 1");
  } else if (q.review_status === "rejected") {
    where.push("k.reviewed_at IS NOT NULL AND k.is_active = 0");
  }
  if (typeof q.is_active === "boolean") {
    where.push("k.is_active = ?");
    args.push(q.is_active ? 1 : 0);
  }

  const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";
  const orderCol = safeOrderBy(q.orderBy);
  const orderDir = q.order?.toUpperCase() === "DESC" ? "DESC" : "ASC";

  const [rows] = await mysql.query(
    `SELECT k.* FROM astrology_kb k ${whereClause} ORDER BY k.\`${orderCol}\` ${orderDir}, k.key1 ASC LIMIT ? OFFSET ?`,
    [...args, q.limit ?? 100, q.offset ?? 0],
  );
  const [countRows] = await mysql.query(
    `SELECT COUNT(*) AS total FROM astrology_kb k ${whereClause}`,
    args,
  );
  const total = Number((countRows as any[])[0]?.total ?? 0);
  return { items: (rows as any[]).map(mapRow), total };
}

export async function getKbById(
  app: FastifyInstance,
  id: string,
): Promise<AstrologyKbView | null> {
  const mysql = (app as any).mysql;
  const [rows] = await mysql.query("SELECT * FROM astrology_kb WHERE id = ? LIMIT 1", [id]);
  const r = (rows as any[])[0];
  return r ? mapRow(r) : null;
}

export async function createKb(
  app: FastifyInstance,
  body: KbCreateInput,
  reviewedBy?: string | null,
): Promise<AstrologyKbView> {
  const mysql = (app as any).mysql;
  const id = randomUUID();
  await mysql.query(
    `INSERT INTO astrology_kb
       (id, kind, key1, key2, key3, locale, title, content, short_summary,
        tone, source, author, is_active, reviewed_by, reviewed_at,
        created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
    [
      id,
      body.kind,
      body.key1,
      body.key2 ?? null,
      body.key3 ?? null,
      body.locale,
      body.title,
      body.content,
      body.short_summary ?? null,
      body.tone,
      body.source ?? null,
      body.author ?? null,
      body.is_active ? 1 : 0,
      reviewedBy ?? null,
      reviewedBy ? new Date() : null,
    ],
  );
  const created = await getKbById(app, id);
  if (!created) throw new Error("kb_create_failed");
  return created;
}

export async function updateKb(
  app: FastifyInstance,
  id: string,
  body: KbUpdateInput,
  reviewedBy?: string | null,
): Promise<AstrologyKbView | null> {
  const mysql = (app as any).mysql;
  const fields: string[] = [];
  const args: any[] = [];

  if (typeof body.kind !== "undefined") { fields.push("kind = ?"); args.push(body.kind); }
  if (typeof body.key1 !== "undefined") { fields.push("key1 = ?"); args.push(body.key1); }
  if (typeof body.key2 !== "undefined") { fields.push("key2 = ?"); args.push(body.key2 ?? null); }
  if (typeof body.key3 !== "undefined") { fields.push("key3 = ?"); args.push(body.key3 ?? null); }
  if (typeof body.locale !== "undefined") { fields.push("locale = ?"); args.push(body.locale); }
  if (typeof body.title !== "undefined") { fields.push("title = ?"); args.push(body.title); }
  if (typeof body.content !== "undefined") { fields.push("content = ?"); args.push(body.content); }
  if (typeof body.short_summary !== "undefined") { fields.push("short_summary = ?"); args.push(body.short_summary ?? null); }
  if (typeof body.tone !== "undefined") { fields.push("tone = ?"); args.push(body.tone); }
  if (typeof body.source !== "undefined") { fields.push("source = ?"); args.push(body.source ?? null); }
  if (typeof body.author !== "undefined") { fields.push("author = ?"); args.push(body.author ?? null); }
  if (typeof body.is_active !== "undefined") { fields.push("is_active = ?"); args.push(body.is_active ? 1 : 0); }

  if (reviewedBy) {
    fields.push("reviewed_by = ?", "reviewed_at = NOW(3)");
    args.push(reviewedBy);
  }

  if (!fields.length) return getKbById(app, id);

  fields.push("updated_at = NOW(3)");
  await mysql.query(
    `UPDATE astrology_kb SET ${fields.join(", ")} WHERE id = ?`,
    [...args, id],
  );
  return getKbById(app, id);
}

export async function deleteKb(
  app: FastifyInstance,
  id: string,
): Promise<boolean> {
  const mysql = (app as any).mysql;
  const [res] = await mysql.query("DELETE FROM astrology_kb WHERE id = ? LIMIT 1", [id]);
  return ((res as any)?.affectedRows ?? 0) > 0;
}

export async function approveKb(
  app: FastifyInstance,
  id: string,
  reviewedBy?: string | null,
): Promise<AstrologyKbView | null> {
  const mysql = (app as any).mysql;
  await mysql.query(
    `UPDATE astrology_kb
     SET is_active = 1, reviewed_by = ?, reviewed_at = NOW(3), updated_at = NOW(3)
     WHERE id = ?`,
    [reviewedBy ?? null, id],
  );
  return getKbById(app, id);
}

export async function rejectKb(
  app: FastifyInstance,
  id: string,
  reviewedBy?: string | null,
): Promise<AstrologyKbView | null> {
  const mysql = (app as any).mysql;
  await mysql.query(
    `UPDATE astrology_kb
     SET is_active = 0, reviewed_by = ?, reviewed_at = NOW(3), updated_at = NOW(3)
     WHERE id = ?`,
    [reviewedBy ?? null, id],
  );
  return getKbById(app, id);
}

export async function createTranslationDrafts(
  app: FastifyInstance,
  input: KbTranslationDraftInput,
): Promise<{ created: number; skipped: number; source_total: number }> {
  const mysql = (app as any).mysql;
  const [rows] = await mysql.query(
    `SELECT *
     FROM astrology_kb
     WHERE locale = ?
     ORDER BY kind ASC, key1 ASC, key2 ASC, key3 ASC
     LIMIT ?`,
    [input.source_locale, input.limit],
  );

  let created = 0;
  let skipped = 0;

  for (const row of rows as any[]) {
    const [existingRows] = await mysql.query(
      `SELECT id FROM astrology_kb
       WHERE kind = ? AND key1 = ? AND IFNULL(key2,'') = IFNULL(?,'') AND IFNULL(key3,'') = IFNULL(?,'') AND locale = ?
       LIMIT 1`,
      [row.kind, row.key1, row.key2 ?? null, row.key3 ?? null, input.target_locale],
    );
    if ((existingRows as any[])[0]) {
      skipped++;
      continue;
    }

    await mysql.query(
      `INSERT INTO astrology_kb
        (id, kind, key1, key2, key3, locale, title, content, short_summary,
         tone, source, author, is_active, reviewed_by, reviewed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, NOW(3), NOW(3))`,
      [
        randomUUID(),
        row.kind,
        row.key1,
        row.key2 ?? null,
        row.key3 ?? null,
        input.target_locale,
        `[${input.target_locale.toUpperCase()} taslak] ${row.title}`,
        [
          `ÇEVİRİ TASLAĞI (${input.source_locale} → ${input.target_locale})`,
          "",
          "Bu kayıt DeepL/Anthropic çeviri hattı için oluşturulmuştur. Yayına almadan önce astrolog/editör onayı gerekir.",
          "",
          "Kaynak metin:",
          String(row.content ?? ""),
        ].join("\n"),
        row.short_summary ? `[Çeviri taslağı] ${row.short_summary}` : null,
        row.tone ?? "professional",
        row.source ? `${row.source} | translation_source:${input.source_locale}` : `translation_source:${input.source_locale}`,
        row.author ?? null,
      ],
    );
    created++;
  }

  return { created, skipped, source_total: (rows as any[]).length };
}

// Bulk import — CSV/JSON upload. upsert=true → mevcut (kind+key1+key2+key3+locale) günceller.
export async function bulkImportKb(
  app: FastifyInstance,
  body: KbBulkImportInput,
  reviewedBy?: string | null,
): Promise<{ inserted: number; updated: number; failed: number }> {
  let inserted = 0;
  let updated = 0;
  let failed = 0;

  const mysql = (app as any).mysql;

  for (const item of body.items) {
    try {
      // Mevcut combo var mı?
      const [rows] = await mysql.query(
        `SELECT id FROM astrology_kb
         WHERE kind = ? AND key1 = ? AND IFNULL(key2,'') = IFNULL(?,'') AND IFNULL(key3,'') = IFNULL(?,'') AND locale = ?
         LIMIT 1`,
        [item.kind, item.key1, item.key2 ?? null, item.key3 ?? null, item.locale],
      );
      const existing = (rows as any[])[0];

      if (existing && body.upsert) {
        await updateKb(app, existing.id, item, reviewedBy);
        updated++;
      } else if (!existing) {
        await createKb(app, item, reviewedBy);
        inserted++;
      } else {
        // existing && !upsert → skip
        failed++;
      }
    } catch (err) {
      console.warn("kb_bulk_import_item_failed", { item, err });
      failed++;
    }
  }

  return { inserted, updated, failed };
}
