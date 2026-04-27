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
import { checkContent } from "../_shared/contentModeration";

/** MySQL tinyint(1) -> boolean, number coercion + i18n alanları ekle */
function mapRowCore(
  r: any,
  comment: string | null,
  title: string | null,
  adminReply: string | null,
  consultantReply: string | null,
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
    is_verified: Number(r.is_verified ?? 0) === 1,
    submitted_locale: r.submitted_locale,
    created_at: r.created_at,
    updated_at: r.updated_at,
    comment,
    title,
    admin_reply: adminReply,
    consultant_reply: consultantReply,
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
  consultant_reply?: string | null;
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
  consultant_reply: string | null;
  locale_resolved: string | null;
} {
  if (!translations.length) {
    return {
      comment: null,
      title: null,
      admin_reply: null,
      consultant_reply: null,
      locale_resolved: null,
    };
  }
  const exact = translations.find((t) => t.locale === locale);
  if (exact)
    return {
      comment: exact.comment,
      title: exact.title ?? null,
      admin_reply: exact.admin_reply ?? null,
      consultant_reply: exact.consultant_reply ?? null,
      locale_resolved: exact.locale,
    };

  const def = translations.find((t) => t.locale === defaultLocale);
  if (def)
    return {
      comment: def.comment,
      title: def.title ?? null,
      admin_reply: def.admin_reply ?? null,
      consultant_reply: def.consultant_reply ?? null,
      locale_resolved: def.locale,
    };

  const first = translations[0];
  return {
    comment: first.comment,
    title: first.title ?? null,
    admin_reply: first.admin_reply ?? null,
    consultant_reply: first.consultant_reply ?? null,
    locale_resolved: first.locale,
  };
}

