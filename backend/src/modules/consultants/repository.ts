import { randomUUID } from 'crypto';
import { and, asc, desc, eq, gte, lte, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@goldmood/shared-backend/modules/auth/schema';
import { resources } from '@goldmood/shared-backend/modules/resources/schema';
import {
  resourceSlots,
  slotReservations,
} from '@goldmood/shared-backend/modules/availability/schema';
import { consultants } from './schema';
import type {
  AdminListConsultantsQuery,
  ListConsultantsQuery,
  RegisterConsultantBody,
} from './validation';

const SUPPORTED_LOCALES = new Set(['tr', 'en', 'de']);

function normalizeLocale(locale?: string | null) {
  const short = String(locale ?? 'tr').trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LOCALES.has(short) ? short : 'tr';
}

function localizedBioSelect(locale?: string | null) {
  const loc = normalizeLocale(locale);
  return sql<string | null>`
    COALESCE(
      NULLIF((SELECT ci.bio FROM consultant_i18n ci WHERE ci.consultant_id = ${consultants.id} AND ci.locale = ${loc} LIMIT 1), ''),
      NULLIF((SELECT ci_tr.bio FROM consultant_i18n ci_tr WHERE ci_tr.consultant_id = ${consultants.id} AND ci_tr.locale = 'tr' LIMIT 1), ''),
      ${consultants.bio}
    )
  `;
}

function localizedHeadlineSelect(locale?: string | null) {
  const loc = normalizeLocale(locale);
  return sql<string | null>`
    COALESCE(
      NULLIF((SELECT ci.headline FROM consultant_i18n ci WHERE ci.consultant_id = ${consultants.id} AND ci.locale = ${loc} LIMIT 1), ''),
      NULLIF((SELECT ci_tr.headline FROM consultant_i18n ci_tr WHERE ci_tr.consultant_id = ${consultants.id} AND ci_tr.locale = 'tr' LIMIT 1), ''),
      NULL
    )
  `;
}

function localizedMetaSelect(column: 'meta_title' | 'meta_description' | 'og_image', locale?: string | null) {
  const loc = normalizeLocale(locale);
  return sql<string | null>`
    COALESCE(
      NULLIF((SELECT ${sql.raw(column)} FROM consultant_i18n ci WHERE ci.consultant_id = ${consultants.id} AND ci.locale = ${loc} LIMIT 1), ''),
      NULLIF((SELECT ${sql.raw(column)} FROM consultant_i18n ci_tr WHERE ci_tr.consultant_id = ${consultants.id} AND ci_tr.locale = 'tr' LIMIT 1), ''),
      NULL
    )
  `;
}

function favoriteCountSelect() {
  return sql<number>`(SELECT COUNT(*) FROM user_favorites uf_count WHERE uf_count.consultant_id = ${consultants.id})`;
}

function isFavoritedSelect(userId?: string | null) {
  return userId
    ? sql<number>`EXISTS(SELECT 1 FROM user_favorites uf_me WHERE uf_me.consultant_id = ${consultants.id} AND uf_me.user_id = ${userId})`
    : sql<number>`0`;
}

function isOnlineSelect() {
  return sql<number>`EXISTS(
    SELECT 1
    FROM consultant_presence cp
    WHERE cp.consultant_id = ${consultants.id}
      AND cp.last_heartbeat_at > (NOW(3) - INTERVAL 2 MINUTE)
  )`;
}

function withUserSelect(locale?: string | null, userId?: string | null) {
  return {
    id: consultants.id,
    user_id: consultants.user_id,
    slug: consultants.slug,
    full_name: users.full_name,
    email: users.email,
    phone: users.phone,
    avatar_url: users.avatar_url,
    headline: localizedHeadlineSelect(locale),
    bio: localizedBioSelect(locale),
    meta_title: localizedMetaSelect('meta_title', locale),
    meta_description: localizedMetaSelect('meta_description', locale),
    og_image: localizedMetaSelect('og_image', locale),
    expertise: consultants.expertise,
    languages: consultants.languages,
    session_price: consultants.session_price,
    session_duration: consultants.session_duration,
    supports_video: consultants.supports_video,
    currency: consultants.currency,
    approval_status: consultants.approval_status,
    rejection_reason: consultants.rejection_reason,
    is_available: consultants.is_available,
    rating_avg: consultants.rating_avg,
    rating_count: consultants.rating_count,
    total_sessions: consultants.total_sessions,
    favorite_count: favoriteCountSelect(),
    is_favorited: isFavoritedSelect(userId),
    is_online: isOnlineSelect(),
    created_at: consultants.created_at,
    updated_at: consultants.updated_at,
  };
}

function lightSelect(locale?: string | null, userId?: string | null) {
  return {
    id: consultants.id,
    user_id: consultants.user_id,
    slug: consultants.slug,
    full_name: users.full_name,
    avatar_url: users.avatar_url,
    headline: localizedHeadlineSelect(locale),
    bio: localizedBioSelect(locale),
    meta_title: localizedMetaSelect('meta_title', locale),
    meta_description: localizedMetaSelect('meta_description', locale),
    og_image: localizedMetaSelect('og_image', locale),
    expertise: consultants.expertise,
    languages: consultants.languages,
    session_price: consultants.session_price,
    session_duration: consultants.session_duration,
    supports_video: consultants.supports_video,
    currency: consultants.currency,
    approval_status: consultants.approval_status,
    is_available: consultants.is_available,
    rating_avg: consultants.rating_avg,
    rating_count: consultants.rating_count,
    total_sessions: consultants.total_sessions,
    favorite_count: favoriteCountSelect(),
    is_favorited: isFavoritedSelect(userId),
    is_online: isOnlineSelect(),
    created_at: consultants.created_at,
  };
}

function expertisePredicate(expertise?: string): SQL | undefined {
  const value = expertise?.trim();
  if (!value) return undefined;
  return sql`JSON_CONTAINS(${consultants.expertise}, JSON_QUOTE(${value}))`;
}

export async function listApprovedConsultants(filters: ListConsultantsQuery, locale?: string | null, userId?: string | null) {
  const sort = filters.sort ?? 'featured';
  const onlineOnly = filters.onlineOnly === true || sort === 'online';

  const where = [
    eq(consultants.approval_status, 'approved'),
    onlineOnly ? sql`${isOnlineSelect()} = 1` : undefined,
    expertisePredicate(filters.expertise),
    filters.minPrice != null ? gte(consultants.session_price, String(filters.minPrice)) : undefined,
    filters.maxPrice != null ? lte(consultants.session_price, String(filters.maxPrice)) : undefined,
    filters.minRating != null ? gte(consultants.rating_avg, String(filters.minRating)) : undefined,
  ].filter(Boolean) as SQL[];

  const orderBy = (() => {
    switch (sort) {
      case 'popular':
        return [desc(consultants.total_sessions), desc(consultants.rating_avg), asc(users.full_name)];
      case 'new':
        return [desc(consultants.created_at), desc(consultants.rating_avg)];
      case 'online':
        return [desc(isOnlineSelect()), desc(consultants.rating_avg), desc(consultants.total_sessions)];
      case 'featured':
      default:
        return [desc(consultants.rating_avg), desc(consultants.total_sessions), asc(users.full_name)];
    }
  })();

  const q = db
    .select(filters.light ? lightSelect(locale, userId) : withUserSelect(locale, userId))
    .from(consultants)
    .innerJoin(users, eq(users.id, consultants.user_id))
    .where(and(...where))
    .orderBy(...orderBy);

  return filters.limit != null ? q.limit(filters.limit) : q;
}

export async function listConsultantsAdmin(filters: AdminListConsultantsQuery) {
  const where = filters.approval_status
    ? eq(consultants.approval_status, filters.approval_status)
    : undefined;

  const query = db.select(withUserSelect('tr')).from(consultants).innerJoin(users, eq(users.id, consultants.user_id));

  return where
    ? query.where(where).orderBy(desc(consultants.created_at))
    : query.orderBy(desc(consultants.created_at));
}

// UUID v4 formatı: 8-4-4-4-12 hex blokları. Slug'lar bu kalıba uymaz.
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function getConsultantById(idOrSlug: string, locale?: string | null, userId?: string | null) {
  const where = UUID_RE.test(idOrSlug)
    ? or(eq(consultants.id, idOrSlug), eq(consultants.slug, idOrSlug))
    : eq(consultants.slug, idOrSlug);

  const [row] = await db
    .select({
      ...withUserSelect(locale, userId),
      resource_id: resources.id,
      resource_title: resources.title,
    })
    .from(consultants)
    .innerJoin(users, eq(users.id, consultants.user_id))
    .leftJoin(resources, eq(resources.external_ref_id, consultants.id))
    .where(where)
    .limit(1);

  return row ?? null;
}

export async function getApprovedConsultantById(id: string, locale?: string | null, userId?: string | null) {
  const row = await getConsultantById(id, locale, userId);
  if (!row || row.approval_status !== 'approved') return null;
  return row;
}

export async function getConsultantSlots(id: string, date: string, locale?: string | null) {
  const consultant = await getApprovedConsultantById(id, locale);
  if (!consultant?.resource_id) return { consultant, slots: [] };

  const slots = await db
    .select({
      id: resourceSlots.id,
      resource_id: resourceSlots.resource_id,
      slot_date: resourceSlots.slot_date,
      slot_time: resourceSlots.slot_time,
      capacity: resourceSlots.capacity,
      reserved_count: sql<number>`COALESCE(${slotReservations.reserved_count}, 0)`,
      is_active: resourceSlots.is_active,
    })
    .from(resourceSlots)
    .leftJoin(slotReservations, eq(slotReservations.slot_id, resourceSlots.id))
    .where(
      and(
        eq(resourceSlots.resource_id, consultant.resource_id),
        eq(resourceSlots.is_active, 1),
        sql`${resourceSlots.slot_date} = ${date}`,
        sql`COALESCE(${slotReservations.reserved_count}, 0) < ${resourceSlots.capacity}`,
      ),
    )
    .orderBy(asc(resourceSlots.slot_time));

  return { consultant, slots };
}

export async function approveConsultant(id: string) {
  await db
    .update(consultants)
    .set({ approval_status: 'approved', rejection_reason: null, updated_at: new Date() } as any)
    .where(eq(consultants.id, id));
  return getConsultantById(id);
}

export async function rejectConsultant(id: string, rejectionReason: string) {
  await db
    .update(consultants)
    .set({
      approval_status: 'rejected',
      rejection_reason: rejectionReason,
      updated_at: new Date(),
    } as any)
    .where(eq(consultants.id, id));
  return getConsultantById(id);
}

type DeleteConsultantResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'not_rejected' | 'has_dependencies' };

