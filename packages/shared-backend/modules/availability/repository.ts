// =============================================================
// FILE: src/modules/availability/repository.ts
// FINAL — LOCKED — Availability repository (tx-safe, deterministic slots)
// =============================================================

import { randomUUID } from 'crypto';
import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';

import { resourceSlots, slotReservations, resourceWorkingHours } from './schema';
import { resources } from '../resources/schema';

import type {
  AvailabilityExistsResult,
  MoveResult,
  ReleaseResult,
  ReserveResult,
  SlotRowDTO,
  PlannedSlotDTO,
  WorkingHourRowDTO,
  Hm,
} from '../_shared';

import {
  safeTrim,
  timeStrToMinutes,
  minutesToHm,
  ymdToDateSql,
  extractHm,
  hmToTimeSql,
} from '../_shared';

type Executor = any;



/* -------------------- resource capacity (single source-of-truth upper bound) -------------------- */

async function getResourceCapacityEx(ex: Executor, resource_id: string): Promise<number> {
  const rid = safeTrim(resource_id);
  if (!rid) return 1;

  const [row] = await ex
    .select({ capacity: resources.capacity })
    .from(resources)
    .where(eq(resources.id, rid))
    .limit(1);

  const cap = Number((row as any)?.capacity ?? 1);
  return Number.isFinite(cap) && cap >= 1 ? Math.floor(cap) : 1;
}

function effectiveCapacity(resourceCap: number, whCap: number | null | undefined) {
  const rCap = Number.isFinite(resourceCap) && resourceCap >= 1 ? Math.floor(resourceCap) : 1;
  const wCap =
    Number.isFinite(Number(whCap)) && Number(whCap) >= 1 ? Math.floor(Number(whCap)) : rCap;
  return Math.max(1, Math.min(rCap, wCap));
}

/* -------------------- deterministic plan generation -------------------- */

export function buildDailyPlanFromWorkingHours(
  rows: WorkingHourRowDTO[],
  resourceCap: number,
): PlannedSlotDTO[] {
  const out: PlannedSlotDTO[] = [];

  for (const r of rows) {
    if (Number((r as any).is_active ?? 0) !== 1) continue;

    const startMin = timeStrToMinutes((r as any).start_time);
    const endMin = timeStrToMinutes((r as any).end_time);

    const slotMin = Math.max(1, Number((r as any).slot_minutes ?? 0));
    const breakMin = Math.max(0, Number((r as any).break_minutes ?? 0));
    const step = slotMin + breakMin;

    if (endMin <= startMin) continue;
    if (slotMin <= 0 || step <= 0) continue;

    const cap = effectiveCapacity(resourceCap, Number((r as any).capacity ?? 1));

    for (let t = startMin; t + slotMin <= endMin; t += step) {
      out.push({
        time: minutesToHm(t),
        wh_id: String((r as any).id),
        wh_start_time: String((r as any).start_time),
        wh_end_time: String((r as any).end_time),
        slot_minutes: slotMin,
        break_minutes: breakMin,

        slot_id: null,
        is_active: 1,
        capacity: cap,
        reserved_count: 0,
        available: true,
      });
    }
  }

  out.sort((a, b) => timeStrToMinutes(a.time) - timeStrToMinutes(b.time));
  return out;
}

/**
 * Returns working-hours rows (active only) matching given date's DOW (Mon..Sun => 1..7).
 */
export async function listWorkingHoursForDate(args: {
  resource_id: string;
  dateYmd: string;
}): Promise<WorkingHourRowDTO[]> {
  const resourceId = safeTrim(args.resource_id);
  const dateYmd = safeTrim(args.dateYmd);
  if (!resourceId || !dateYmd) return [];

  const dateSql = ymdToDateSql(dateYmd);

  const rows = await db
    .select()
    .from(resourceWorkingHours)
    .where(
      and(
        eq(resourceWorkingHours.resource_id, resourceId),
        eq(resourceWorkingHours.is_active, 1),
        sql`${resourceWorkingHours.dow} = (((DAYOFWEEK(${dateSql}) + 5) % 7) + 1)`,
      ),
    )
    .orderBy(asc(resourceWorkingHours.start_time));

  return rows as unknown as WorkingHourRowDTO[];
}

