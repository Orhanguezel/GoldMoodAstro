import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '../../db/client';
import { languages, type NewLanguage } from './schema';

export async function list(opts?: { activeOnly?: boolean }) {
  return db
    .select()
    .from(languages)
    .where(opts?.activeOnly ? eq(languages.is_active, 1) : undefined)
    .orderBy(asc(languages.sort_order), asc(languages.slug));
}

export async function getById(id: string) {
  const [row] = await db.select().from(languages).where(eq(languages.id, id)).limit(1);
  return row ?? null;
}

export async function getBySlug(slug: string) {
  const [row] = await db.select().from(languages).where(eq(languages.slug, slug)).limit(1);
  return row ?? null;
}

export async function listActiveBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];
  return db
    .select({ slug: languages.slug })
    .from(languages)
    .where(and(eq(languages.is_active, 1), inArray(languages.slug, slugs)));
}

export async function create(data: NewLanguage) {
  await db.insert(languages).values(data);
}

export async function update(id: string, patch: Partial<NewLanguage>) {
  await db.update(languages).set(patch).where(eq(languages.id, id));
}

export async function remove(id: string) {
  await db.delete(languages).where(eq(languages.id, id));
}
