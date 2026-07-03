// =============================================================
// FILE: src/modules/bookings/repository.ts
// FINAL — Bookings repository (NO booking_i18n)
// - Capacity uses availability tables (resource_slots, slot_reservations, resource_working_hours)
// - Tx-safe reserve/release/move (FOR UPDATE + deadlock-safe locking)
// - Merged list/get: resources.title + services_i18n.name (locale preferred, fallback default locale)
// =============================================================

import { randomUUID } from 'crypto';
import { and, asc, desc, eq, like, or, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '../../db/client';

import { bookings, } from './schema';
import type { BookingRow, NewBookingRow } from './schema';

import type {
  BookingMerged,
  BookingListFilters,
  ListOptions,
  SlotAvailability,
  SlotKey,
} from '../_shared';
import { isActiveForCapacity } from './validation';

import { resources } from '../resources/schema';
import { servicesI18n } from '../services/schema';

import {
  resourceSlots,
  slotReservations,
  resourceWorkingHours,
} from '../availability/schema';
import { ymdToDateSql, hmToTimeSql, to01, resolveLocales } from '../_shared';

type Executor = any;
const safeTrim = (v: unknown) => String(v ?? '').trim();
const INTERVAL_BLOCKING_STATUSES = ['pending_payment', 'booked', 'confirmed', 'active'];

function rowsFromResult<T>(result: unknown): T[] {
  return Array.isArray((result as any)?.[0]) ? (result as any)[0] : ((result as any) ?? []);
}

function normalizeHm(value: unknown): string {
  const raw = safeTrim(value);
  return raw.length >= 5 ? raw.slice(0, 5) : raw;
}

function timeToMinutes(value: unknown): number {
  const [hRaw, mRaw] = normalizeHm(value).split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

function errorWithCode(code: string) {
  const err: any = new Error(code);
  err.code = code;
  return err;
}


function mergedSelect(sReq: any, sDef: any) {
  return {
    id: bookings.id,
    // Yetki/katılımcı alanları — getMyBooking auth (müşteri/danışman) + görüşme sayfası bunlara bağlı.
    user_id: bookings.user_id,
    consultant_id: bookings.consultant_id,
    order_id: bookings.order_id,
    name: bookings.name,
    email: bookings.email,
    phone: bookings.phone,
    locale: bookings.locale,
    customer_message: bookings.customer_message,

    service_id: bookings.service_id,
    resource_id: bookings.resource_id,
    slot_id: bookings.slot_id,

    appointment_date: bookings.appointment_date,
    appointment_time: bookings.appointment_time,
    session_duration: bookings.session_duration,
    session_price: bookings.session_price,

    status: bookings.status,
    is_read: bookings.is_read,
    media_type: bookings.media_type,
    source_type: bookings.source_type,
    source_id: bookings.source_id,

    admin_note: bookings.admin_note,
    decided_at: bookings.decided_at,
    decided_by: bookings.decided_by,
    decision_note: bookings.decision_note,

    email_last_sent_at: bookings.email_last_sent_at,
    email_last_template_key: bookings.email_last_template_key,
    email_last_to: bookings.email_last_to,
    email_last_subject: bookings.email_last_subject,
    email_last_error: bookings.email_last_error,

    created_at: bookings.created_at,
    updated_at: bookings.updated_at,

    resource_title: resources.title,

    service_title: sql<string>`COALESCE(${sReq.name}, ${sDef.name})`.as('service_title'),
  };
}

/* ----------------------------- availability / capacity ----------------------------- */

async function ensureResourceSlotTx(ex: Executor, args: SlotKey) {
  const resourceId = safeTrim(args.resource_id);
  const dateYmd = safeTrim(args.dateYmd);
  const timeHm = safeTrim(args.timeHm);
  if (!resourceId || !dateYmd || !timeHm) return null;

  const dateSql = ymdToDateSql(dateYmd);
  const timeSql = hmToTimeSql(timeHm);

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
        sql`${resourceSlots.slot_date} = ${dateSql}`,
        sql`${resourceSlots.slot_time} = ${timeSql}`,
      ),
    )
    .limit(1);

  if (existing[0]) return existing[0];

  // derive capacity from working hours window
  const wh = await ex
    .select({ capacity: resourceWorkingHours.capacity })
    .from(resourceWorkingHours)
    .where(
      and(
        eq(resourceWorkingHours.resource_id, resourceId),
        eq(resourceWorkingHours.is_active, 1),
        sql`${resourceWorkingHours.dow} = (((DAYOFWEEK(${dateSql}) + 5) % 7) + 1)`,
        sql`${timeSql} >= ${resourceWorkingHours.start_time} AND ${timeSql} < ${resourceWorkingHours.end_time}`,
      ),
    )
    .orderBy(asc(resourceWorkingHours.start_time))
    .limit(1);

  const cap = Number(wh[0]?.capacity ?? 0);
  if (cap <= 0) return null;

  const slotId = randomUUID();
  const now = new Date() as any;

  await ex.insert(resourceSlots).values({
    id: slotId,
    resource_id: resourceId,
    slot_date: sql`${dateSql}` as any,
    slot_time: sql`${timeSql}` as any,
    capacity: cap,
    is_active: 1,
    created_at: now,
    updated_at: now,
  });

  return { id: slotId, capacity: cap, is_active: 1 as any };
}

