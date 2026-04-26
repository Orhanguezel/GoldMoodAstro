// =============================================================
// FILE: src/modules/availability/validation.ts
// FINAL — LOCKED — Availability validation (admin + public)
// =============================================================

import { z } from 'zod';
import { toActive01, uuid36Schema, hmSchema, ymdSchema } from '../_shared';

/* -------------------- public -------------------- */

// GET /availability/slots?resource_id=...&date=YYYY-MM-DD
export const publicAvailabilitySlotsQuerySchema = z.object({
  resource_id: uuid36Schema,
  date: ymdSchema,
});

// GET /availability?resource_id=...&date=YYYY-MM-DD&time=HH:mm
export const publicSlotAvailabilityQuerySchema = z.object({
  resource_id: uuid36Schema,
  date: ymdSchema,
  time: hmSchema,
});

// GET /availability/working-hours?resource_id=...
export const publicListWorkingHoursQuerySchema = z.object({
  resource_id: uuid36Schema,
});

// GET /availability/weekly-plan?resource_id=...&type=...
export const publicWeeklyPlanQuerySchema = z.object({
  resource_id: uuid36Schema,
  type: z.string().trim().optional(),
});

/* -------------------- admin: working hours -------------------- */

export const adminListWorkingHoursQuerySchema = z.object({
  resource_id: uuid36Schema,
});

export const adminUpsertWorkingHourBodySchema = z
  .object({
    id: uuid36Schema.optional(),
    resource_id: uuid36Schema,
    dow: z.coerce.number().int().min(1).max(7),
    start_time: hmSchema,
    end_time: hmSchema,
    slot_minutes: z.coerce.number().int().min(5).max(480).optional(),
    break_minutes: z.coerce.number().int().min(0).max(480).optional(),
    capacity: z.coerce.number().int().min(1).max(999).optional(),
    is_active: z.union([z.boolean(), z.number(), z.string()]).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.end_time <= v.start_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_time'],
        message: 'end_time must be after start_time',
      });
    }
  });

/* -------------------- admin: slots -------------------- */

export const adminListSlotsQuerySchema = z.object({
  resource_id: uuid36Schema,
  date: ymdSchema,
});

export const adminSlotAvailabilityQuerySchema = z.object({
  resource_id: uuid36Schema,
  date: ymdSchema,
  time: hmSchema,
});

/* -------------------- admin: deterministic plan / override -------------------- */

export const adminPlanQuerySchema = z.object({
  resource_id: uuid36Schema,
  date: ymdSchema,
});

export const adminGenerateSlotsBodySchema = z.object({
  resource_id: uuid36Schema,
  date: ymdSchema,
});

export const adminOverrideDayBodySchema = z.object({
  resource_id: uuid36Schema,
  date: ymdSchema,
  // toActive01 in shared returns 0|1|undefined, so we keep transform but
  // controllers treat undefined as 1 anyway. Still safe.
  is_active: z.union([z.boolean(), z.number(), z.string()]).transform((v) => toActive01(v) ?? 1),
});

export const adminOverrideSlotBodySchema = z.object({
  resource_id: uuid36Schema,
  date: ymdSchema,
  time: hmSchema,
  is_active: z.union([z.boolean(), z.number(), z.string()]).transform((v) => toActive01(v) ?? 1),
});
