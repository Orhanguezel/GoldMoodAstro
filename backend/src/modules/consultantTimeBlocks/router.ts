import type { FastifyInstance, RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { requireAuth } from '@goldmood/shared-backend/middleware/auth';
import { db } from '@/db/client';
import { computeDayAvailability, normalizeHm, timeToMinutes } from '@/modules/consultants/interval-availability';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);

const blockBodySchema = z.object({
  block_date: dateSchema,
  start_time: timeSchema,
  end_time: timeSchema,
  reason: z.string().trim().max(160).optional().nullable(),
});

function userIdFromRequest(req: Parameters<RouteHandler>[0]) {
  const user = req.user as { sub?: string; id?: string } | undefined;
  return user?.sub ?? user?.id ?? null;
}

function rowsFromResult<T>(result: unknown): T[] {
  return Array.isArray((result as any)?.[0]) ? (result as any)[0] : ((result as any) ?? []);
}

async function getMyConsultantId(userId: string) {
  const result = await db.execute(sql`
    SELECT id
    FROM consultants
    WHERE user_id = ${userId}
    LIMIT 1
  `);
  const rows = rowsFromResult<{ id: string }>(result);
  return rows[0]?.id ?? null;
}

const listBlocksHandler: RouteHandler = async (req, reply) => {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'unauthorized' } });
  const consultantId = await getMyConsultantId(userId);
  if (!consultantId) return reply.code(404).send({ error: { message: 'consultant_not_found' } });

  const date = dateSchema.optional().parse((req.query as { date?: string } | undefined)?.date);
  const result = date
    ? await db.execute(sql`
        SELECT id, consultant_id, block_date, start_time, end_time, reason, created_at
        FROM consultant_time_blocks
        WHERE consultant_id = ${consultantId} AND block_date = ${date}
        ORDER BY start_time ASC
      `)
    : await db.execute(sql`
        SELECT id, consultant_id, block_date, start_time, end_time, reason, created_at
        FROM consultant_time_blocks
        WHERE consultant_id = ${consultantId} AND block_date >= CURDATE()
        ORDER BY block_date ASC, start_time ASC
        LIMIT 200
      `);
  const data = rowsFromResult<any>(result).map((row) => ({
    ...row,
    block_date: String(row.block_date).slice(0, 10),
    start_time: normalizeHm(row.start_time),
    end_time: normalizeHm(row.end_time),
  }));
  return { data };
};

const createBlockHandler: RouteHandler = async (req, reply) => {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'unauthorized' } });
  const consultantId = await getMyConsultantId(userId);
  if (!consultantId) return reply.code(404).send({ error: { message: 'consultant_not_found' } });

  const body = blockBodySchema.parse(req.body ?? {});
  const start = timeToMinutes(body.start_time);
  const end = timeToMinutes(body.end_time);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return reply.code(400).send({ error: { message: 'invalid_time_range' } });
  }

  const overlapResult = await db.execute(sql`
    SELECT id
    FROM consultant_time_blocks
    WHERE consultant_id = ${consultantId}
      AND block_date = ${body.block_date}
      AND start_time < ${body.end_time}
      AND ${body.start_time} < end_time
    LIMIT 1
  `);
  if (rowsFromResult(overlapResult)[0]) {
    return reply.code(409).send({ error: { message: 'time_block_conflict' } });
  }

  const id = randomUUID();
  await db.execute(sql`
    INSERT INTO consultant_time_blocks (id, consultant_id, block_date, start_time, end_time, reason)
    VALUES (${id}, ${consultantId}, ${body.block_date}, ${body.start_time}, ${body.end_time}, ${body.reason ?? null})
  `);

  return reply.code(201).send({
    data: {
      id,
      consultant_id: consultantId,
      block_date: body.block_date,
      start_time: body.start_time,
      end_time: body.end_time,
      reason: body.reason ?? null,
    },
  });
};

const deleteBlockHandler: RouteHandler = async (req, reply) => {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'unauthorized' } });
  const consultantId = await getMyConsultantId(userId);
  if (!consultantId) return reply.code(404).send({ error: { message: 'consultant_not_found' } });

  const id = z.string().uuid().parse((req.params as { id?: string } | undefined)?.id);
  await db.execute(sql`
    DELETE FROM consultant_time_blocks
    WHERE id = ${id} AND consultant_id = ${consultantId}
  `);
  return { data: { id, ok: true } };
};

const dayTimelineHandler: RouteHandler = async (req, reply) => {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'unauthorized' } });
  const consultantId = await getMyConsultantId(userId);
  if (!consultantId) return reply.code(404).send({ error: { message: 'consultant_not_found' } });

  const date = dateSchema.parse((req.query as { date?: string } | undefined)?.date);
  const availability = await computeDayAvailability(consultantId, date, 15);

  const bookingResult = await db.execute(sql`
    SELECT id, appointment_time AS start_time,
           ADDTIME(appointment_time, SEC_TO_TIME(COALESCE(session_duration, 30) * 60)) AS end_time,
           name AS label,
           status
    FROM bookings
    WHERE consultant_id = ${consultantId}
      AND appointment_date = ${date}
      AND status IN ('pending_payment', 'booked', 'confirmed', 'active')
      AND appointment_time IS NOT NULL
    ORDER BY appointment_time ASC
  `);
  const bookings = rowsFromResult<any>(bookingResult).map((row) => ({
    id: row.id,
    kind: 'booking' as const,
    start: normalizeHm(row.start_time),
    end: normalizeHm(row.end_time),
    label: row.label ?? null,
    status: row.status ?? null,
  }));

  const blocks = availability.busy
    .filter((item) => item.kind === 'block')
    .map((item, index) => ({ ...item, id: `block-${index}`, kind: 'block' as const }));

  return {
    data: {
      date,
      windows: availability.windows,
      events: [...bookings, ...blocks].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)),
    },
  };
};

export async function registerConsultantTimeBlocks(app: FastifyInstance) {
  app.get('/me/consultant/time-blocks', { preHandler: [requireAuth] }, listBlocksHandler);
  app.post('/me/consultant/time-blocks', { preHandler: [requireAuth] }, createBlockHandler);
  app.delete('/me/consultant/time-blocks/:id', { preHandler: [requireAuth] }, deleteBlockHandler);
  app.get('/me/consultant/day-timeline', { preHandler: [requireAuth] }, dayTimelineHandler);
}
