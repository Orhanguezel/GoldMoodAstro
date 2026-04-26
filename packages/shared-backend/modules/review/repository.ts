// =============================================================
// FILE: src/modules/review/repository.ts
// =============================================================
import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import type {
  ReviewCreateInput,
  ReviewListParams,
  ReviewUpdateInput,
} from "./validation";
import type { ReviewView } from "./schema";

/** MySQL tinyint(1) -> boolean, number coercion + i18n alanları ekle */
function mapRowCore(
  r: any,
  comment: string | null,
  title: string | null,
  adminReply: string | null,
  localeResolved: string | null,
): ReviewView {
  return {
    id: r.id,
    target_type: r.target_type,
    target_id: r.target_id,
    name: r.name,
    email: r.email,
    rating: Number(r.rating),
    role: r.role ?? null,
    company: r.company ?? null,
    avatar_url: r.avatar_url ?? null,
    logo_url: r.logo_url ?? null,
    profile_href: r.profile_href ?? null,
    is_active: Number(r.is_active) === 1,
    is_approved: Number(r.is_approved) === 1,
    display_order: Number(r.display_order),
    likes_count: Number(r.likes_count ?? 0),
    dislikes_count: Number(r.dislikes_count ?? 0),
    helpful_count: Number(r.helpful_count ?? 0),
    submitted_locale: r.submitted_locale,
    created_at: r.created_at,
    updated_at: r.updated_at,
    comment,
    title,
    admin_reply: adminReply,
    locale_resolved: localeResolved,
  };
}


function safeOrderBy(col?: string) {
  switch (col) {
    case "created_at":
    case "updated_at":
    case "display_order":
    case "rating":
    case "name":
      return col;
    default:
      return "display_order";
  }
}

type Translation = {
  locale: string;
  comment: string;
  title?: string | null;
  admin_reply?: string | null;
};

/** İstenen locale yoksa → defaultLocale → yoksa ilk çeviri */
function pickTranslation(
  translations: Translation[],
  locale: string,
  defaultLocale: string,
): {
  comment: string | null;
  title: string | null;
  admin_reply: string | null;
  locale_resolved: string | null;
} {
  if (!translations.length) {
    return { comment: null, title: null, admin_reply: null, locale_resolved: null };
  }
  const exact = translations.find((t) => t.locale === locale);
  if (exact)
    return {
      comment: exact.comment,
      title: exact.title ?? null,
      admin_reply: exact.admin_reply ?? null,
      locale_resolved: exact.locale,
    };

  const def = translations.find((t) => t.locale === defaultLocale);
  if (def)
    return {
      comment: def.comment,
      title: def.title ?? null,
      admin_reply: def.admin_reply ?? null,
      locale_resolved: def.locale,
    };

  const first = translations[0];
  return {
    comment: first.comment,
    title: first.title ?? null,
    admin_reply: first.admin_reply ?? null,
    locale_resolved: first.locale,
  };
}

/* -------------------------------------------------------------
   Yardımcı: verilen review id'leri için tüm çevirileri çek
   ------------------------------------------------------------- */
async function fetchTranslationsForReviews(
  app: FastifyInstance,
  ids: string[],
): Promise<Map<string, Translation[]>> {
  const mysql = (app as any).mysql;
  const map = new Map<string, Translation[]>();

  if (!ids.length) return map;

  const placeholders = ids.map(() => "?").join(", ");
  const [rows] = await mysql.query(
    `
    SELECT review_id, locale, title, comment, admin_reply
    FROM review_i18n
    WHERE review_id IN (${placeholders})
    `,
    ids,
  );

  for (const r of rows as any[]) {
    const key = r.review_id as string;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push({
      locale: r.locale,
      title: r.title ?? null,
      admin_reply: r.admin_reply ?? null,
      comment: r.comment,
    });
  }

  return map;
}

/* ---------------- PUBLIC ---------------- */

export async function repoGetReviewPublic(
  app: FastifyInstance,
  id: string,
  locale: string,
  defaultLocale: string,
): Promise<ReviewView | null> {
  const mysql = (app as any).mysql;

  const [rows] = await mysql.query(
    `
    SELECT
      r.id,
      r.target_type,
      r.target_id,
      r.name,
      r.email,
      r.rating,
      r.role,
      r.company,
      r.avatar_url,
      r.logo_url,
      r.profile_href,
      r.is_active,
      r.is_approved,
      r.display_order,
      r.likes_count,
      r.dislikes_count,
      r.helpful_count,
      r.submitted_locale,
      r.created_at,
      r.updated_at
    FROM reviews r
    WHERE r.id = ?
    LIMIT 1
    `,
    [id],
  );

  const row = (rows as any[])[0];
  if (!row) return null;

  const [trs] = await mysql.query(
    `
    SELECT review_id, locale, title, comment, admin_reply
    FROM review_i18n
    WHERE review_id = ?
    `,
    [id],
  );

  const translations: Translation[] = (trs as any[]).map((t) => ({
    locale: t.locale,
    title: t.title ?? null,
    admin_reply: t.admin_reply ?? null,
    comment: t.comment,
  }));

  const { comment, title, admin_reply, locale_resolved } = pickTranslation(
    translations,
    locale,
    defaultLocale,
  );

  return mapRowCore(row, comment, title, admin_reply, locale_resolved);
}


