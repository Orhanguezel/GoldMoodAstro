// packages/shared-backend/modules/consultantServices/repository.ts
import { db } from '../../db/client';
import { consultantServices, type ConsultantService, type NewConsultantService } from './schema';
import { and, asc, eq, sql } from 'drizzle-orm';
import { consultants } from '../consultants/schema';

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

/**
 * T39-3: Syncs the 'supports_video' flag on the consultant profile
 * based on whether they have at least one active video-capable service.
 */
async function syncConsultantFlags(consultantId: string): Promise<void> {
  const [result] = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(consultantServices)
    .where(
      and(
        eq(consultantServices.consultant_id, consultantId),
        eq(consultantServices.is_active, 1),
        eq(consultantServices.media_type, 'video')
      )
    );

  const hasVideo = (result?.count ?? 0) > 0;

  await db
    .update(consultants)
    .set({ supports_video: hasVideo ? 1 : 0 } as any)
    .where(eq(consultants.id, consultantId));
}

// Wrappers to include sync
export async function createWithSync(data: NewConsultantService): Promise<void> {
  await create(data);
  await syncConsultantFlags(data.consultant_id);
}

export async function updateWithSync(id: string, consultantId: string, patch: Partial<NewConsultantService>): Promise<void> {
  await update(id, patch);
  await syncConsultantFlags(consultantId);
}

export async function removeWithSync(id: string, consultantId: string): Promise<void> {
  await remove(id);
  await syncConsultantFlags(consultantId);
}
