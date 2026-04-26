import type { RouteHandler } from 'fastify';
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