async function verifyBookingCompletedForReview(
  mysql: any,
  bookingId: string,
  userId: string,
): Promise<void> {
  const [bookingRows] = (await mysql.query(
    "SELECT id, user_id, status FROM bookings WHERE id = ? LIMIT 1",
    [bookingId],
  )) as [Array<{ id: string; user_id: string; status: string }>, unknown];

  const booking = Array.isArray(bookingRows) ? bookingRows[0] : null;
  if (!booking || booking.user_id !== userId) {
    const err: any = new Error("booking_not_found");
    err.statusCode = 403;
    throw err;
  }

  if (booking.status === "completed") return;

  const [sessionRows] = (await mysql.query(
    "SELECT 1 FROM live_sessions WHERE booking_id = ? AND ended_at IS NOT NULL LIMIT 1",
    [bookingId],
  )) as [Array<{ "1": number }>, unknown];

  if (Array.isArray(sessionRows) && sessionRows.length > 0) return;

  const err: any = new Error("booking_not_completed_for_review");
  err.statusCode = 403;
  throw err;
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
    SELECT review_id, locale, title, comment, admin_reply, consultant_reply
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
      consultant_reply: r.consultant_reply ?? null,
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
    SELECT review_id, locale, title, comment, admin_reply, consultant_reply
    FROM review_i18n
    WHERE review_id = ?
    `,
    [id],
  );

  const translations: Translation[] = (trs as any[]).map((t) => ({
    locale: t.locale,
    title: t.title ?? null,
    admin_reply: t.admin_reply ?? null,
    consultant_reply: t.consultant_reply ?? null,
    comment: t.comment,
  }));

  const { comment, title, admin_reply, consultant_reply, locale_resolved } = pickTranslation(
    translations,
    locale,
    defaultLocale,
  );

  return mapRowCore(row, comment, title, admin_reply, consultant_reply, locale_resolved);
}


export async function repoCreateReviewPublic(
  app: FastifyInstance,
  body: ReviewCreateInput,
  locale: string,
  options?: { enforceConsultantReviewGuard?: boolean },
): Promise<ReviewView> {
  const mysql = (app as any).mysql;
  const enforceReviewGuard = options?.enforceConsultantReviewGuard ?? true;

  const isActive = body.is_active ?? true;

  // FAZ 17 / T17-3 — İçerik moderasyonu (auto-approve / flag)
  const fullText = [body.title ?? '', body.comment ?? ''].filter(Boolean).join('\n');
  const moderation = checkContent(fullText, 'review');
  const explicitOverride = typeof body.is_approved === 'boolean' ? body.is_approved : null;
  const isApproved = explicitOverride !== null ? explicitOverride : moderation.safe;

  if (!moderation.safe) {
    console.warn('review_moderation_flag', {
      target_id: body.target_id,
      flags: moderation.flags,
      patterns: moderation.matched_patterns,
    });
  }

  // T17-1 — Doğrulanmış görüşme rozeti (sadece consultant + booking flow)
  // Sadece booking sahibi ve tamamlanmış/bitmiş seanslı bookinglerde allowed.
  if (enforceReviewGuard && body.target_type === 'consultant') {
    if (!body.booking_id) {
      const err: any = new Error('booking_id_required');
      err.statusCode = 400;
      throw err;
    }
    if (!body.user_id) {
      const err: any = new Error('unauthorized');
      err.statusCode = 401;
      throw err;
    }
    await verifyBookingCompletedForReview(mysql, body.booking_id, body.user_id);
  }

  // T17-1 — Doğrulanmış görüşme rozeti
  // booking tamamlandıysa is_verified=1
  let isVerified = 0;
  if (body.booking_id && body.user_id && enforceReviewGuard && body.target_type === 'consultant') {
    const [bookingRow] = (await mysql.query(
      'SELECT status FROM bookings WHERE id = ? LIMIT 1',
      [body.booking_id],
    )) as [Array<{ status: string }>, unknown];
    const booking = Array.isArray(bookingRow) ? bookingRow[0] : null;
    if (booking && booking.status === 'completed') {
      isVerified = 1;
    } else if (booking) {
      const [sessionRows] = (await mysql.query(
        "SELECT 1 FROM live_sessions WHERE booking_id = ? AND ended_at IS NOT NULL LIMIT 1",
        [body.booking_id],
      )) as [Array<{ "1": number }>, unknown];
      if (Array.isArray(sessionRows) && sessionRows.length > 0) isVerified = 1;
    }
  }

  const displayOrder = body.display_order ?? 0;
  const id = randomUUID();

  await mysql.query(
    `
    INSERT INTO reviews
      (
        id,
        target_type,
        target_id,
        user_id,
        booking_id,
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
        is_verified,
        display_order,
        likes_count,
        dislikes_count,
        helpful_count,
        submitted_locale,
        created_at,
        updated_at
      )
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, NOW(3), NOW(3))
    `,
    [
      id,
      body.target_type,
      body.target_id,
      body.user_id ?? null,
      body.booking_id ?? null,
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
      isVerified,
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

  // T17-6 — Astrolog karnesi follow-up kaydı (6 ay sonra "gerçekleşti mi?" sorusu)
  // Sadece consultant review'larında ve doğrulanmış (booking ile bağlı) olanlarda
  if (body.target_type === 'consultant' && body.user_id && isVerified === 1) {
    try {
      const followUpAt = new Date();
      followUpAt.setMonth(followUpAt.getMonth() + 6);
      await mysql.query(
        `
        INSERT INTO review_outcomes
          (id, review_id, user_id, consultant_id, follow_up_at, created_at, updated_at)
        VALUES
          (UUID(), ?, ?, ?, ?, NOW(3), NOW(3))
        ON DUPLICATE KEY UPDATE
          follow_up_at = VALUES(follow_up_at),
          updated_at = NOW(3)
        `,
        [id, body.user_id, body.target_id, followUpAt],
      );
    } catch (err) {
      console.warn('review_outcome_insert_failed', { review_id: id, error: err });
      // Silent fail — review create yine başarılı sayılır
    }
  }

  return created;
}

/**
 * T17-2 — Astrolog kendi review'ına cevap.
 * - Review target_type='consultant' olmalı.
 * - consultants.user_id === current_user_id eşleşmesi.
 * - review_i18n.consultant_reply UPSERT (locale bazlı).
 */
export async function repoConsultantReply(
  app: FastifyInstance,
  reviewId: string,
  userId: string,
  reply: string,
  locale: string,
): Promise<{ data?: { review_id: string; locale: string }; error?: { message: string } }> {
  const mysql = (app as any).mysql;

  // 1. Review'ı al
  const [reviewRows] = (await mysql.query(
    'SELECT id, target_type, target_id FROM reviews WHERE id = ? LIMIT 1',
    [reviewId],
  )) as [Array<{ id: string; target_type: string; target_id: string }>, unknown];
  const review = Array.isArray(reviewRows) ? reviewRows[0] : null;
  if (!review) return { error: { message: 'review_not_found' } };
  if (review.target_type !== 'consultant') {
    return { error: { message: 'consultant_reply_only_allowed_on_consultant_reviews' } };
  }

  // 2. Consultant'ın user_id'si current user mu?
  const [consultantRows] = (await mysql.query(
    'SELECT user_id FROM consultants WHERE id = ? LIMIT 1',
    [review.target_id],
  )) as [Array<{ user_id: string }>, unknown];
  const consultant = Array.isArray(consultantRows) ? consultantRows[0] : null;
  if (!consultant) return { error: { message: 'consultant_not_found' } };
  if (consultant.user_id !== userId) {
    return { error: { message: 'forbidden_not_review_target' } };
  }

  // 3. review_i18n.consultant_reply UPSERT
  await mysql.query(
    `
    INSERT INTO review_i18n
      (id, review_id, locale, comment, consultant_reply, consultant_replied_at, created_at, updated_at)
    VALUES
      (UUID(), ?, ?, '', ?, NOW(3), NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE
      consultant_reply = VALUES(consultant_reply),
      consultant_replied_at = NOW(3),
      updated_at = NOW(3)
    `,
    [reviewId, locale, reply],
  );

  return { data: { review_id: reviewId, locale } };
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
