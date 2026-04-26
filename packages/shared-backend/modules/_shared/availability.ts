// =============================================================
// FILE: src/modules/_shared/availability.ts
// FINAL — Availability module types
// =============================================================

import type { Hm } from '../_shared';
import { sql } from 'drizzle-orm';

export type Dow = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type AvailabilityExistsResult =
  | {
      exists: true;
      slot_id: string;
      is_active: 0 | 1;
      capacity: number;
      reserved_count: number;
      available: boolean;
    }
  | {
      exists: false;
      // derived from working-hours if any match exists
      is_active: 0 | 1; // if WH says active+aligned => 1 else 0
      capacity: number | null;
      reserved_count: 0;
      available: boolean;
    };

export type ReserveResult =
  | { ok: true; slot_id: string; capacity: number }
  | { ok: false; reason: 'slot_not_available' | 'invalid_slot' | 'invalid_input' };

export type ReleaseResult =
  | { ok: true; slot_id: string; reserved_count: number }
  | { ok: false; reason: 'invalid_slot' | 'invalid_input' };

export type MoveResult =
  | { ok: true; to_slot_id: string; capacity: number }
  | { ok: false; reason: 'slot_not_available' | 'invalid_slot' | 'invalid_input' };

export type WorkingHourRowDTO = {
  id: string;
  resource_id: string;
  dow: Dow;
  start_time: string; // "HH:mm:00" from DB
  end_time: string; // "HH:mm:00"
  slot_minutes: number;
  break_minutes: number;
  capacity: number;
  is_active: 0 | 1;
  created_at: any;
  updated_at: any;
};

export type SlotRowDTO = {
  id: string;
  slot_time: string; // "HH:mm:00"
  capacity: number;
  is_active: 0 | 1;
  reserved_count: number;
};

export type PlannedSlotDTO = {
  time: Hm; // "HH:mm"
  // derived from WH window
  wh_id: string;
  wh_start_time: string; // "HH:mm:00"
  wh_end_time: string; // "HH:mm:00"
  slot_minutes: number;
  break_minutes: number;

  // merged override (if exists)
  slot_id: string | null;
  is_active: 0 | 1;
  capacity: number;
  reserved_count: number;

  available: boolean;
};


export function hmToTimeSql(hm: string) {
  // store TIME safely
  return sql`STR_TO_DATE(${`${hm}:00`}, '%H:%i:%s')`;
}



/* -------------------- SQL time helpers -------------------- */

export function hmToTimeStr(hm: string) {
  return `${hm}:00`;
}
export function ymdToDateSql(ymd: string) {
  return sql`STR_TO_DATE(${ymd}, '%Y-%m-%d')`;
}

/* -------------------- time helpers -------------------- */

export function timeStrToMinutes(t: unknown): number {
  if (t == null) return 0;
  if (t instanceof Date) return t.getHours() * 60 + t.getMinutes();

  const s = String(t).trim();
  if (!s) return 0;

  if (s.includes('T') && s.includes(':')) {
    const timePart = s.split('T')[1] ?? '';
    const hhmm = timePart.slice(0, 5);
    const [hh, mm] = hhmm.split(':');
    return Number(hh ?? 0) * 60 + Number(mm ?? 0);
  }

  const [hh, mm] = s.split(':');
  return Number(hh ?? 0) * 60 + Number(mm ?? 0);
}

export function minutesToHm(min: number): Hm {
  const m = Math.max(0, Math.floor(min));
  const hh = String(Math.floor(m / 60)).padStart(2, '0');
  const mm = String(m % 60).padStart(2, '0');
  return `${hh}:${mm}` as Hm;
}

export function extractHm(timeFromDb: unknown): Hm {
  if (timeFromDb instanceof Date) return minutesToHm(timeStrToMinutes(timeFromDb));
  const s = String(timeFromDb ?? '').trim();
  return (s.length >= 5 ? s.slice(0, 5) : '00:00') as Hm;
}

