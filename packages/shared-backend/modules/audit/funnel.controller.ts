import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { handleRouteError } from '../_shared';
import { repoPersistAuditEvent } from './repository';

const FUNNEL_STEPS = [
  'page_view',
  'signup_start',
  'signup_complete',
  'consultant_view',
  'service_select',
  'booking_start',
  'booking_payment',
  'booking_completed',
  'session_started',
  'session_completed',
] as const;

const trackEventSchema = z.object({
  event_name: z.enum(FUNNEL_STEPS),
  session_id: z.string().trim().max(120).optional(),
  properties: z.record(z.unknown()).optional().default({}),
  occurred_at: z.string().datetime().optional(),
});

const rangeQuerySchema = z.object({
  range: z.string().trim().regex(/^\d+[dw]$/).default('30d'),
  segment: z.string().trim().max(80).optional(),
});

const cohortQuerySchema = z.object({
  metric: z.enum(['booking', 'activity']).default('booking'),
  range: z.string().trim().regex(/^\d+w$/).default('12w'),
});

function userIdFromRequest(req: FastifyRequest): string | null {
  const user = (req as FastifyRequest & { user?: { sub?: string; id?: string } }).user;
  return user?.sub ?? user?.id ?? null;
}

function rowsFromExecute<T = any>(result: unknown): T[] {
  return (Array.isArray((result as any)?.[0]) ? (result as any)[0] : (result as any)) as T[];
}

function rangeToDays(value: string): number {
  const match = value.match(/^(\d+)([dw])$/);
  if (!match) return 30;
  const amount = Math.max(1, Math.min(Number(match[1]), 104));
  return match[2] === 'w' ? amount * 7 : amount;
}

function intervalExpr(days: number) {
  return sql.raw(`DATE_SUB(NOW(3), INTERVAL ${Math.max(1, Math.min(days, 728))} DAY)`);
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return '{}';
  }
}

export async function trackEventPublic(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = trackEventSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
    }

    const userId = userIdFromRequest(req);
    await repoPersistAuditEvent({
      ts: parsed.data.occurred_at ?? new Date().toISOString(),
      level: 'info',
      topic: `funnel:${parsed.data.event_name}`,
      message: parsed.data.event_name,
      actor_user_id: userId,
      ip: req.ip ?? null,
      entity: userId ? { type: 'user', id: userId } : null,
      meta: {
        session_id: parsed.data.session_id ?? null,
        properties: parsed.data.properties,
        user_agent: req.headers['user-agent'] ?? null,
        referer: req.headers.referer ?? req.headers.referrer ?? null,
      },
    });

    return reply.code(202).send({ ok: true });
  } catch (e) {
    return handleRouteError(reply, req, e, 'track_event_public');
  }
}

export async function getFunnelReportAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = rangeQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.issues } });

    const days = rangeToDays(parsed.data.range);
    const segment = parsed.data.segment ?? '';
    const segmentCond = segment
      ? sql`AND JSON_UNQUOTE(JSON_EXTRACT(meta_json, '$.properties.segment')) = ${segment}`
      : sql``;

    const rows = rowsFromExecute<{ event_name: string; count: number }>(await db.execute(sql`
      SELECT REPLACE(topic, 'funnel:', '') AS event_name, COUNT(*) AS count
      FROM audit_events
      WHERE topic LIKE 'funnel:%'
        AND ts >= ${intervalExpr(days)}
        ${segmentCond}
      GROUP BY topic
    `));
    const counts = new Map(rows.map((row) => [String(row.event_name), Number(row.count ?? 0)]));
    const first = counts.get('page_view') || 0;
    const steps = FUNNEL_STEPS.map((step, index) => {
      const count = counts.get(step) || 0;
      const previous = index === 0 ? count : (counts.get(FUNNEL_STEPS[index - 1]) || 0);
      return {
        step,
        count,
        drop_off_rate: previous > 0 ? Number((((previous - count) / previous) * 100).toFixed(2)) : 0,
        conversion_from_start: first > 0 ? Number(((count / first) * 100).toFixed(2)) : 0,
      };
    });

    return reply.send({ data: { range: parsed.data.range, days, segment: segment || null, steps } });
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_funnel_report');
  }
}