/**
 * Deterministic plan (WH) + merges slot overrides (resource_slots + slot_reservations).
 */
export async function getDailyPlanMerged(args: {
  resource_id: string;
  dateYmd: string;
}): Promise<PlannedSlotDTO[]> {
  const resourceId = safeTrim(args.resource_id);
  const dateYmd = safeTrim(args.dateYmd);
  if (!resourceId || !dateYmd) return [];

  const resourceCap = await getResourceCapacityEx(db, resourceId);

  const wh = await listWorkingHoursForDate({ resource_id: resourceId, dateYmd });
  const plan = buildDailyPlanFromWorkingHours(wh, resourceCap);

  const existing = await listSlotsForDate({ resource_id: resourceId, dateYmd });

  const byHm = new Map<string, SlotRowDTO>();
  for (const s of existing) {
    byHm.set(extractHm((s as any).slot_time), s);
  }

  for (const p of plan) {
    const s = byHm.get(p.time);
    if (!s) continue;

    const isActive = Number((s as any).is_active ?? 0) === 1 ? 1 : 0;

    // slot capacity override varsa onu kullan, yoksa plan capacity (WH+resource clamped)
    const capRaw = Number((s as any).capacity ?? p.capacity ?? 1);
    const cap = effectiveCapacity(resourceCap, capRaw);

    const reserved = Number((s as any).reserved_count ?? 0);

    p.slot_id = String((s as any).id);
    p.capacity = cap;
    p.is_active = isActive;
    p.reserved_count = reserved;
    p.available = isActive === 1 && cap > 0 && reserved < cap;
  }

  return plan;
}

/* -------------------- aligned working-hour match for ensure/getAvailability -------------------- */

async function findAlignedWorkingHourForTimeEx(
  ex: Executor,
  args: { resource_id: string; dateYmd: string; timeHm: string },
): Promise<{
  id: string;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  break_minutes: number;
  capacity: number;
} | null> {
  const resourceId = safeTrim(args.resource_id);
  const dateYmd = safeTrim(args.dateYmd);
  const timeHm = safeTrim(args.timeHm);
  if (!resourceId || !dateYmd || !timeHm) return null;

  const dateSql = ymdToDateSql(dateYmd);
  const timeSql = hmToTimeSql(timeHm);

  const rows = await ex
    .select({
      id: resourceWorkingHours.id,
      start_time: resourceWorkingHours.start_time,
      end_time: resourceWorkingHours.end_time,
      slot_minutes: resourceWorkingHours.slot_minutes,
      break_minutes: resourceWorkingHours.break_minutes,
      capacity: resourceWorkingHours.capacity,
    })
    .from(resourceWorkingHours)
    .where(
      and(
        eq(resourceWorkingHours.resource_id, resourceId),
        eq(resourceWorkingHours.is_active, 1),
        sql`${resourceWorkingHours.dow} = (((DAYOFWEEK(${dateSql}) + 5) % 7) + 1)`,
        sql`${timeSql} >= ${resourceWorkingHours.start_time} AND ${timeSql} < ${resourceWorkingHours.end_time}`,
      ),
    )
    .orderBy(asc(resourceWorkingHours.start_time));

  if (!rows.length) return null;

  const timeMin = timeStrToMinutes(timeHm);

  for (const r of rows as any[]) {
    const startMin = timeStrToMinutes(r.start_time);
    const endMin = timeStrToMinutes(r.end_time);

    const slotMin = Math.max(1, Number(r.slot_minutes ?? 0));
    const breakMin = Math.max(0, Number(r.break_minutes ?? 0));
    const step = slotMin + breakMin;

    if (timeMin + slotMin > endMin) continue;

    const diff = timeMin - startMin;
    if (diff < 0) continue;
    if (step <= 0) continue;

    if (diff % step === 0) {
      return {
        id: String(r.id),
        start_time: String(r.start_time),
        end_time: String(r.end_time),
        slot_minutes: slotMin,
        break_minutes: breakMin,
        capacity: Number(r.capacity ?? 1),
      };
    }
  }

  return null;
}

