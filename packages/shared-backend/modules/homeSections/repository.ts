// packages/shared-backend/modules/homeSections/repository.ts
import { db } from '../../db/client';
import { homeSections, type HomeSection, type NewHomeSection } from './schema';
import { asc, eq } from 'drizzle-orm';

export async function listAll(): Promise<HomeSection[]> {
  return db.select().from(homeSections).orderBy(asc(homeSections.order_index));
}

export async function listActive(): Promise<HomeSection[]> {
  return db
    .select()
    .from(homeSections)
    .where(eq(homeSections.is_active, 1))
    .orderBy(asc(homeSections.order_index));
}

export async function getById(id: string): Promise<HomeSection | undefined> {
  const [row] = await db.select().from(homeSections).where(eq(homeSections.id, id)).limit(1);
  return row;
}

export async function create(data: NewHomeSection): Promise<void> {
  await db.insert(homeSections).values(data);
}

export async function update(id: string, patch: Partial<NewHomeSection>): Promise<void> {
  await db.update(homeSections).set(patch).where(eq(homeSections.id, id));
}

export async function remove(id: string): Promise<void> {
  await db.delete(homeSections).where(eq(homeSections.id, id));
}

export async function bulkReorder(items: Array<{ id: string; order_index: number }>): Promise<void> {
  for (const it of items) {
    await db.update(homeSections).set({ order_index: it.order_index }).where(eq(homeSections.id, it.id));
  }
}