/**
 * Reddedilmiş danışman kaydını siler. Güvenlik için yalnızca approval_status='rejected'.
 * createConsultantForUser'ın tersi: consultant + resource silinir, consultant rolü geri alınır.
 * Kullanıcı ve başvuru geçmişi (consultant_applications) korunur.
 */
export async function deleteConsultant(id: string): Promise<DeleteConsultantResult> {
  const [row] = await db
    .select({
      id: consultants.id,
      userId: consultants.user_id,
      status: consultants.approval_status,
    })
    .from(consultants)
    .where(eq(consultants.id, id))
    .limit(1);

  if (!row) return { ok: false, reason: 'not_found' };
  if (row.status !== 'rejected') return { ok: false, reason: 'not_rejected' };

  try {
    await db.transaction(async (tx) => {
      await tx.delete(resources).where(eq(resources.external_ref_id, id));
      await tx.delete(consultants).where(eq(consultants.id, id));
      await tx.execute(
        sql`DELETE FROM user_roles WHERE user_id = ${row.userId} AND role = 'consultant'`,
      );
      // users.role temizliği: admin yetkisi user_roles 'admin'den geldiği için bu güvenli.
      await tx.execute(
        sql`UPDATE users SET role = 'user', updated_at = NOW(3) WHERE id = ${row.userId} AND role = 'consultant'`,
      );
    });
    return { ok: true };
  } catch {
    // FK kısıtı (randevu/ödeme vb. bağlı kayıt) varsa
    return { ok: false, reason: 'has_dependencies' };
  }
}