async function lockReservationRowTx(ex: Executor, slot_id: string) {
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

  if (r) return r;

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

  return locked!;
}

export async function getSlotAvailabilityEx(
  ex: Executor,
  args: SlotKey,
): Promise<SlotAvailability> {
  const slot = await ensureResourceSlotTx(ex, args);
  if (!slot) return { exists: false, available: false, capacity: null, reserved_count: 0 };

  const dateSql = ymdToDateSql(args.dateYmd);
  const timeSql = hmToTimeSql(args.timeHm);

  const rows = await ex
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
        eq(resourceSlots.resource_id, safeTrim(args.resource_id)),
        sql`${resourceSlots.slot_date} = ${dateSql}`,
        sql`${resourceSlots.slot_time} = ${timeSql}`,
      ),
    )
    .limit(1);

  const r = rows[0] as any;
  if (!r) return { exists: false, available: false, capacity: null, reserved_count: 0 };

  const cap = Number(r.capacity ?? 0);
  const reserved = Number(r.reserved_count ?? 0);
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

export async function reserveSlotTx(ex: Executor, args: SlotKey) {
  const slot = await ensureResourceSlotTx(ex, args);
  if (!slot || Number(slot.is_active ?? 0) !== 1)
    return { ok: false as const, reason: 'slot_not_available' as const };

  const locked = await lockReservationRowTx(ex, slot.id);

  const cap = Number(slot.capacity ?? 0);
  const cur = Number(locked.reserved_count ?? 0);
  if (cap <= 0 || cur >= cap) return { ok: false as const, reason: 'slot_not_available' as const };

  const now = new Date() as any;
  await ex
    .update(slotReservations)
    .set({ reserved_count: cur + 1, updated_at: now })
    .where(eq(slotReservations.id, locked.id));

  return { ok: true as const, slot_id: slot.id, capacity: cap };
}

export async function releaseSlotTx(ex: Executor, args: { slot_id: string }) {
  const slotId = safeTrim(args.slot_id);
  if (!slotId) return { ok: false as const, reason: 'invalid_slot' as const };

  const [row] = await ex
    .select({ id: slotReservations.id, reserved_count: slotReservations.reserved_count })
    .from(slotReservations)
    .where(eq(slotReservations.slot_id, slotId))
    .for('update')
    .limit(1);

  if (!row) return { ok: true as const, slot_id: slotId, reserved_count: 0 };

  const next = Math.max(Number(row.reserved_count ?? 0) - 1, 0);
  await ex
    .update(slotReservations)
    .set({ reserved_count: next, updated_at: new Date() as any })
    .where(eq(slotReservations.id, row.id));

  return { ok: true as const, slot_id: slotId, reserved_count: next };
}

