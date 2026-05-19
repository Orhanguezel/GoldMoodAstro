import { and, asc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { serviceTemplates, type NewServiceTemplate, type ServiceTemplate } from './schema';

export async function list(opts?: { category_slug?: string; activeOnly?: boolean }): Promise<ServiceTemplate[]> {
  const where = [
    opts?.category_slug ? eq(serviceTemplates.category_slug, opts.category_slug) : undefined,
    opts?.activeOnly ? eq(serviceTemplates.is_active, 1) : undefined,
  ].filter(Boolean);

  return db
    .select()
    .from(serviceTemplates)
    .where(where.length ? and(...(where as any)) : undefined)
    .orderBy(asc(serviceTemplates.category_slug), asc(serviceTemplates.sort_order), asc(serviceTemplates.name));
}

export async function getById(id: string): Promise<ServiceTemplate | undefined> {
  const [row] = await db.select().from(serviceTemplates).where(eq(serviceTemplates.id, id)).limit(1);
  return row;
}

export async function create(data: NewServiceTemplate): Promise<void> {
  await db.insert(serviceTemplates).values(data);
}

export async function update(id: string, patch: Partial<NewServiceTemplate>): Promise<void> {
  await db.update(serviceTemplates).set(patch).where(eq(serviceTemplates.id, id));
}

export async function remove(id: string): Promise<void> {
  await db.delete(serviceTemplates).where(eq(serviceTemplates.id, id));
}
