import type { RouteHandler } from 'fastify';
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
