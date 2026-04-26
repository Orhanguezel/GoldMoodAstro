// =============================================================
// FILE: src/modules/availability/admin.controller.ts
// FINAL — LOCKED — Admin availability controller
// =============================================================

import type { RouteHandler } from 'fastify';
import { asc, eq, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { db } from '../../db/client';
import { resourceWorkingHours } from './schema';

import {
  adminListWorkingHoursQuerySchema,
  adminUpsertWorkingHourBodySchema,
  adminListSlotsQuerySchema,
  adminSlotAvailabilityQuerySchema,
  adminPlanQuerySchema,
  adminGenerateSlotsBodySchema,
  adminOverrideDayBodySchema,
  adminOverrideSlotBodySchema,
} from './validation';

import {
  getAvailability,
  listSlotsForDate,
  getDailyPlanMerged,
  generateMissingSlotsForDate,
  overrideDaySlots,
  overrideSingleSlot,
} from './repository';

import { toActive01, hmToTimeSql} from '../_shared';

const safeText = (v: unknown) => String(v ?? '').trim();


/** GET /admin/resource-working-hours?resource_id=... */
export const listWorkingHoursAdmin: RouteHandler = async (req, reply) => {
  try {
    const q = adminListWorkingHoursQuerySchema.parse((req as any).query ?? {});
    const rows = await db
      .select()
      .from(resourceWorkingHours)
      .where(eq(resourceWorkingHours.resource_id, q.resource_id))
      .orderBy(asc(resourceWorkingHours.dow), asc(resourceWorkingHours.start_time));

    return reply.send(rows);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'working_hours_list_failed' } });
  }
};

/** POST /admin/resource-working-hours (upsert by id; otherwise insert new) */
export const upsertWorkingHourAdmin: RouteHandler = async (req, reply) => {
  try {
    const body = adminUpsertWorkingHourBodySchema.parse(req.body ?? {});

    const id = body.id ?? randomUUID();
    const now = new Date() as any;

    // toActive01 can return undefined in your shared helper → default to 1
    const isActive = typeof body.is_active === 'undefined' ? 1 : toActive01(body.is_active) ?? 1;

    const insertRow: any = {
      id,
      resource_id: safeText(body.resource_id),
      dow: Number(body.dow),
      start_time: hmToTimeSql(body.start_time) as any,
      end_time: hmToTimeSql(body.end_time) as any,
      slot_minutes: body.slot_minutes ?? 60,
      break_minutes: body.break_minutes ?? 0,
      capacity: body.capacity ?? 1,
      is_active: isActive,
      created_at: now,
      updated_at: now,
    };

    if (body.id) {
      await db
        .insert(resourceWorkingHours)
        .values(insertRow)
        .onDuplicateKeyUpdate({
          set: {
            resource_id: insertRow.resource_id,
            dow: insertRow.dow,
            start_time: insertRow.start_time,
            end_time: insertRow.end_time,
            slot_minutes: insertRow.slot_minutes,
            break_minutes: insertRow.break_minutes,
            capacity: insertRow.capacity,
            is_active: insertRow.is_active,
            updated_at: now,
          } as any,
        });

      const [saved] = await db
        .select()
        .from(resourceWorkingHours)
        .where(eq(resourceWorkingHours.id, body.id))
        .limit(1);

      return reply.code(200).send(saved ?? null);
    }

    await db.insert(resourceWorkingHours).values(insertRow);

    const [saved] = await db
      .select()
      .from(resourceWorkingHours)
      .where(eq(resourceWorkingHours.id, id))
      .limit(1);

    return reply.code(201).send(saved ?? null);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    if (String(e?.code || '') === 'ER_DUP_ENTRY' || Number(e?.errno || 0) === 1062) {
      return reply.code(409).send({ error: { message: 'duplicate_working_hour' } });
    }
    return reply.code(500).send({ error: { message: 'working_hours_upsert_failed' } });
  }
};

/** DELETE /admin/resource-working-hours/:id */
export const deleteWorkingHourAdmin: RouteHandler = async (req, reply) => {
  try {
    const id = safeText((req.params as any)?.id);
    if (!id || id.length !== 36) return reply.code(400).send({ error: { message: 'invalid_id' } });

    await db.delete(resourceWorkingHours).where(eq(resourceWorkingHours.id, id));
    return reply.code(204).send();
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'working_hours_delete_failed' } });
  }
};

/** GET /admin/resource-slots?resource_id=...&date=YYYY-MM-DD */
export const listSlotsAdmin: RouteHandler = async (req, reply) => {
  try {
    const q = adminListSlotsQuerySchema.parse((req as any).query ?? {});
    const rows = await listSlotsForDate({ resource_id: q.resource_id, dateYmd: q.date });
    return reply.send(rows);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'slots_list_failed' } });
  }
};

/** GET /admin/resource-slots/availability?resource_id=...&date=...&time=HH:mm */
export const getSlotAvailabilityAdmin: RouteHandler = async (req, reply) => {
  try {
    const q = adminSlotAvailabilityQuerySchema.parse((req as any).query ?? {});
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
    return reply.code(500).send({ error: { message: 'slot_availability_failed' } });
  }
};

/** GET /admin/resource-slots/plan?resource_id=...&date=YYYY-MM-DD */
export const getDailyPlanAdmin: RouteHandler = async (req, reply) => {
  try {
    const q = adminPlanQuerySchema.parse((req as any).query ?? {});
    const plan = await getDailyPlanMerged({ resource_id: q.resource_id, dateYmd: q.date });
    return reply.send(plan);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'plan_get_failed' } });
  }
};

/** POST /admin/resource-slots/generate {resource_id,date} */
export const generateSlotsForDateAdmin: RouteHandler = async (req, reply) => {
  try {
    const body = adminGenerateSlotsBodySchema.parse(req.body ?? {});
    const out = await generateMissingSlotsForDate({
      resource_id: body.resource_id,
      dateYmd: body.date,
    });
    return reply.send({ ok: true, ...out });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'slots_generate_failed' } });
  }
};

/** POST /admin/resource-slots/override-day {resource_id,date,is_active} */
export const overrideDayAdmin: RouteHandler = async (req, reply) => {
  try {
    const body = adminOverrideDayBodySchema.parse(req.body ?? {});
    const out = await overrideDaySlots({
      resource_id: body.resource_id,
      dateYmd: body.date,
      is_active: body.is_active,
    });
    return reply.send({ ok: true, ...out });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    if (String(e?.code || '') === 'slot_has_reservations') {
      return reply
        .code(409)
        .send({ error: { message: 'slot_has_reservations', details: e?.details } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'override_day_failed' } });
  }
};

/** POST /admin/resource-slots/override {resource_id,date,time,is_active} */
export const overrideSlotAdmin: RouteHandler = async (req, reply) => {
  try {
    const body = adminOverrideSlotBodySchema.parse(req.body ?? {});
    const out = await overrideSingleSlot({
      resource_id: body.resource_id,
      dateYmd: body.date,
      timeHm: body.time,
      is_active: body.is_active,
    });
    if (!out.updated) {
      return reply.code(400).send({ error: { message: 'slot_not_in_plan_or_invalid' } });
    }
    return reply.send({ ok: true, ...out });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    if (String(e?.code || '') === 'slot_has_reservations') {
      return reply
        .code(409)
        .send({ error: { message: 'slot_has_reservations', details: e?.details } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'override_slot_failed' } });
  }
};