export async function repoCreateReviewPublic(
  app: FastifyInstance,
  body: ReviewCreateInput,
  locale: string,
): Promise<ReviewView> {
  const mysql = (app as any).mysql;

  const isActive = body.is_active ?? true;
  // Public gönderimler default onaysız
  const isApproved = body.is_approved ?? false;
  const displayOrder = body.display_order ?? 0;

  const id = randomUUID();

  await mysql.query(
    `
    INSERT INTO reviews
      (
        id,
        target_type,
        target_id,
        name,
        email,
        rating,
        role,
        company,
        avatar_url,
        logo_url,
        profile_href,
        is_active,
        is_approved,
        display_order,
        likes_count,
        dislikes_count,
        helpful_count,
        submitted_locale,
        created_at,
        updated_at
      )
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, NOW(3), NOW(3))
    `,
    [
      id,
      body.target_type,
      body.target_id,
      body.name,
      body.email,
      body.rating,
      body.role ?? null,
      body.company ?? null,
      body.avatar_url ?? null,
      body.logo_url ?? null,
      body.profile_href ?? null,
      isActive ? 1 : 0,
      isApproved ? 1 : 0,
      displayOrder,
      locale, // submitted_locale
    ],
  );

  // İlk yorum metni: verilen locale için çeviri
  await mysql.query(
    `
    INSERT INTO review_i18n
      (id, review_id, locale, title, comment, admin_reply, created_at, updated_at)
    VALUES
      (UUID(), ?, ?, ?, ?, NULL, NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE
      comment = VALUES(comment),
      updated_at = VALUES(updated_at)
    `,
    [id, locale, body.title ?? null, body.comment],
  );

  const created = await repoGetReviewPublic(app, id, locale, locale);
  if (!created) throw new Error("Review insert ok, but fetch failed.");
  return created;
}



/**
 * Basit reaction: like/helpful sayacını artır
 * (Şimdilik user/ip bazlı tekilleştirme yok, her istek +1)
 */
export async function repoAddReactionPublic(
  app: FastifyInstance,
  id: string,
  locale: string,
  defaultLocale: string,
): Promise<ReviewView | null> {
  const mysql = (app as any).mysql;

  await mysql.query(
    `
    UPDATE reviews
    SET helpful_count = helpful_count + 1,
        updated_at = NOW(3)
    WHERE id = ?
    LIMIT 1
    `,
    [id],
  );

  return await repoGetReviewPublic(app, id, locale, defaultLocale);
}



/* ---------------- ADMIN ---------------- */

// ❗️ TEK admin listesi: approved/active yalnızca belirtilirse filtrelenir.
export async function repoListReviewsAdmin(
  app: FastifyInstance,
  q: ReviewListParams,
  locale: string,
  defaultLocale: string,
): Promise<ReviewView[]> {
  const mysql = (app as any).mysql;

  const where: string[] = [];
  const args: any[] = [];

  if (q.search) {
    const s = `%${q.search}%`;
    // comment araması için alt sorgu
    where.push(
      `(r.name LIKE ? OR r.email LIKE ? OR EXISTS (
         SELECT 1 FROM review_i18n rt
         WHERE rt.review_id = r.id AND rt.comment LIKE ?
       ))`,
    );
    args.push(s, s, s);
  }
  if (typeof q.approved === "boolean") {
    where.push("r.is_approved = ?");
    args.push(q.approved ? 1 : 0);
  }
  if (typeof q.active === "boolean") {
    where.push("r.is_active = ?");
    args.push(q.active ? 1 : 0);
  }
  if (typeof q.minRating === "number") {
    where.push("r.rating >= ?");
    args.push(q.minRating);
  }
  if (typeof q.maxRating === "number") {
    where.push("r.rating <= ?");
    args.push(q.maxRating);
  }
  if (q.target_type) {
    where.push("r.target_type = ?");
    args.push(q.target_type);
  }
  if (q.target_id) {
    where.push("r.target_id = ?");
    args.push(q.target_id);
  }

  const orderCol = safeOrderBy(q.orderBy);
  const orderDir = q.order?.toUpperCase() === "DESC" ? "DESC" : "ASC";

  const sqlStr = `
    SELECT
      r.id,
      r.name,
      r.email,
      r.rating,
      r.target_type,
      r.target_id,
      r.role,
      r.company,
      r.avatar_url,
      r.logo_url,
      r.profile_href,
      r.helpful_count,
      r.is_active,
      r.is_approved,
      r.display_order,
      r.created_at,
      r.updated_at
    FROM reviews r
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY r.${orderCol} ${orderDir}
    LIMIT ? OFFSET ?
  `;
  args.push(q.limit ?? 100, q.offset ?? 0);

  const [rows] = await mysql.query(sqlStr, args);
  const list = rows as any[];
  if (!list.length) return [];

  const ids = list.map((r) => r.id as string);
  const translationsMap = await fetchTranslationsForReviews(app, ids);

  return list.map((r) => {
    const translations = translationsMap.get(r.id) ?? [];
    const { comment, title, admin_reply, locale_resolved } = pickTranslation(
      translations,
      locale,
      defaultLocale,
    );
    return mapRowCore(r, comment, title, admin_reply, locale_resolved);
  });
}