/* -------------------- SLOT ROW ENSURE (aligned) -------------------- */

export async function ensureResourceSlotTx(
  ex: Executor,
  args: { resource_id: string; dateYmd: string; timeHm: string },
) {
  const resourceId = safeTrim(args.resource_id);
  const dateYmd = safeTrim(args.dateYmd);
  const timeHm = safeTrim(args.timeHm);

  if (!resourceId || !dateYmd || !timeHm) return null;

  const slotDateSql = ymdToDateSql(dateYmd);
  const slotTimeSql = hmToTimeSql(timeHm);

  const existing = await ex
    .select({
      id: resourceSlots.id,
      capacity: resourceSlots.capacity,
      is_active: resourceSlots.is_active,
    })
    .from(resourceSlots)
    .where(
      and(
        eq(resourceSlots.resource_id, resourceId),
        sql`${resourceSlots.slot_date} = ${slotDateSql}`,
        sql`${resourceSlots.slot_time} = ${slotTimeSql}`,
      ),
    )
    .limit(1);

  if (existing[0]) return existing[0];

  const wh = await findAlignedWorkingHourForTimeEx(ex, {
    resource_id: resourceId,
    dateYmd,
    timeHm,
  });
  if (!wh) return null;

  const resourceCap = await getResourceCapacityEx(ex, resourceId);
  const cap = effectiveCapacity(resourceCap, wh.capacity);

  const slotId = randomUUID();
  const now = new Date() as any;

  await ex.insert(resourceSlots).values({
    id: slotId,
    resource_id: resourceId,
    slot_date: sql`${slotDateSql}` as any,
    slot_time: sql`${slotTimeSql}` as any,
    capacity: cap,
    is_active: 1,
    created_at: now,
    updated_at: now,
  });

  return { id: slotId, capacity: cap, is_active: 1 as any };
}

/* -------------------- reservations (tx-safe) -------------------- */

async function lockReservationRowOrCreate(ex: Executor, slot_id: string) {
  const [r] = await ex
    .select({
      id: slotReservations.id,
      slot_id: slotReservations.slot_id,
      reserved_count: slotReservations.reserved_count,
    })
    .from(slotReservations)
    .where(eq(slotReservations.slot_id, slot_id))
    .for('update')
    .limit(1);

  if (r) return r as any;

  const rid = randomUUID();
  const now = new Date() as any;

  await ex.insert(slotReservations).values({
    id: rid,
    slot_id,
    reserved_count: 0,
    created_at: now,
    updated_at: now,
  });

  const [locked] = await ex
    .select({
      id: slotReservations.id,
      slot_id: slotReservations.slot_id,
      reserved_count: slotReservations.reserved_count,
    })
    .from(slotReservations)
    .where(eq(slotReservations.slot_id, slot_id))
    .for('update')
    .limit(1);

  return locked as any;
}

export async function reserveSlotTx(
  ex: Executor,
  args: { resource_id: string; dateYmd: string; timeHm: string },
): Promise<ReserveResult> {
  const slot = await ensureResourceSlotTx(ex, args);
  if (!slot || Number((slot as any).is_active) !== 1) {
    return { ok: false, reason: 'slot_not_available' };
  }

  const locked = await lockReservationRowOrCreate(ex, String((slot as any).id));
  if (!locked) return { ok: false, reason: 'slot_not_available' };

  const reserved = Number((locked as any).reserved_count ?? 0);
  const cap = Number((slot as any).capacity ?? 0);

  if (cap <= 0 || reserved >= cap) return { ok: false, reason: 'slot_not_available' };

  await ex
    .update(slotReservations)
    .set({ reserved_count: reserved + 1, updated_at: new Date() as any })
    .where(eq(slotReservations.id, (locked as any).id));

  return { ok: true, slot_id: String((slot as any).id), capacity: cap };
}

