import { and, eq, sql } from 'drizzle-orm';

import { db } from '../../db/client';
import { consultants } from '../consultants/schema';

function rowsOf<T>(result: unknown): T[] {
  return Array.isArray((result as any)?.[0]) ? ((result as any)[0] as T[]) : (result as T[]);
}

export async function findConsultantForUser(userId: string) {
  const [row] = await db
    .select({ id: consultants.id, user_id: consultants.user_id })
    .from(consultants)
    .where(and(eq(consultants.user_id, userId), eq(consultants.approval_status, 'approved')))
    .limit(1);

  return row ?? null;
}

export async function upsertConsultantHeartbeat(consultantId: string) {
  await db.execute(sql`
    INSERT INTO consultant_presence (consultant_id, last_heartbeat_at, became_online_at, updated_at)
    VALUES (${consultantId}, NOW(3), NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE
      became_online_at = IF(last_heartbeat_at <= (NOW(3) - INTERVAL 2 MINUTE), NOW(3), became_online_at),
      last_heartbeat_at = NOW(3),
      updated_at = NOW(3)
  `);

  const result = await db.execute(sql`
    SELECT
      consultant_id,
      last_heartbeat_at,
      became_online_at,
      last_heartbeat_at > (NOW(3) - INTERVAL 2 MINUTE) AS is_online
    FROM consultant_presence
    WHERE consultant_id = ${consultantId}
    LIMIT 1
  `);

  const row = rowsOf<any>(result)[0];
  return {
    consultant_id: consultantId,
    last_heartbeat_at: row?.last_heartbeat_at ?? null,
    became_online_at: row?.became_online_at ?? null,
    is_online: Boolean(row?.is_online),
  };
}

