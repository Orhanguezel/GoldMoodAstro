// =============================================================
// FILE: src/components/containers/appointment/_utils/appointmentHelpers.ts
// FINAL — Appointment helpers
// =============================================================

import type { ResourcePublicItemDto, ResourceSlotDto } from '@/integrations/shared';
import { safeStr, isValidEmail, isValidYmd, isValidHm } from '@/integrations/shared';

export { safeStr, isValidEmail, isValidYmd, isValidHm };

export function normalizePhone(v: string): string {
  return v.replace(/\s+/g, ' ').trim();
}

export function toBool01(v: unknown): boolean {
  return Number(v ?? 0) === 1 || v === true;
}

export function therapistLabelText(r: ResourcePublicItemDto): string {
  const title =
    safeStr((r as any)?.title) ||
    safeStr((r as any)?.label) ||
    safeStr((r as any)?.name) ||
    safeStr((r as any)?.full_name) ||
    safeStr((r as any)?.display_name);
  return title || '';
}

function toHm(v: unknown): string {
  if (v instanceof Date) {
    const hh = String(v.getHours()).padStart(2, '0');
    const mm = String(v.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  const s = safeStr(v);
  if (!s) return '';
  if (s.includes('T') && s.includes(':')) return (s.split('T')[1] || '').slice(0, 5);
  return s.slice(0, 5);
}

export function slotTime(s: ResourceSlotDto): string {
  const raw = (s as any)?.slot_time ?? (s as any)?.time ?? (s as any)?.appointment_time;
  return toHm(raw);
}

export function slotIsActive(s: ResourceSlotDto): boolean {
  return toBool01((s as any)?.is_active);
}

export function slotIsAvailable(s: ResourceSlotDto): boolean {
  const avail = (s as any)?.available;
  if (typeof avail === 'boolean') return avail;

  const cap = Number((s as any)?.capacity ?? 0);
  const reserved = Number((s as any)?.reserved_count ?? 0);
  if (!cap) return slotIsActive(s);
  return slotIsActive(s) && reserved < cap;
}

/* ---- week helpers ---- */

export function getDow1to7(ymd: string): number {
  const d = new Date(`${ymd}T00:00:00`);
  const js = d.getDay(); // 0..6
  return js === 0 ? 7 : js;
}

export function addDays(ymd: string, delta: number): string {
  const d = new Date(`${ymd}T00:00:00`);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function weekStartMonday(ymd: string): string {
  const dow = getDow1to7(ymd);
  return addDays(ymd, -(dow - 1));
}

/**
 * Backward compatible TR labels (fallback).
 * Prefer UI-driven labels via buildDowLabels().
 */
export const DOW_LABELS_TR: Record<number, string> = {
  1: 'Pazartesi',
  2: 'Salı',
  3: 'Çarşamba',
  4: 'Perşembe',
  5: 'Cuma',
  6: 'Cumartesi',
  7: 'Pazar',
};

/**
 * Build DOW labels from i18n t() (ui_appointment keys).
 * Pass your local t() to avoid importing i18n here.
 */
export function buildDowLabels(t: (k: string, fb: string) => string): Record<number, string> {
  return {
    1: t('ui_dow_1', DOW_LABELS_TR[1]),
    2: t('ui_dow_2', DOW_LABELS_TR[2]),
    3: t('ui_dow_3', DOW_LABELS_TR[3]),
    4: t('ui_dow_4', DOW_LABELS_TR[4]),
    5: t('ui_dow_5', DOW_LABELS_TR[5]),
    6: t('ui_dow_6', DOW_LABELS_TR[6]),
    7: t('ui_dow_7', DOW_LABELS_TR[7]),
  };
}