export async function releaseSlotTx(
  ex: Executor,
  args: { slot_id: string },
): Promise<ReleaseResult> {
  const slotId = safeTrim(args.slot_id);
  if (!slotId) return { ok: false, reason: 'invalid_input' };

  const [row] = await ex
    .select({ id: slotReservations.id, reserved_count: slotReservations.reserved_count })
    .from(slotReservations)
    .where(eq(slotReservations.slot_id, slotId))
    .for('update')
    .limit(1);

  if (!row) return { ok: true, slot_id: slotId, reserved_count: 0 };

  const next = Math.max(Number((row as any).reserved_count ?? 0) - 1, 0);
  await ex
    .update(slotReservations)
    .set({ reserved_count: next, updated_at: new Date() as any })
    .where(eq(slotReservations.id, (row as any).id));

  return { ok: true, slot_id: slotId, reserved_count: next };
}

export async function moveSlotReservationTx(
  ex: Executor,
  args: { from_slot_id: string; to: { resource_id: string; dateYmd: string; timeHm: string } },
): Promise<MoveResult> {
  const fromSlotId = safeTrim(args.from_slot_id);
  if (!fromSlotId) return { ok: false, reason: 'invalid_input' };

  const toSlot = await ensureResourceSlotTx(ex, {
    resource_id: safeTrim(args.to.resource_id),
    dateYmd: safeTrim(args.to.dateYmd),
    timeHm: safeTrim(args.to.timeHm),
  });

  if (!toSlot || Number((toSlot as any).is_active) !== 1) {
    return { ok: false, reason: 'slot_not_available' };
  }

  const toSlotId = String((toSlot as any).id);

  // deadlock-safe lock order
  const a = fromSlotId < toSlotId ? fromSlotId : toSlotId;
  const b = fromSlotId < toSlotId ? toSlotId : fromSlotId;

  const r1 = await lockReservationRowOrCreate(ex, a);
  const r2 = await lockReservationRowOrCreate(ex, b);

  const fromRow = fromSlotId === a ? r1 : r2;
  const toRow = toSlotId === a ? r1 : r2;

  const toReserved = Number((toRow as any).reserved_count ?? 0);
  const toCap = Number((toSlot as any).capacity ?? 0);
  if (toCap <= 0 || toReserved >= toCap) return { ok: false, reason: 'slot_not_available' };

  const now = new Date() as any;

  await ex
    .update(slotReservations)
    .set({ reserved_count: toReserved + 1, updated_at: now })
    .where(eq(slotReservations.id, (toRow as any).id));

  const fromReserved = Number((fromRow as any).reserved_count ?? 0);
  const fromNext = Math.max(fromReserved - 1, 0);

  await ex
    .update(slotReservations)
    .set({ reserved_count: fromNext, updated_at: now })
    .where(eq(slotReservations.id, (fromRow as any).id));

  return { ok: true, to_slot_id: toSlotId, capacity: toCap };
}

/* -------------------- read helpers -------------------- */

