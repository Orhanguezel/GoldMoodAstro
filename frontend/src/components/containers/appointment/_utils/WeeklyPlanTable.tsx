// =============================================================
// FILE: src/components/containers/appointment/_utils/WeeklyPlanTable.tsx
// FINAL — Weekly plan table (i18n DOW labels via t())
// =============================================================

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ResourceWorkingHourDto } from '@/integrations/shared';

import { isValidHm, isValidYmd, safeStr, buildDowLabels } from '../_utils/appointmentHelpers';

type DayCell = {
  dow: number;
  rangeText: string;
  sessions: string[];
};

export type WeeklyPlanTableProps = {
  resourceId: string;
  selectedDate: string; // kept for API compatibility (not used)
  workingHours: ResourceWorkingHourDto[];
  whLoading: boolean;
  whError: boolean;
  t: (key: string, fallback: string) => string;
};

const HEADER_DAYS: number[] = [1, 2, 3, 4, 5, 6, 7];

function toHm(v: unknown): string {
  if (v instanceof Date) {
    const hh = String(v.getHours()).padStart(2, '0');
    const mm = String(v.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (s.includes('T') && s.includes(':')) return (s.split('T')[1] ?? '').slice(0, 5);
  return s.slice(0, 5);
}

function isActive01(v: unknown): boolean {
  if (v === true) return true;
  if (v === false) return false;
  return Number(v ?? 0) === 1;
}

function hmToMinutes(hm: string): number {
  if (!isValidHm(hm)) return NaN;
  const [h, m] = hm.split(':').map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

function minutesToHm(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function mergeRanges(ranges: Array<[string, string]>): Array<[string, string]> {
  const sorted = ranges
    .filter(([a, b]) => isValidHm(a) && isValidHm(b) && a < b)
    .sort((x, y) => x[0].localeCompare(y[0]));

  const out: Array<[string, string]> = [];
  for (const [s, e] of sorted) {
    const last = out[out.length - 1];
    if (!last) out.push([s, e]);
    else if (s <= last[1]) last[1] = e > last[1] ? e : last[1];
    else out.push([s, e]);
  }
  return out;
}

function generateSessionsForRange(
  startHm: string,
  endHm: string,
  slotMinutes: number,
  breakMinutes: number,
): string[] {
  const start = hmToMinutes(startHm);
  const end = hmToMinutes(endHm);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];

  const slot = Math.max(1, Math.trunc(slotMinutes));
  const step = Math.max(1, slot + Math.max(0, Math.trunc(breakMinutes)));

  const out: string[] = [];
  for (let t = start; t + slot <= end; t += step) {
    out.push(minutesToHm(t));
    if (out.length > 500) break;
  }
  return out;
}

function buildTemplateForDow(
  wh: ResourceWorkingHourDto[],
  dow: number,
): Pick<DayCell, 'rangeText' | 'sessions'> {
  const items = (wh || [])
    .filter((x) => Number((x as any).dow) === dow)
    .filter((x) => isActive01((x as any).is_active));

  if (!items.length) return { rangeText: '-', sessions: [] };

  const ranges = items
    .map((x) => [toHm((x as any).start_time), toHm((x as any).end_time)] as [string, string])
    .filter(([a, b]) => isValidHm(a) && isValidHm(b) && a < b);

  const merged = mergeRanges(ranges);
  const rangeText =
    merged.length && merged[0][0] && merged[merged.length - 1][1]
      ? `${merged[0][0]}–${merged[merged.length - 1][1]}`
      : '-';

  const all: string[] = [];
  for (const it of items) {
    all.push(
      ...generateSessionsForRange(
        toHm((it as any).start_time),
        toHm((it as any).end_time),
        Number((it as any).slot_minutes ?? 60),
        Number((it as any).break_minutes ?? 0),
      ),
    );
  }

  const sessions = Array.from(new Set(all))
    .filter((x) => isValidHm(x))
    .sort((a, b) => a.localeCompare(b));

  return { rangeText, sessions };
}

export const WeeklyPlanTable: React.FC<WeeklyPlanTableProps> = ({
  resourceId,
  selectedDate,
  workingHours,
  whLoading,
  whError,
  t,
}) => {
  const rid = safeStr(resourceId);
  const selectedYmd = safeStr(selectedDate);

  // ✅ i18n DOW labels (from ui_appointment) + TR fallback
  const dowLabels = useMemo(() => buildDowLabels(t), [t]);

  // cache per therapist to avoid blinking
  const whCacheRef = useRef<Record<string, ResourceWorkingHourDto[]>>({});
  useEffect(() => {
    if (!rid) return;
    if (Array.isArray(workingHours) && workingHours.length > 0) {
      whCacheRef.current[rid] = workingHours;
    }
  }, [rid, workingHours]);

  const effectiveWh: ResourceWorkingHourDto[] = useMemo(() => {
    if (!rid) return [];
    if (Array.isArray(workingHours) && workingHours.length > 0) return workingHours;
    return whCacheRef.current[rid] || [];
  }, [rid, workingHours]);

  const cells = useMemo(() => {
    const map: Record<number, DayCell> = {};
    for (const dow of HEADER_DAYS) {
      const tpl = buildTemplateForDow(effectiveWh, dow);
      map[dow] = { dow, rangeText: tpl.rangeText, sessions: tpl.sessions };
    }
    return map;
  }, [effectiveWh]);

  const defaultDow = useMemo(() => {
    if (!isValidYmd(selectedYmd)) return 1;
    const d = new Date(`${selectedYmd}T00:00:00`);
    const js = d.getDay(); // 0=Sun
    return js === 0 ? 7 : js;
  }, [selectedYmd]);

  const [activeDow, setActiveDow] = useState<number>(defaultDow);
  useEffect(() => setActiveDow(defaultDow), [defaultDow]);

  if (!rid) {
    return (
      <div className="bg-bg-card border border-border-light px-4 py-3 rounded-sm text-text-secondary text-sm">
        {t('ui_appointment_weekly_pick_therapist', 'Select a therapist to view the weekly plan.')}
      </div>
    );
  }

  const active = cells[activeDow] || cells[1];
  const rangeText = active?.rangeText ?? '-';
  const sessions = active?.sessions ?? [];

  return (
    <div className="w-full">
      {whError ? (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-sm mb-4 text-sm">
          {t('ui_appointment_weekly_wh_error', 'Working hours could not be loaded.')}
        </div>
      ) : null}

      {/* Tabs (warm mockup style) */}
      <div className="flex flex-wrap gap-2">
        {HEADER_DAYS.map((dow) => {
          const label = dowLabels[dow] || String(dow);
          const isActive = dow === activeDow;
          return (
            <button
              key={dow}
              type="button"
              onClick={() => setActiveDow(dow)}
              className={[
                'px-3 py-2 rounded-xl text-sm font-bold border transition-colors',
                isActive
                  ? 'bg-brand-primary/10 border-brand-primary/25 text-text-primary'
                  : 'bg-bg-card border-border-light text-text-secondary hover:text-text-primary hover:border-border-medium',
              ].join(' ')}
              aria-pressed={isActive}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 bg-bg-secondary border border-border-light rounded-2xl p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4 border-b border-border-light pb-3">
          <div className="text-base font-bold text-text-primary">
            {dowLabels[activeDow] || String(activeDow)}
          </div>
          <div className="text-xs text-text-secondary font-semibold">{rangeText}</div>
        </div>

        {sessions.length ? (
          <div className="flex flex-wrap gap-2">
            {sessions.map((tm) => (
              <span
                key={tm}
                className="inline-flex items-center justify-center px-3 py-1.5 bg-brand-primary/5 text-text-primary text-xs font-bold border border-brand-primary/10"
              >
                {tm}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-text-muted text-sm italic">-</div>
        )}

        {whLoading && rangeText === '-' ? (
          <div className="text-xs text-brand-primary animate-pulse mt-3">
            {t('ui_appointment_weekly_wh_loading', 'Loading...')}
          </div>
        ) : null}
      </div>
    </div>
  );
};