export async function repoGetReviewAdmin(
  app: FastifyInstance,
  id: string,
  locale: string,
  defaultLocale: string,
): Promise<ReviewView | null> {
  return repoGetReviewPublic(app, id, locale, defaultLocale);
}

export async function repoCreateReviewAdmin(
  app: FastifyInstance,
  body: ReviewCreateInput,
  locale: string,
): Promise<ReviewView> {
  // Admin create de public create ile aynı; sadece locale'i admin belirler
  return repoCreateReviewPublic(app, body, locale);
}

export async function repoUpdateReviewAdmin(
  app: FastifyInstance,
  id: string,
  body: ReviewUpdateInput,
  locale: string,
  defaultLocale: string,
): Promise<ReviewView | null> {
  const mysql = (app as any).mysql;

  const parentFields: string[] = [];
  const parentArgs: any[] = [];

  if (typeof body.name !== "undefined") {
    parentFields.push("name = ?");
    parentArgs.push(body.name);
  }
  if (typeof body.email !== "undefined") {
    parentFields.push("email = ?");
    parentArgs.push(body.email);
  }
  if (typeof body.rating !== "undefined") {
    parentFields.push("rating = ?");
    parentArgs.push(body.rating);
  }
  if (typeof (body as any).role !== "undefined") {
    parentFields.push("role = ?");
    parentArgs.push((body as any).role ?? null);
  }
  if (typeof (body as any).company !== "undefined") {
    parentFields.push("company = ?");
    parentArgs.push((body as any).company ?? null);
  }
  if (typeof (body as any).avatar_url !== "undefined") {
    parentFields.push("avatar_url = ?");
    parentArgs.push((body as any).avatar_url ?? null);
  }
  if (typeof (body as any).logo_url !== "undefined") {
    parentFields.push("logo_url = ?");
    parentArgs.push((body as any).logo_url ?? null);
  }
  if (typeof (body as any).profile_href !== "undefined") {
    parentFields.push("profile_href = ?");
    parentArgs.push((body as any).profile_href ?? null);
  }
  if (typeof body.target_type !== "undefined") {
    parentFields.push("target_type = ?");
    parentArgs.push(body.target_type);
  }
  if (typeof body.target_id !== "undefined") {
    parentFields.push("target_id = ?");
    parentArgs.push(body.target_id);
  }
  if (typeof (body as any).helpful_count !== "undefined") {
    parentFields.push("helpful_count = ?");
    parentArgs.push((body as any).helpful_count);
  }
  if (typeof body.is_active !== "undefined") {
    parentFields.push("is_active = ?");
    parentArgs.push(body.is_active ? 1 : 0);
  }
  if (typeof body.is_approved !== "undefined") {
    parentFields.push("is_approved = ?");
    parentArgs.push(body.is_approved ? 1 : 0);
  }
  if (typeof body.display_order !== "undefined") {
    parentFields.push("display_order = ?");
    parentArgs.push(body.display_order);
  }

  if (parentFields.length > 0) {
    const sqlStr = `
      UPDATE reviews
      SET ${parentFields.join(", ")}, updated_at = NOW(3)
      WHERE id = ?
      LIMIT 1
    `;
    await mysql.query(sqlStr, [...parentArgs, id]);
  }

  // i18n patch: comment/title varsa, ilgili locale için upsert/update
  const hasComment = typeof body.comment !== "undefined";
  const hasTitle = typeof (body as any).title !== "undefined";
  const hasAdminReply = typeof (body as any).admin_reply !== "undefined";
  const loc = (body as any).locale || locale || defaultLocale;

  if (hasComment) {
    const titleVal = hasTitle ? ((body as any).title ?? null) : null;
    const adminReplyVal = hasAdminReply ? ((body as any).admin_reply ?? null) : null;

    await mysql.query(
      `
      INSERT INTO review_i18n
        (id, review_id, locale, title, comment, admin_reply, created_at, updated_at)
      VALUES
        (UUID(), ?, ?, ?, ?, ?, NOW(3), NOW(3))
      ON DUPLICATE KEY UPDATE
        comment = VALUES(comment),
        ${hasTitle ? "title = VALUES(title)," : ""}
        ${hasAdminReply ? "admin_reply = VALUES(admin_reply)," : ""}
        updated_at = VALUES(updated_at)
      `,
      [id, loc, titleVal, body.comment, adminReplyVal],
    );
  } else if (hasTitle || hasAdminReply) {
    const fields: string[] = [];
    const args: any[] = [];
    if (hasTitle) {
      fields.push("title = ?");
      args.push((body as any).title ?? null);
    }
    if (hasAdminReply) {
      fields.push("admin_reply = ?");
      args.push((body as any).admin_reply ?? null);
    }
    if (fields.length) {
      await mysql.query(
        `
        UPDATE review_i18n
        SET ${fields.join(", ")}, updated_at = NOW(3)
        WHERE review_id = ? AND locale = ?
        `,
        [...args, id, loc],
      );
    }
  }

  return await repoGetReviewAdmin(app, id, locale, defaultLocale);
}