export async function listSlotsForDate(args: {
  resource_id: string;
  dateYmd: string;
}): Promise<SlotRowDTO[]> {
  const resourceId = safeTrim(args.resource_id);
  const dateYmd = safeTrim(args.dateYmd);
  if (!resourceId || !dateYmd) return [];

  const dateSql = ymdToDateSql(dateYmd);

  const rows = await db
    .select({
      id: resourceSlots.id,
      slot_time: resourceSlots.slot_time,
      capacity: resourceSlots.capacity,
      is_active: resourceSlots.is_active,
      reserved_count: sql<number>`COALESCE(${slotReservations.reserved_count}, 0)`.as(
        'reserved_count',
      ),
    })
    .from(resourceSlots)
    .leftJoin(slotReservations, eq(slotReservations.slot_id, resourceSlots.id))
    .where(
      and(eq(resourceSlots.resource_id, resourceId), sql`${resourceSlots.slot_date} = ${dateSql}`),
    )
    .orderBy(asc(resourceSlots.slot_time));

  return rows as unknown as SlotRowDTO[];
}

export async function getAvailability(args: {
  resource_id: string;
  dateYmd: string;
  timeHm: string;
}): Promise<AvailabilityExistsResult> {
  const resourceId = safeTrim(args.resource_id);
  const dateYmd = safeTrim(args.dateYmd);
  const timeHm = safeTrim(args.timeHm);
  if (!resourceId || !dateYmd || !timeHm) {
    return { exists: false, is_active: 0, capacity: null, reserved_count: 0, available: false };
  }

  const resourceCap = await getResourceCapacityEx(db, resourceId);

  const dateSql = ymdToDateSql(dateYmd);
  const timeSql = hmToTimeSql(timeHm);

  const rows = await db
    .select({
      id: resourceSlots.id,
      capacity: resourceSlots.capacity,
      is_active: resourceSlots.is_active,
      reserved_count: sql<number>`COALESCE(${slotReservations.reserved_count}, 0)`.as(
        'reserved_count',
      ),
    })
    .from(resourceSlots)
    .leftJoin(slotReservations, eq(slotReservations.slot_id, resourceSlots.id))
    .where(
      and(
        eq(resourceSlots.resource_id, resourceId),
        sql`${resourceSlots.slot_date} = ${dateSql}`,
        sql`${resourceSlots.slot_time} = ${timeSql}`,
      ),
    )
    .limit(1);

  const r = rows[0] as any;
  if (r) {
    const reserved = Number(r.reserved_count ?? 0);
    const cap = effectiveCapacity(resourceCap, Number(r.capacity ?? 1));
    const active = Number(r.is_active ?? 0) === 1;

    return {
      exists: true,
      slot_id: String(r.id),
      is_active: active ? 1 : 0,
      capacity: cap,
      reserved_count: reserved,
      available: active && cap > 0 && reserved < cap,
    };
  }

  const wh = await findAlignedWorkingHourForTimeEx(db, {
    resource_id: resourceId,
    dateYmd,
    timeHm,
  });
  if (!wh)
    return { exists: false, is_active: 0, capacity: null, reserved_count: 0, available: false };

  const cap = effectiveCapacity(resourceCap, wh.capacity);
  return {
    exists: false,
    is_active: cap > 0 ? 1 : 0,
    capacity: cap,
    reserved_count: 0,
    available: cap > 0,
  };
}

/* -------------------- PUBLIC helpers -------------------- */

export async function assertPublicResourceActive(args: {
  resource_id: string;
  type?: string;
}): Promise<{ ok: boolean; id?: string; type?: string }> {
  const rid = safeTrim(args.resource_id);
  const type = safeTrim(args.type);
  if (!rid) return { ok: false };

  const where: any[] = [eq(resources.id, rid), eq(resources.is_active, 1)];
  if (type) where.push(eq(resources.type, type));

  const [row] = await db
    .select({ id: resources.id, type: resources.type })
    .from(resources)
    .where(and(...where))
    .limit(1);

  if (!row) return { ok: false };
  return { ok: true, id: String(row.id), type: String((row as any).type ?? '') };
}