export async function moveSlotReservationTx(
  ex: Executor,
  args: { from_slot_id: string; to: SlotKey },
) {
  const fromSlotId = safeTrim(args.from_slot_id);
  if (!fromSlotId) return { ok: false as const, reason: 'invalid_slot' as const };

  const toSlot = await ensureResourceSlotTx(ex, args.to);
  if (!toSlot || Number(toSlot.is_active ?? 0) !== 1)
    return { ok: false as const, reason: 'slot_not_available' as const };

  const toSlotId = toSlot.id;

  const a = fromSlotId < toSlotId ? fromSlotId : toSlotId;
  const b = fromSlotId < toSlotId ? toSlotId : fromSlotId;

  const r1 = await lockReservationRowTx(ex, a);
  const r2 = await lockReservationRowTx(ex, b);

  const fromRow = fromSlotId === a ? r1 : r2;
  const toRow = toSlotId === a ? r1 : r2;

  const toCap = Number(toSlot.capacity ?? 0);
  const toCur = Number(toRow.reserved_count ?? 0);
  if (toCap <= 0 || toCur >= toCap)
    return { ok: false as const, reason: 'slot_not_available' as const };

  const now = new Date() as any;

  await ex
    .update(slotReservations)
    .set({ reserved_count: toCur + 1, updated_at: now })
    .where(eq(slotReservations.id, toRow.id));

  const fromCur = Number(fromRow.reserved_count ?? 0);
  const fromNext = Math.max(fromCur - 1, 0);

  await ex
    .update(slotReservations)
    .set({ reserved_count: fromNext, updated_at: now })
    .where(eq(slotReservations.id, fromRow.id));

  return { ok: true as const, to_slot_id: toSlotId, capacity: toCap };
}

/* ----------------------------- merged getters ----------------------------- */

export async function getBookingMergedByIdEx(
  ex: Executor,
  args: { id: string; locale?: string },
): Promise<BookingMerged | null> {
  const id = safeTrim(args.id);
  if (!id) return null;

  const { locale: loc, def } = await resolveLocales({ locale: args.locale } as any);

  const sReq = alias(servicesI18n, 'si_req');
  const sDef = alias(servicesI18n, 'si_def');

  const rows = await ex
    .select(mergedSelect(sReq, sDef))
    .from(bookings)
    .leftJoin(resources, eq(resources.id, bookings.resource_id))
    .leftJoin(sReq, and(eq(sReq.service_id, bookings.service_id), eq(sReq.locale, loc)))
    .leftJoin(sDef, and(eq(sDef.service_id, bookings.service_id), eq(sDef.locale, def)))
    .where(eq(bookings.id, id))
    .limit(1);

  return (rows[0] ?? null) as any;
}

export async function getBookingMergedById(args: { id: string; locale?: string }) {
  return await getBookingMergedByIdEx(db, args);
}

export async function getBookingMergedByIdTx(ex: Executor, args: { id: string; locale?: string }) {
  return await getBookingMergedByIdEx(ex, args);
}

/* ----------------------------- create/update/delete ----------------------------- */

export async function insertBookingWithSlotTx(
  ex: Executor,
  args: { booking: NewBookingRow; reserveSlot: boolean },
): Promise<BookingRow> {
  let slotId: string | null = null;

  if (args.reserveSlot) {
    const r = await reserveSlotTx(ex, {
      resource_id: safeTrim(args.booking.resource_id),
      dateYmd: safeTrim(args.booking.appointment_date),
      timeHm: safeTrim(args.booking.appointment_time),
    } as any);

    if (!r.ok) {
      const err: any = new Error('slot_not_available');
      err.code = 'slot_not_available';
      throw err;
    }
    slotId = r.slot_id;
  }

  await ex.insert(bookings).values({ ...(args.booking as any), slot_id: slotId } as any);

  const [row] = await ex.select().from(bookings).where(eq(bookings.id, args.booking.id)).limit(1);
  if (!row) {
    const err: any = new Error('booking_insert_failed');
    err.code = 'booking_insert_failed';
    throw err;
  }
  return row as any;
}

