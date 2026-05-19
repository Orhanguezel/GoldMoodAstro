import { asc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { serviceCategories, type NewServiceCategory, type ServiceCategory } from './schema';
import { serviceTemplates } from '../serviceTemplates/schema';

export async function list(opts?: { activeOnly?: boolean }): Promise<ServiceCategory[]> {
  return db
    .select()
    .from(serviceCategories)
    .where(opts?.activeOnly ? eq(serviceCategories.is_active, 1) : undefined)
    .orderBy(asc(serviceCategories.sort_order), asc(serviceCategories.name));
}

export async function getById(id: string): Promise<ServiceCategory | undefined> {
  const [row] = await db.select().from(serviceCategories).where(eq(serviceCategories.id, id)).limit(1);
  return row;
}

export async function getBySlug(slug: string): Promise<ServiceCategory | undefined> {
  const [row] = await db.select().from(serviceCategories).where(eq(serviceCategories.slug, slug)).limit(1);
  return row;
}

export async function create(data: NewServiceCategory): Promise<void> {
  await db.insert(serviceCategories).values(data);
}

export async function update(id: string, patch: Partial<NewServiceCategory>): Promise<void> {
  await db.update(serviceCategories).set(patch).where(eq(serviceCategories.id, id));
}

export async function remove(id: string): Promise<void> {
  await db.delete(serviceCategories).where(eq(serviceCategories.id, id));
}

export async function countTemplatesForSlug(categorySlug: string): Promise<number> {
  const [row] = await db
    .select({ c: sql<number>`COUNT(*)` })
    .from(serviceTemplates)
    .where(eq(serviceTemplates.category_slug, categorySlug));
  return Number(row?.c ?? 0);
}