export async function listWorkingHoursPublic(args: {
  resource_id: string;
}): Promise<WorkingHourRowDTO[]> {
  const resourceId = safeTrim(args.resource_id);
  if (!resourceId) return [];

  const [resRow] = await db
    .select({ id: resources.id, is_active: resources.is_active })
    .from(resources)
    .where(eq(resources.id, resourceId))
    .limit(1);

  if (!resRow || Number((resRow as any).is_active ?? 0) !== 1) return [];

  const rows = await db
    .select()
    .from(resourceWorkingHours)
    .where(
      and(eq(resourceWorkingHours.resource_id, resourceId), eq(resourceWorkingHours.is_active, 1)),
    )
    .orderBy(asc(resourceWorkingHours.dow), asc(resourceWorkingHours.start_time));

  return rows as unknown as WorkingHourRowDTO[];
}

export async function getWeeklyPlanFromWorkingHours(args: { resource_id: string }): Promise<
  Array<{
    dow: number;
    slot_times: Hm[];
    ranges: Array<{
      wh_id: string;
      start_time: Hm;
      end_time: Hm;
      slot_minutes: number;
      break_minutes: number;
      capacity: number;
      is_active: 0 | 1;
    }>;
  }>
> {
  const rid = safeTrim(args.resource_id);
  if (!rid) return [];

  const resourceCap = await getResourceCapacityEx(db, rid);

  const wh = await db
    .select()
    .from(resourceWorkingHours)
    .where(and(eq(resourceWorkingHours.resource_id, rid), eq(resourceWorkingHours.is_active, 1)))
    .orderBy(asc(resourceWorkingHours.dow), asc(resourceWorkingHours.start_time));

  const byDow = new Map<number, any[]>();
  for (const r of wh as any[]) {
    const dow = Number(r.dow ?? 0);
    if (dow < 1 || dow > 7) continue;
    const arr = byDow.get(dow) ?? [];
    arr.push(r);
    byDow.set(dow, arr);
  }

  const out: any[] = [];
  for (let dow = 1; dow <= 7; dow++) {
    const rows = (byDow.get(dow) ?? []).slice().sort((a, b) => {
      return timeStrToMinutes(a.start_time) - timeStrToMinutes(b.start_time);
    });

    const slotSet = new Set<string>();
    const ranges: any[] = [];

    for (const r of rows) {
      const startMin = timeStrToMinutes(r.start_time);
      const endMin = timeStrToMinutes(r.end_time);

      const slotMin = Math.max(1, Number(r.slot_minutes ?? 0));
      const breakMin = Math.max(0, Number(r.break_minutes ?? 0));
      const step = slotMin + breakMin;
      if (endMin <= startMin || slotMin <= 0 || step <= 0) continue;

      const cap = effectiveCapacity(resourceCap, Number(r.capacity ?? 1));

      ranges.push({
        wh_id: String(r.id),
        start_time: minutesToHm(startMin),
        end_time: minutesToHm(endMin),
        slot_minutes: slotMin,
        break_minutes: breakMin,
        capacity: cap,
        is_active: 1 as 0 | 1,
      });

      for (let t = startMin; t + slotMin <= endMin; t += step) slotSet.add(minutesToHm(t));
    }

    const slot_times = Array.from(slotSet).sort((a, b) => a.localeCompare(b));
    out.push({ dow, slot_times, ranges });
  }

  return out;
}

/* ==============================================================
 * ADMIN helpers: generate / override
 * - generateMissingSlotsForDate: plan’daki missing slot row’ları create eder
 * - overrideDaySlots: o günün tüm plan slotlarını aktif/pasif yapar (reservations varsa pasifleştirmez)
 * - overrideSingleSlot: tek slot aktif/pasif (reservations varsa pasifleştirmez)
 * ==============================================================
 */