export async function createConsultantForUser(userId: string, input: RegisterConsultantBody) {
  const id = randomUUID();
  const resourceId = randomUUID();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(consultants).values({
      id,
      user_id: userId,
      bio: input.bio ?? null,
      expertise: input.expertise ?? ['astrology'],
      languages: input.languages ?? ['tr'],
      session_price: String(input.session_price),
      session_duration: input.session_duration,
      supports_video: 0,
      currency: input.currency.toUpperCase(),
      agreement_accepted_at: input.agreement_accepted === true ? now : null,
      approval_status: 'pending',
      is_available: 1,
      created_at: now,
      updated_at: now,
    } as any);

    await tx.insert(resources).values({
      id: resourceId,
      type: 'consultant',
      title: `Consultant ${userId.slice(0, 8)}`,
      capacity: 1,
      external_ref_id: id,
      is_active: 0,
      created_at: now,
      updated_at: now,
    } as any);

    await tx.execute(sql`UPDATE users SET role = 'consultant', updated_at = NOW(3) WHERE id = ${userId}`);
    await tx.execute(sql`
      INSERT INTO user_roles (id, user_id, role)
      VALUES (${randomUUID()}, ${userId}, 'consultant')
      ON DUPLICATE KEY UPDATE role = VALUES(role)
    `);
  });

  return getConsultantById(id);
}
