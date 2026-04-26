// =============================================================
// FILE: src/modules/announcements/repository.ts
// =============================================================
import { randomUUID } from "crypto";
import { and, asc, desc, eq, gte, isNull, like, lte, or } from "drizzle-orm";

import { db } from "../../db/client";
import { announcements, type AnnouncementRow } from "./schema";
import type { AdminListQuery, CreateBody, PublicListQuery, UpdateBody } from "./validation";

function normalizeDates<T extends { starts_at?: Date | null; ends_at?: Date | null }>(body: T) {
  return {
    ...body,
    starts_at: body.starts_at ?? null,
    ends_at: body.ends_at ?? null,
  };
}

export async function repoListPublic(q: PublicListQuery): Promise<AnnouncementRow[]> {
  const now = new Date();
  const audienceConds = q.include_all
    ? or(eq(announcements.audience, "all"), eq(announcements.audience, q.audience))
    : eq(announcements.audience, q.audience);

  const rows = await db
    .select()
    .from(announcements)
    .where(and(
      eq(announcements.is_active, 1),
      audienceConds,
      or(isNull(announcements.starts_at), lte(announcements.starts_at, now)),
      or(isNull(announcements.ends_at), gte(announcements.ends_at, now)),
    ))
    .orderBy(desc(announcements.created_at), asc(announcements.id))
    .limit(q.limit)
    .offset(q.offset);

  return rows;
}

export async function repoListAdmin(q: AdminListQuery): Promise<AnnouncementRow[]> {
  const conds = [
    q.audience ? eq(announcements.audience, q.audience) : undefined,
    typeof q.is_active === "boolean" ? eq(announcements.is_active, q.is_active ? 1 : 0) : undefined,
    q.q ? or(like(announcements.title, `%${q.q}%`), like(announcements.body, `%${q.q}%`)) : undefined,
  ].filter(Boolean) as any[];

  const query = db
    .select()
    .from(announcements)
    .where(conds.length ? and(...conds) : undefined as any)
    .orderBy(desc(announcements.created_at), asc(announcements.id))
    .limit(q.limit)
    .offset(q.offset);

  return await query;
}

export async function repoGetById(id: string): Promise<AnnouncementRow | null> {
  const [row] = await db
    .select()
    .from(announcements)
    .where(eq(announcements.id, id))
    .limit(1);

  return row ?? null;
}

export async function repoCreate(body: CreateBody): Promise<AnnouncementRow> {
  const id = randomUUID();
  const now = new Date();
  const values = normalizeDates(body);

  await db.insert(announcements).values({
    id,
    title: values.title,
    body: values.body,
    audience: values.audience,
    is_active: values.is_active ? 1 : 0,
    starts_at: values.starts_at,
    ends_at: values.ends_at,
    created_at: now,
    updated_at: now,
  });

  const created = await repoGetById(id);
  if (!created) throw new Error("announcement_create_failed");
  return created;
}

export async function repoUpdate(id: string, body: UpdateBody): Promise<AnnouncementRow | null> {
  const set: Record<string, unknown> = { updated_at: new Date() };

  if (body.title !== undefined) set.title = body.title;
  if (body.body !== undefined) set.body = body.body;
  if (body.audience !== undefined) set.audience = body.audience;
  if (body.is_active !== undefined) set.is_active = body.is_active ? 1 : 0;
  if (body.starts_at !== undefined) set.starts_at = body.starts_at ?? null;
  if (body.ends_at !== undefined) set.ends_at = body.ends_at ?? null;

  await db.update(announcements).set(set as any).where(eq(announcements.id, id));
  return repoGetById(id);
}

export async function repoDelete(id: string): Promise<void> {
  await db.delete(announcements).where(eq(announcements.id, id));
}

export async function repoSetActive(id: string, isActive: boolean): Promise<AnnouncementRow | null> {
  await db
    .update(announcements)
    .set({ is_active: isActive ? 1 : 0, updated_at: new Date() })
    .where(eq(announcements.id, id));

  return repoGetById(id);
}