async function validateIntervalBookingTx(ex: Executor, booking: NewBookingRow) {
  const consultantId = safeTrim(booking.consultant_id);
  const resourceId = safeTrim(booking.resource_id);
  const dateYmd = safeTrim(booking.appointment_date);
  const timeHm = safeTrim(booking.appointment_time);
  const duration = Number((booking as any).session_duration ?? 30);
  const start = timeToMinutes(timeHm);
  const end = start + duration;

  if (!consultantId || !resourceId || !dateYmd || !timeHm || !Number.isFinite(start) || duration <= 0) {
    throw errorWithCode('outside_working_hours');
  }

  const windowsResult = await ex.execute(sql`
    SELECT start_time, end_time
    FROM resource_working_hours
    WHERE resource_id = ${resourceId}
      AND is_active = 1
      AND dow = (((DAYOFWEEK(${dateYmd}) + 5) % 7) + 1)
    FOR UPDATE
  `);
  const windows = rowsFromResult<{ start_time: unknown; end_time: unknown }>(windowsResult);
  const insideWorkingHours = windows.some((row) => {
    const ws = timeToMinutes(row.start_time);
    const we = timeToMinutes(row.end_time);
    return Number.isFinite(ws) && Number.isFinite(we) && start >= ws && end <= we;
  });
  if (!insideWorkingHours) throw errorWithCode('outside_working_hours');

  const bookingRowsResult = await ex.execute(sql`
    SELECT id, appointment_time, session_duration
    FROM bookings
    WHERE consultant_id = ${consultantId}
      AND appointment_date = ${dateYmd}
      AND status IN (${sql.join(INTERVAL_BLOCKING_STATUSES.map((status) => sql`${status}`), sql`, `)})
      AND appointment_time IS NOT NULL
    FOR UPDATE
  `);
  const bookingRows = rowsFromResult<{ id: string; appointment_time: unknown; session_duration: unknown }>(bookingRowsResult);
  for (const row of bookingRows) {
    const otherStart = timeToMinutes(row.appointment_time);
    const otherEnd = otherStart + Number(row.session_duration ?? 30);
    if (Number.isFinite(otherStart) && overlaps(start, end, otherStart, otherEnd)) {
      throw errorWithCode('slot_conflict');
    }
  }

  const blocksResult = await ex.execute(sql`
    SELECT id, start_time, end_time
    FROM consultant_time_blocks
    WHERE consultant_id = ${consultantId}
      AND block_date = ${dateYmd}
    FOR UPDATE
  `);
  const blocks = rowsFromResult<{ id: string; start_time: unknown; end_time: unknown }>(blocksResult);
  for (const row of blocks) {
    const blockStart = timeToMinutes(row.start_time);
    const blockEnd = timeToMinutes(row.end_time);
    if (Number.isFinite(blockStart) && Number.isFinite(blockEnd) && overlaps(start, end, blockStart, blockEnd)) {
      throw errorWithCode('slot_conflict');
    }
  }
}

export async function insertBookingWithIntervalTx(
  ex: Executor,
  args: { booking: NewBookingRow },
): Promise<BookingRow> {
  await validateIntervalBookingTx(ex, args.booking);
  await ex.insert(bookings).values({ ...(args.booking as any), slot_id: null } as any);

  const [row] = await ex.select().from(bookings).where(eq(bookings.id, args.booking.id)).limit(1);
  if (!row) throw errorWithCode('booking_insert_failed');
  return row as any;
}