export async function generateMissingSlotsForDate(args: {
  resource_id: string;
  dateYmd: string;
}): Promise<{ created: number; planned: number }> {
  const resourceId = safeTrim(args.resource_id);
  const dateYmd = safeTrim(args.dateYmd);
  if (!resourceId || !dateYmd) return { created: 0, planned: 0 };

  // deterministic plan (WH+resource cap clamp) + existing override merge
  const plan = await getDailyPlanMerged({ resource_id: resourceId, dateYmd });

  let created = 0;

  await db.transaction(async (tx) => {
    for (const p of plan) {
      // slot row already exists (merged)
      if (p.slot_id) continue;

      const slot = await ensureResourceSlotTx(tx, {
        resource_id: resourceId,
        dateYmd,
        timeHm: p.time,
      });

      if (slot) created += 1;
    }
  });

  return { created, planned: plan.length };
}

export async function overrideDaySlots(args: {
  resource_id: string;
  dateYmd: string;
  is_active: 0 | 1;
}): Promise<{ updated: number; planned: number }> {
  const resourceId = safeTrim(args.resource_id);
  const dateYmd = safeTrim(args.dateYmd);
  const isActive = Number(args.is_active) === 1 ? 1 : 0;
  if (!resourceId || !dateYmd) return { updated: 0, planned: 0 };

  const plan = await getDailyPlanMerged({ resource_id: resourceId, dateYmd });

  let updated = 0;

  await db.transaction(async (tx) => {
    for (const p of plan) {
      const slot = await ensureResourceSlotTx(tx, {
        resource_id: resourceId,
        dateYmd,
        timeHm: p.time,
      });

      if (!slot) continue;

      // turning inactive: cannot if reservations exist
      if (isActive === 0) {
        const [locked] = await tx
          .select({
            id: slotReservations.id,
            reserved_count: slotReservations.reserved_count,
          })
          .from(slotReservations)
          .where(eq(slotReservations.slot_id, String((slot as any).id)))
          .for('update')
          .limit(1);

        const reserved = Number((locked as any)?.reserved_count ?? 0);
        if (reserved > 0) {
          const err: any = new Error('slot_has_reservations');
          err.code = 'slot_has_reservations';
          err.details = { time: p.time, reserved_count: reserved };
          throw err;
        }
      }

      await tx
        .update(resourceSlots)
        .set({ is_active: isActive, updated_at: new Date() as any } as any)
        .where(eq(resourceSlots.id, String((slot as any).id)));

      updated += 1;
    }
  });

  return { updated, planned: plan.length };
}

export async function overrideSingleSlot(args: {
  resource_id: string;
  dateYmd: string;
  timeHm: string;
  is_active: 0 | 1;
}): Promise<{ updated: boolean; slot_id: string | null }> {
  const resourceId = safeTrim(args.resource_id);
  const dateYmd = safeTrim(args.dateYmd);
  const timeHm = safeTrim(args.timeHm);
  const isActive = Number(args.is_active) === 1 ? 1 : 0;
  if (!resourceId || !dateYmd || !timeHm) return { updated: false, slot_id: null };

  return await db.transaction(async (tx) => {
    const slot = await ensureResourceSlotTx(tx, { resource_id: resourceId, dateYmd, timeHm });
    if (!slot) return { updated: false, slot_id: null };

    // turning inactive: cannot if reservations exist
    if (isActive === 0) {
      const [locked] = await tx
        .select({
          id: slotReservations.id,
          reserved_count: slotReservations.reserved_count,
        })
        .from(slotReservations)
        .where(eq(slotReservations.slot_id, String((slot as any).id)))
        .for('update')
        .limit(1);

      const reserved = Number((locked as any)?.reserved_count ?? 0);
      if (reserved > 0) {
        const err: any = new Error('slot_has_reservations');
        err.code = 'slot_has_reservations';
        err.details = { time: timeHm, reserved_count: reserved };
        throw err;
      }
    }

    await tx
      .update(resourceSlots)
      .set({ is_active: isActive, updated_at: new Date() as any } as any)
      .where(eq(resourceSlots.id, String((slot as any).id)));

    return { updated: true, slot_id: String((slot as any).id) };
  });
}


