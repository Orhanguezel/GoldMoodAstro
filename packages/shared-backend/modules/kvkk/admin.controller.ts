import type { FastifyReply, FastifyRequest } from 'fastify';
import { sql } from 'drizzle-orm';
import { db } from '../../db/client';

type AccountDeletionStatus = 'pending' | 'cancelled' | 'completed';

const STATUSES = new Set<AccountDeletionStatus>(['pending', 'cancelled', 'completed']);

function clampLimit(value: unknown) {
  const n = Number(value ?? 50);
  if (!Number.isFinite(n)) return 50;
  return Math.max(1, Math.min(100, Math.trunc(n)));
}

function clampOffset(value: unknown) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.trunc(n));
}

function readRows<T>(result: unknown): T[] {
  const tupleRows = (result as unknown[])?.[0];
  if (Array.isArray(tupleRows)) return tupleRows as T[];
  return Array.isArray(result) ? (result as T[]) : [];
}

export async function listAccountDeletionRequestsAdmin(req: FastifyRequest, reply: FastifyReply) {
  const query = (req.query ?? {}) as {
    status?: AccountDeletionStatus | 'all';
    limit?: string | number;
    offset?: string | number;
  };
  const status = query.status && STATUSES.has(query.status as AccountDeletionStatus)
    ? (query.status as AccountDeletionStatus)
    : 'pending';
  const limit = clampLimit(query.limit);
  const offset = clampOffset(query.offset);

  const where = status === 'pending'
    ? sql`WHERE adr.status = 'pending'`
    : sql`WHERE adr.status = ${status}`;

  const rows = readRows(await db.execute(sql`
    SELECT
      adr.id,
      adr.user_id,
      adr.requested_at,
      adr.scheduled_for,
      adr.status,
      adr.cancelled_at,
      adr.completed_at,
      adr.reason,
      adr.ip_address,
      adr.created_at,
      adr.updated_at,
      u.email AS user_email,
      u.full_name AS user_full_name,
      u.role AS user_role,
      u.is_active AS user_is_active,
      TIMESTAMPDIFF(SECOND, NOW(3), adr.scheduled_for) AS seconds_until_deletion
    FROM account_deletion_requests adr
    LEFT JOIN users u ON u.id = adr.user_id
    ${where}
    ORDER BY
      CASE WHEN adr.status = 'pending' THEN 0 ELSE 1 END,
      adr.scheduled_for ASC,
      adr.requested_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `));

  const countRows = readRows<{ total: number }>(await db.execute(sql`
    SELECT COUNT(*) AS total
    FROM account_deletion_requests adr
    ${where}
  `));

  return reply.send({
    data: rows,
    meta: {
      status,
      limit,
      offset,
      total: Number(countRows[0]?.total ?? rows.length),
    },
  });
}