export async function createBookingPublic(args: { booking: NewBookingRow }): Promise<BookingRow> {
  return await db.transaction(async (tx) => {
    if (safeTrim((args.booking as any).slot_id)) {
      return await insertBookingWithSlotTx(tx, { booking: args.booking, reserveSlot: true });
    }
    return await insertBookingWithIntervalTx(tx, { booking: args.booking });
  });
}

export async function createBookingAdmin(args: { booking: NewBookingRow }): Promise<BookingRow> {
  return await db.transaction(async (tx) => {
    const reserve = isActiveForCapacity(String(args.booking.status));
    return await insertBookingWithSlotTx(tx, { booking: args.booking, reserveSlot: reserve });
  });
}

export async function updateBookingByIdTx(ex: Executor, id: string, patch: Partial<BookingRow>) {
  const bid = safeTrim(id);
  if (!bid) return null;

  await ex
    .update(bookings)
    .set({ ...(patch as any), updated_at: new Date() as any })
    .where(eq(bookings.id, bid));
  const [row] = await ex.select().from(bookings).where(eq(bookings.id, bid)).limit(1);
  return (row ?? null) as any;
}

export async function deleteBookingByIdTx(ex: Executor, id: string) {
  const bid = safeTrim(id);
  if (!bid) return;
  await ex.delete(bookings).where(eq(bookings.id, bid));
}

/* ----------------------------- list merged ----------------------------- */

export async function listBookingsMerged(filters: BookingListFilters, opts: ListOptions = {}) {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  const offset = Math.max(opts.offset ?? 0, 0);

  const { locale: loc, def } = await resolveLocales({ locale: filters.locale } as any);

  const sReq = alias(servicesI18n, 'si_req');
  const sDef = alias(servicesI18n, 'si_def');

  const where: SQL[] = [];

  if (filters.status && safeTrim(filters.status))
    where.push(eq(bookings.status, safeTrim(filters.status)));
  const isRead01 = to01(filters.is_read);
  if (typeof isRead01 !== 'undefined') where.push(eq(bookings.is_read, isRead01));

  if (filters.appointment_date && safeTrim(filters.appointment_date))
    where.push(eq(bookings.appointment_date, safeTrim(filters.appointment_date)));
  if (filters.appointment_time && safeTrim(filters.appointment_time))
    where.push(eq(bookings.appointment_time, safeTrim(filters.appointment_time)));

  if (filters.service_id && safeTrim(filters.service_id))
    where.push(eq(bookings.service_id, safeTrim(filters.service_id)));
  if (filters.resource_id && safeTrim(filters.resource_id))
    where.push(eq(bookings.resource_id, safeTrim(filters.resource_id)));
  if (filters.user_id && safeTrim(filters.user_id))
    where.push(eq(bookings.user_id, safeTrim(filters.user_id)));
  if (filters.consultant_id && safeTrim(filters.consultant_id))
    where.push(eq(bookings.consultant_id, safeTrim(filters.consultant_id)));

  if (filters.q && safeTrim(filters.q)) {
    const q = `%${safeTrim(filters.q)}%`;
    where.push(
      or(
        like(bookings.name, q),
        like(bookings.email, q),
        like(bookings.phone, q),
        like(resources.title, q),
        like(sql`COALESCE(${sReq.name}, ${sDef.name})`, q),
      ) as any,
    );
  }

  const base = db
    .select(mergedSelect(sReq, sDef))
    .from(bookings)
    .leftJoin(resources, eq(resources.id, bookings.resource_id))
    .leftJoin(sReq, and(eq(sReq.service_id, bookings.service_id), eq(sReq.locale, loc)))
    .leftJoin(sDef, and(eq(sDef.service_id, bookings.service_id), eq(sDef.locale, def)))
    .orderBy(desc(bookings.created_at))
    .limit(limit)
    .offset(offset);

  return (where.length ? await base.where(and(...where)) : await base) as any;
}
