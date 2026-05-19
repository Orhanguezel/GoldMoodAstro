import type { RouteHandler } from 'fastify';
import { createHash, randomUUID } from 'crypto';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { hasAnyRole } from '@goldmood/shared-backend/middleware/roles';
import { getUserHistory } from '@goldmood/shared-backend/modules/history/repository';
import {
  adminListConsultantsQuerySchema,
  consultantIdParamsSchema,
  consultantSlotsQuerySchema,
  listConsultantsQuerySchema,
  registerConsultantBodySchema,
  rejectConsultantBodySchema,
} from './validation';
import {
  approveConsultant,
  createConsultantForUser,
  deleteConsultant,
  getApprovedConsultantById,
  getConsultantById,
  getConsultantSlots,
  listApprovedConsultants,
  listConsultantsAdmin,
  rejectConsultant,
} from './repository';

function userIdFromRequest(req: Parameters<RouteHandler>[0]) {
  const user = req.user as { sub?: string; id?: string } | undefined;
  return user?.sub ?? user?.id ?? null;
}

export const listConsultantsHandler: RouteHandler = async (req) => {
  const query = listConsultantsQuerySchema.parse(req.query ?? {});
  return { data: await listApprovedConsultants(query) };
};

export const getConsultantHandler: RouteHandler = async (req, reply) => {
  const { id } = consultantIdParamsSchema.parse(req.params ?? {});
  const row = await getApprovedConsultantById(id);
  if (!row) return reply.code(404).send({ error: { message: 'consultant_not_found' } });
  return { data: row };
};

export const getConsultantSlotsHandler: RouteHandler = async (req, reply) => {
  const { id } = consultantIdParamsSchema.parse(req.params ?? {});
  const query = consultantSlotsQuerySchema.parse(req.query ?? {});
  const result = await getConsultantSlots(id, query.date);
  if (!result.consultant) {
    return reply.code(404).send({ error: { message: 'consultant_not_found' } });
  }
  return { data: result.slots };
};

const BOT_UA_RE = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp/i;

export const trackConsultantViewHandler: RouteHandler = async (req, reply) => {
  const { id } = consultantIdParamsSchema.parse(req.params ?? {});
  const row = await getApprovedConsultantById(id);
  if (!row) return reply.code(404).send({ error: { message: 'consultant_not_found' } });

  const userAgent = String(req.headers['user-agent'] ?? '');
  if (BOT_UA_RE.test(userAgent)) return { data: { tracked: false, reason: 'bot' } };

  const userId = userIdFromRequest(req);
  const ipSeed = `${req.ip ?? ''}|${userAgent.slice(0, 160)}`;
  const ipHash = createHash('sha256').update(ipSeed).digest('hex');

  const existing = await db.execute(sql`
    SELECT id
    FROM consultant_profile_views
    WHERE consultant_id = ${row.id}
      AND viewed_at >= DATE_SUB(NOW(3), INTERVAL 30 MINUTE)
      AND (
        (${userId} IS NOT NULL AND viewer_user_id = ${userId})
        OR viewer_ip_hash = ${ipHash}
      )
    LIMIT 1
  `);
  const existingRows = Array.isArray((existing as any)?.[0]) ? (existing as any)[0] : (existing as any);
  if ((existingRows as any[])?.[0]) return { data: { tracked: false, reason: 'throttled' } };

  await db.execute(sql`
    INSERT INTO consultant_profile_views (id, consultant_id, viewer_user_id, viewer_ip_hash, viewed_at)
    VALUES (${randomUUID()}, ${row.id}, ${userId}, ${ipHash}, NOW(3))
  `);

  return { data: { tracked: true } };
};

export const registerConsultantHandler: RouteHandler = async (req, reply) => {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });

  const body = registerConsultantBodySchema.parse(req.body ?? {});

  try {
    const consultant = await createConsultantForUser(userId, body);
    return reply.code(201).send({ data: consultant });
  } catch (error: any) {
    if (String(error?.message ?? '').includes('Duplicate')) {
      return reply.code(409).send({ error: { message: 'consultant_already_exists' } });
    }
    throw error;
  }
};

export const listConsultantsAdminHandler: RouteHandler = async (req) => {
  const query = adminListConsultantsQuerySchema.parse(req.query ?? {});
  return { data: await listConsultantsAdmin(query) };
};

export const getConsultantAdminHandler: RouteHandler = async (req, reply) => {
  const { id } = consultantIdParamsSchema.parse(req.params ?? {});
  const row = await getConsultantById(id);
  if (!row) return reply.code(404).send({ error: { message: 'consultant_not_found' } });
  return { data: row };
};

export const approveConsultantAdminHandler: RouteHandler = async (req, reply) => {
  const { id } = consultantIdParamsSchema.parse(req.params ?? {});
  const row = await approveConsultant(id);
  if (!row) return reply.code(404).send({ error: { message: 'consultant_not_found' } });
  return { data: row };
};

export const rejectConsultantAdminHandler: RouteHandler = async (req, reply) => {
  const { id } = consultantIdParamsSchema.parse(req.params ?? {});
  const body = rejectConsultantBodySchema.parse(req.body ?? {});
  const row = await rejectConsultant(id, body.rejection_reason);
  if (!row) return reply.code(404).send({ error: { message: 'consultant_not_found' } });
  return { data: row };
};

export const deleteConsultantAdminHandler: RouteHandler = async (req, reply) => {
  const { id } = consultantIdParamsSchema.parse(req.params ?? {});
  const result = await deleteConsultant(id);
  if (result.ok) return reply.code(204).send();
  if (result.reason === 'not_found') {
    return reply.code(404).send({ error: { message: 'consultant_not_found' } });
  }
  if (result.reason === 'not_rejected') {
    return reply.code(409).send({
      error: { message: 'only_rejected_can_be_deleted' },
    });
  }
  return reply.code(409).send({ error: { message: 'consultant_has_dependencies' } });
};

export const getConsultantSessionUserReadingsAdminHandler: RouteHandler = async (req, reply) => {
  const currentUserId = userIdFromRequest(req);
  if (!currentUserId) return reply.code(401).send({ error: { message: 'no_user' } });

  if (!hasAnyRole(req, ['consultant', 'admin'])) {
    return reply.code(403).send({ error: { message: 'forbidden' } });
  }

  const bookingId = String((req.params as { bookingId?: string })?.bookingId ?? '').trim();
  if (!bookingId) return reply.code(400).send({ error: { message: 'booking_id_required' } });

  const limitRaw = Number((req.query as { limit?: string | number } | undefined)?.limit);
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 10, 1), 50);

  const result = await db.execute(sql`
    SELECT b.user_id AS customer_user_id, c.user_id AS consultant_user_id
    FROM bookings b
    INNER JOIN consultants c ON c.id = b.consultant_id
    WHERE b.id = ${bookingId}
    LIMIT 1
  `);
  const rows = Array.isArray((result as unknown as unknown[])?.[0])
    ? ((result as unknown as unknown[])[0] as Array<{ customer_user_id: string; consultant_user_id: string }>)
    : (result as unknown as Array<{ customer_user_id: string; consultant_user_id: string }>);
  const booking = rows?.[0];

  if (!booking) return reply.code(404).send({ error: { message: 'booking_not_found' } });

  const isAdmin = hasAnyRole(req, ['admin']);
  if (!isAdmin && booking.consultant_user_id !== currentUserId) {
    return reply.code(403).send({ error: { message: 'booking_not_owned_by_consultant' } });
  }

  const data = await getUserHistory(booking.customer_user_id, limit);
  return { data };
};
