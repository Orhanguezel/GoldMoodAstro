// =============================================================
// FILE: src/modules/availability/controller.ts
// FINAL — LOCKED — Public availability controller
// =============================================================

import type { RouteHandler } from 'fastify';

import {
  publicListWorkingHoursQuerySchema,
  publicAvailabilitySlotsQuerySchema,
  publicSlotAvailabilityQuerySchema,
  publicWeeklyPlanQuerySchema,
} from './validation';

import {
  assertPublicResourceActive,
  listWorkingHoursPublic,
  getWeeklyPlanFromWorkingHours,
  getDailyPlanMerged,
  getAvailability,
} from './repository';

/** GET /availability/working-hours?resource_id=... */
export const listWorkingHoursPublicHandler: RouteHandler = async (req, reply) => {
  try {
    const q = publicListWorkingHoursQuerySchema.parse((req as any).query ?? {});
    const rows = await listWorkingHoursPublic({ resource_id: q.resource_id });
    return reply.send(rows);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'working_hours_public_list_failed' } });
  }
};

/**
 * GET /availability/slots?resource_id=...&date=YYYY-MM-DD
 * PUBLIC RULE: returns only "available" slots (revized/inactive/full are hidden)
 */
export const listAvailabilitySlotsPublic: RouteHandler = async (req, reply) => {
  try {
    const q = publicAvailabilitySlotsQuerySchema.parse((req as any).query ?? {});

    const ok = await assertPublicResourceActive({ resource_id: q.resource_id });
    if (!ok.ok) return reply.code(404).send({ error: { message: 'resource_not_found' } });

    const plan = await getDailyPlanMerged({ resource_id: q.resource_id, dateYmd: q.date });

    // ✅ Hide revized/unavailable
    const out = plan.filter((p) => p.available === true && p.is_active === 1);

    return reply.send(out);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'availability_list_failed' } });
  }
};

/**
 * GET /availability?resource_id=...&date=YYYY-MM-DD&time=HH:mm
 * exact availability check
 */
export const getAvailabilityPublic: RouteHandler = async (req, reply) => {
  try {
    const q = publicSlotAvailabilityQuerySchema.parse((req as any).query ?? {});

    const ok = await assertPublicResourceActive({ resource_id: q.resource_id });
    if (!ok.ok) return reply.code(404).send({ error: { message: 'resource_not_found' } });

    const out = await getAvailability({
      resource_id: q.resource_id,
      dateYmd: q.date,
      timeHm: q.time,
    });

    return reply.send(out);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'availability_get_failed' } });
  }
};

/** GET /availability/weekly-plan?resource_id=...&type=... (type optional) */
export const getWeeklyPlanPublic: RouteHandler = async (req, reply) => {
  try {
    const q = publicWeeklyPlanQuerySchema.parse((req as any).query ?? {});

    const ok = await assertPublicResourceActive({
      resource_id: q.resource_id,
      type: q.type,
    });
    if (!ok.ok) return reply.code(404).send({ error: { message: 'resource_not_found' } });

    const plan = await getWeeklyPlanFromWorkingHours({ resource_id: q.resource_id });
    return reply.send(plan);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'weekly_plan_public_get_failed' } });
  }
};