export async function repoDeleteReviewAdmin(
  app: FastifyInstance,
  id: string,
): Promise<boolean> {
  const mysql = (app as any).mysql;

  // review_i18n'de FK CASCADE varsa childları otomatik silinir; burada
  // sadece parent'ı siliyoruz.
  const [res] = await mysql.query(
    `DELETE FROM reviews WHERE id = ? LIMIT 1`,
    [id],
  );
  return ((res as any)?.affectedRows ?? 0) > 0;
}

/* ---------------- PUBLIC LIST (FE) ---------------- */

// ✅ Public liste: approved/active varsayılanı true
export async function repoListReviewsPublic(
  app: FastifyInstance,
  q: ReviewListParams,
  locale: string,
  defaultLocale: string,
): Promise<ReviewView[]> {
  const mysql = (app as any).mysql;

  const where: string[] = [];
  const args: any[] = [];

  // Hangi hedef için?
  if (q.target_type) {
    where.push("r.target_type = ?");
    args.push(q.target_type);
  }
  if (q.target_id) {
    where.push("r.target_id = ?");
    args.push(q.target_id);
  }

  // Public’te defaultlar:
  const approved =
    typeof q.approved === "boolean" ? q.approved : true;
  const active = typeof q.active === "boolean" ? q.active : true;

  if (q.search) {
    const s = `%${q.search}%`;
    where.push(
      `(r.name LIKE ? OR r.email LIKE ? OR EXISTS (
         SELECT 1 FROM review_i18n rt
         WHERE rt.review_id = r.id AND rt.comment LIKE ?
       ))`,
    );
    args.push(s, s, s);
  }

  // 🔒 Public: approved & active varsayılan olarak zorunlu
  where.push("r.is_approved = ?");
  args.push(approved ? 1 : 0);

  where.push("r.is_active = ?");
  args.push(active ? 1 : 0);

  if (typeof q.minRating === "number") {
    where.push("r.rating >= ?");
    args.push(q.minRating);
  }
  if (typeof q.maxRating === "number") {
    where.push("r.rating <= ?");
    args.push(q.maxRating);
  }

  const orderCol = safeOrderBy(q.orderBy);
  const orderDir = q.order?.toUpperCase() === "DESC" ? "DESC" : "ASC";

  const sqlStr = `
    SELECT
      r.id,
      r.target_type,
      r.target_id,
      r.name,
      r.email,
      r.rating,
      r.role,
      r.company,
      r.avatar_url,
      r.logo_url,
      r.profile_href,
      r.is_active,
      r.is_approved,
      r.display_order,
      r.likes_count,
      r.dislikes_count,
      r.helpful_count,
      r.submitted_locale,
      r.created_at,
      r.updated_at
    FROM reviews r
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY r.${orderCol} ${orderDir}
    LIMIT ? OFFSET ?
  `;
  args.push(q.limit ?? 100, q.offset ?? 0);

  const [rows] = await mysql.query(sqlStr, args);
  const list = rows as any[];
  if (!list.length) return [];

  const ids = list.map((r) => r.id as string);
  const translationsMap = await fetchTranslationsForReviews(app, ids);

  return list.map((r) => {
    const translations = translationsMap.get(r.id) ?? [];
    const { comment, title, admin_reply, locale_resolved } = pickTranslation(
      translations,
      locale,
      defaultLocale,
    );
    return mapRowCore(r, comment, title, admin_reply, locale_resolved);
  });
}
