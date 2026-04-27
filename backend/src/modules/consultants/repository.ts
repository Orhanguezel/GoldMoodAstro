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

function withUserSelect() {
  return {
    id: consultants.id,
    user_id: consultants.user_id,
    slug: consultants.slug,
    full_name: users.full_name,
    email: users.email,
    phone: users.phone,
    avatar_url: users.avatar_url,
    bio: consultants.bio,
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
    created_at: consultants.created_at,
    updated_at: consultants.updated_at,
  };
}

function expertisePredicate(expertise?: string): SQL | undefined {
  const value = expertise?.trim();
  if (!value) return undefined;
  return sql`JSON_CONTAINS(${consultants.expertise}, JSON_QUOTE(${value}))`;
}

export async function listApprovedConsultants(filters: ListConsultantsQuery) {
  const where = [
    eq(consultants.approval_status, 'approved'),
    eq(consultants.is_available, 1),
    expertisePredicate(filters.expertise),
    filters.minPrice != null ? gte(consultants.session_price, String(filters.minPrice)) : undefined,
    filters.maxPrice != null ? lte(consultants.session_price, String(filters.maxPrice)) : undefined,
    filters.minRating != null ? gte(consultants.rating_avg, String(filters.minRating)) : undefined,
  ].filter(Boolean) as SQL[];

  return db
    .select(withUserSelect())
    .from(consultants)
    .innerJoin(users, eq(users.id, consultants.user_id))
    .where(and(...where))
    .orderBy(desc(consultants.rating_avg), desc(consultants.total_sessions), asc(users.full_name));
}

export async function listConsultantsAdmin(filters: AdminListConsultantsQuery) {
  const where = filters.approval_status
    ? eq(consultants.approval_status, filters.approval_status)
    : undefined;

  const query = db.select(withUserSelect()).from(consultants).innerJoin(users, eq(users.id, consultants.user_id));

  return where
    ? query.where(where).orderBy(desc(consultants.created_at))
    : query.orderBy(desc(consultants.created_at));
}

// UUID v4 formatı: 8-4-4-4-12 hex blokları. Slug'lar bu kalıba uymaz.
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function getConsultantById(idOrSlug: string) {
  const where = UUID_RE.test(idOrSlug)
    ? or(eq(consultants.id, idOrSlug), eq(consultants.slug, idOrSlug))
    : eq(consultants.slug, idOrSlug);

  const [row] = await db
    .select({
      ...withUserSelect(),
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

export async function getApprovedConsultantById(id: string) {
  const row = await getConsultantById(id);
  if (!row || row.approval_status !== 'approved') return null;
  return row;
}

export async function getConsultantSlots(id: string, date: string) {
  const consultant = await getApprovedConsultantById(id);
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
