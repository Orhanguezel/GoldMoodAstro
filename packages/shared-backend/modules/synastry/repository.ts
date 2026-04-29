// packages/shared-backend/modules/synastry/repository.ts
import { db } from '../../db/client';
import { synastryReports } from './schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, desc, and, or } from 'drizzle-orm';

export async function createSynastryReport(data: any) {
  const id = data.id || uuidv4();
  const row = { ...data, id };
  await db.insert(synastryReports).values(row);
  return row;
}

export async function getMySynastryReports(userId: string) {
  return db.select()
    .from(synastryReports)
    .where(
      or(
        eq(synastryReports.userId, userId),
        and(eq(synastryReports.partnerUserId, userId), eq(synastryReports.inviteStatus, 'accepted'))
      )
    )
    .orderBy(desc(synastryReports.createdAt));
}

export async function getPendingInvites(userId: string) {
  return db.select()
    .from(synastryReports)
    .where(
      and(
        eq(synastryReports.partnerUserId, userId),
        eq(synastryReports.inviteStatus, 'pending')
      )
    )
    .orderBy(desc(synastryReports.createdAt));
}

export async function updateSynastryReport(id: string, data: any) {
  await db.update(synastryReports).set(data).where(eq(synastryReports.id, id));
  return getSynastryReportById(id);
}

export async function getSynastryReportById(id: string) {
  const rows = await db.select().from(synastryReports).where(eq(synastryReports.id, id)).limit(1);
  return rows[0] || null;
}
