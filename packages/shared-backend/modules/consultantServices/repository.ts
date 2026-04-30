// packages/shared-backend/modules/consultantServices/repository.ts
import { db } from '../../db/client';
import { consultantServices, type ConsultantService, type NewConsultantService } from './schema';
import { and, asc, eq } from 'drizzle-orm';

export async function listByConsultant(
  consultantId: string,
  opts?: { activeOnly?: boolean },
): Promise<ConsultantService[]> {
  const where = opts?.activeOnly
    ? and(eq(consultantServices.consultant_id, consultantId), eq(consultantServices.is_active, 1))
    : eq(consultantServices.consultant_id, consultantId);

  return db
    .select()
    .from(consultantServices)
    .where(where)
    .orderBy(asc(consultantServices.sort_order), asc(consultantServices.created_at));
}

export async function getById(id: string): Promise<ConsultantService | undefined> {
  const [row] = await db.select().from(consultantServices).where(eq(consultantServices.id, id)).limit(1);
  return row;
}

export async function getByIdForConsultant(id: string, consultantId: string): Promise<ConsultantService | undefined> {
  const [row] = await db
    .select()
    .from(consultantServices)
    .where(and(eq(consultantServices.id, id), eq(consultantServices.consultant_id, consultantId)))
    .limit(1);
  return row;
}

export async function create(data: NewConsultantService): Promise<void> {
  await db.insert(consultantServices).values(data);
}

export async function update(id: string, patch: Partial<NewConsultantService>): Promise<void> {
  await db.update(consultantServices).set(patch).where(eq(consultantServices.id, id));
}

export async function remove(id: string): Promise<void> {
  await db.delete(consultantServices).where(eq(consultantServices.id, id));
}

export async function reorder(consultantId: string, items: Array<{ id: string; sort_order: number }>): Promise<void> {
  for (const it of items) {
    await db
      .update(consultantServices)
      .set({ sort_order: it.sort_order })
      .where(and(eq(consultantServices.id, it.id), eq(consultantServices.consultant_id, consultantId)));
  }
}
