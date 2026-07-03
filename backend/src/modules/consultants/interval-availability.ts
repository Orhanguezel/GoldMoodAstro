import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

export const INTERVAL_STEP_MINUTES = 15;
export const TODAY_BOOKING_BUFFER_MINUTES = 30;

type QueryRows<T> = T[];

export interface AvailabilityWindow {
  start: string;
  end: string;
}

export interface AvailabilityBusyRange extends AvailabilityWindow {
  kind: 'booking' | 'block';
  label?: string | null;
}

export interface DayAvailability {
  consultant_id: string;
  resource_id: string | null;
  windows: AvailabilityWindow[];
  busy: AvailabilityBusyRange[];
  starts: string[];
  step_minutes: number;
  duration_minutes: number;
}

function rowsFromResult<T>(result: unknown): QueryRows<T> {
  return Array.isArray((result as any)?.[0]) ? (result as any)[0] : ((result as any) ?? []);
}

export function normalizeHm(value: unknown): string {
  const raw = String(value ?? '').trim();
  return raw.length >= 5 ? raw.slice(0, 5) : raw;
}

export function timeToMinutes(value: unknown): number {
  const [hRaw, mRaw] = normalizeHm(value).split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

export function minutesToHm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function isYmdToday(date: string) {
  const now = new Date();
  const local = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return date === local;
}

function minStartForDate(date: string) {
  if (!isYmdToday(date)) return 0;
  const now = new Date();
  const withBuffer = now.getHours() * 60 + now.getMinutes() + TODAY_BOOKING_BUFFER_MINUTES;
  return Math.ceil(withBuffer / INTERVAL_STEP_MINUTES) * INTERVAL_STEP_MINUTES;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

function toRange(row: { start_time: unknown; end_time: unknown; kind?: 'booking' | 'block'; label?: string | null }) {
  return {
    start: normalizeHm(row.start_time),
    end: normalizeHm(row.end_time),
    kind: row.kind ?? 'block',
    label: row.label ?? null,
  };
}

export async function computeDayAvailability(
  consultantId: string,
  date: string,
  durationMinutes: number,
): Promise<DayAvailability> {
  const duration = Math.max(INTERVAL_STEP_MINUTES, Math.min(480, Number(durationMinutes) || 30));

  const consultantResult = await db.execute(sql`
    SELECT c.id AS consultant_id, r.id AS resource_id
    FROM consultants c
    LEFT JOIN resources r ON r.external_ref_id = c.id AND r.type = 'consultant'
    WHERE c.id = ${consultantId} OR c.slug = ${consultantId}
    LIMIT 1
  `);
  const consultantRows = rowsFromResult<{ consultant_id: string; resource_id: string | null }>(consultantResult);
  const consultant = consultantRows[0];
  if (!consultant) {
    return {
      consultant_id: consultantId,
      resource_id: null,
      windows: [],
      busy: [],
      starts: [],
      step_minutes: INTERVAL_STEP_MINUTES,
      duration_minutes: duration,
    };
  }

  if (!consultant.resource_id) {
    return {
      consultant_id: consultant.consultant_id,
      resource_id: null,
      windows: [],
      busy: [],
      starts: [],
      step_minutes: INTERVAL_STEP_MINUTES,
      duration_minutes: duration,
    };
  }

  const windowsResult = await db.execute(sql`
    SELECT start_time, end_time
    FROM resource_working_hours
    WHERE resource_id = ${consultant.resource_id}
      AND is_active = 1
      AND dow = (((DAYOFWEEK(${date}) + 5) % 7) + 1)
    ORDER BY start_time ASC
  `);
  const windows = rowsFromResult<{ start_time: unknown; end_time: unknown }>(windowsResult)
    .map((row) => ({ start: normalizeHm(row.start_time), end: normalizeHm(row.end_time) }))
    .filter((row) => Number.isFinite(timeToMinutes(row.start)) && timeToMinutes(row.end) > timeToMinutes(row.start));

  const bookingsResult = await db.execute(sql`
    SELECT appointment_time AS start_time,
           ADDTIME(appointment_time, SEC_TO_TIME(COALESCE(session_duration, 30) * 60)) AS end_time
    FROM bookings
    WHERE consultant_id = ${consultant.consultant_id}
      AND appointment_date = ${date}
      AND status IN ('pending_payment', 'booked', 'confirmed', 'active')
      AND appointment_time IS NOT NULL
    ORDER BY appointment_time ASC
  `);
  const bookingBusy = rowsFromResult<{ start_time: unknown; end_time: unknown }>(bookingsResult)
    .map((row) => toRange({ ...row, kind: 'booking' }))
    .filter((row) => timeToMinutes(row.end) > timeToMinutes(row.start));

  const blocksResult = await db.execute(sql`
    SELECT start_time, end_time, reason AS label
    FROM consultant_time_blocks
    WHERE consultant_id = ${consultant.consultant_id}
      AND block_date = ${date}
    ORDER BY start_time ASC
  `);
  const blockBusy = rowsFromResult<{ start_time: unknown; end_time: unknown; label: string | null }>(blocksResult)
    .map((row) => toRange({ ...row, kind: 'block' }))
    .filter((row) => timeToMinutes(row.end) > timeToMinutes(row.start));

  const busy = [...bookingBusy, ...blockBusy].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  const minStart = minStartForDate(date);
  const starts: string[] = [];

  for (const window of windows) {
    const start = Math.max(timeToMinutes(window.start), minStart);
    const end = timeToMinutes(window.end);
    const alignedStart = Math.ceil(start / INTERVAL_STEP_MINUTES) * INTERVAL_STEP_MINUTES;
    for (let t = alignedStart; t + duration <= end; t += INTERVAL_STEP_MINUTES) {
      const candidateEnd = t + duration;
      const hasConflict = busy.some((range) =>
        overlaps(t, candidateEnd, timeToMinutes(range.start), timeToMinutes(range.end)),
      );
      if (!hasConflict) starts.push(minutesToHm(t));
    }
  }

  return {
    consultant_id: consultant.consultant_id,
    resource_id: consultant.resource_id,
    windows,
    busy,
    starts,
    step_minutes: INTERVAL_STEP_MINUTES,
    duration_minutes: duration,
  };
}