export async function getUserActivityAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = String((req.params as { id?: string })?.id ?? '').trim();
    if (!userId) return reply.code(400).send({ error: { message: 'user_id_required' } });
    const parsed = rangeQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.issues } });
    const days = rangeToDays(parsed.data.range);

    const events = rowsFromExecute(await db.execute(sql`
      SELECT 'event' AS source, ts AS occurred_at, topic, message, entity_type, entity_id, meta_json
      FROM audit_events
      WHERE actor_user_id = ${userId}
        AND ts >= ${intervalExpr(days)}
      UNION ALL
      SELECT 'request' AS source, created_at AS occurred_at, path AS topic, method AS message, NULL AS entity_type, NULL AS entity_id, request_body AS meta_json
      FROM audit_request_logs
      WHERE user_id = ${userId}
        AND created_at >= ${intervalExpr(days)}
      ORDER BY occurred_at DESC
      LIMIT 300
    `));

    const summaryRows = rowsFromExecute(await db.execute(sql`
      SELECT
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = ${userId} AND payment_status IN ('paid','success')) AS total_spend,
        (SELECT COUNT(*) FROM bookings WHERE user_id = ${userId}) AS booking_count,
        (SELECT MAX(created_at) FROM audit_request_logs WHERE user_id = ${userId}) AS last_active
    `));

    return reply.send({ data: { user_id: userId, range: parsed.data.range, summary: summaryRows[0] ?? {}, events } });
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_user_activity');
  }
}

export async function getCohortsAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = cohortQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.issues } });
    const weeks = Math.max(1, Math.min(Number(parsed.data.range.replace('w', '')), 24));

    const topicFilter = parsed.data.metric === 'booking'
      ? sql`AND ae.topic IN ('funnel:booking_completed', 'funnel:session_completed')`
      : sql`AND ae.topic LIKE 'funnel:%'`;

    const rows = rowsFromExecute(await db.execute(sql`
      SELECT
        YEARWEEK(u.created_at, 3) AS cohort_week,
        FLOOR(TIMESTAMPDIFF(DAY, DATE(u.created_at), DATE(ae.ts)) / 7) AS week_index,
        COUNT(DISTINCT u.id) AS active_users
      FROM users u
      LEFT JOIN audit_events ae ON ae.actor_user_id = u.id
        AND ae.ts >= u.created_at
        ${topicFilter}
      WHERE u.created_at >= ${intervalExpr(weeks * 7)}
      GROUP BY cohort_week, week_index
      ORDER BY cohort_week ASC, week_index ASC
    `));

    const sizes = rowsFromExecute(await db.execute(sql`
      SELECT YEARWEEK(created_at, 3) AS cohort_week, COUNT(*) AS users
      FROM users
      WHERE created_at >= ${intervalExpr(weeks * 7)}
      GROUP BY cohort_week
      ORDER BY cohort_week ASC
    `));

    return reply.send({ data: { metric: parsed.data.metric, range: parsed.data.range, cohorts: sizes, retention: rows } });
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_cohorts');
  }
}

export async function getTrafficSourcesAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = rangeQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.issues } });
    const days = rangeToDays(parsed.data.range);

    const rows = rowsFromExecute(await db.execute(sql`
      SELECT
        COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(meta_json, '$.properties.utm_source')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(meta_json, '$.properties.referrer')), ''), 'direct') AS source,
        COUNT(DISTINCT JSON_UNQUOTE(JSON_EXTRACT(meta_json, '$.session_id'))) AS visitors,
        COUNT(DISTINCT CASE WHEN topic = 'funnel:signup_complete' THEN COALESCE(actor_user_id, JSON_UNQUOTE(JSON_EXTRACT(meta_json, '$.session_id'))) END) AS signups,
        COUNT(DISTINCT CASE WHEN topic IN ('funnel:booking_completed','funnel:session_completed') THEN COALESCE(actor_user_id, JSON_UNQUOTE(JSON_EXTRACT(meta_json, '$.session_id'))) END) AS bookings,
        COALESCE(SUM(CASE WHEN topic = 'funnel:booking_completed' THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(meta_json, '$.properties.amount')) AS DECIMAL(14,2)) ELSE 0 END), 0) AS revenue
      FROM audit_events
      WHERE topic LIKE 'funnel:%'
        AND ts >= ${intervalExpr(days)}
      GROUP BY source
      ORDER BY visitors DESC
      LIMIT 100
    `));

    return reply.send({ data: rows.map((row: any) => ({
      ...row,
      visitors: Number(row.visitors ?? 0),
      signups: Number(row.signups ?? 0),
      bookings: Number(row.bookings ?? 0),
      revenue: Number(row.revenue ?? 0),
      signup_conversion: Number(row.visitors) > 0 ? Number(((Number(row.signups ?? 0) / Number(row.visitors)) * 100).toFixed(2)) : 0,
      booking_conversion: Number(row.visitors) > 0 ? Number(((Number(row.bookings ?? 0) / Number(row.visitors)) * 100).toFixed(2)) : 0,
    })) });
  } catch (e) {
    return handleRouteError(reply, req, e, 'get_traffic_sources');
  }
}
