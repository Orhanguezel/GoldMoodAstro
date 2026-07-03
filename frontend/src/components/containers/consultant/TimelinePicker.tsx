'use client';

import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import {
  useGetConsultantAvailabilityPublicQuery,
  type ConsultantAvailabilityBusyRange,
} from '@/integrations/rtk/public/consultants.public.endpoints';
import { useUiSection } from '@/i18n';
import SlotCalendar from './SlotCalendar';

export interface TimelineSelection {
  date: string;
  time: string;
  end: string;
  duration_minutes: number;
  resource_id: string | null;
}

interface Props {
  consultantId: string;
  locale: string;
  durationMinutes: number;
  serviceId?: string | null;
  selected?: TimelineSelection | null;
  onSelect: (selection: TimelineSelection) => void;
}

function timeToMinutes(value: string) {
  const [h, m] = value.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

function minutesToHm(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function percent(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return ((value - min) / (max - min)) * 100;
}

function groupStarts(starts: string[]) {
  return [
    { key: 'morning', labelKey: 'ui_consultant_timeline_morning', fallback: 'Sabah', items: starts.filter((time) => timeToMinutes(time) < 12 * 60) },
    { key: 'afternoon', labelKey: 'ui_consultant_timeline_afternoon', fallback: 'Ogle', items: starts.filter((time) => timeToMinutes(time) >= 12 * 60 && timeToMinutes(time) < 17 * 60) },
    { key: 'evening', labelKey: 'ui_consultant_timeline_evening', fallback: 'Aksam', items: starts.filter((time) => timeToMinutes(time) >= 17 * 60) },
  ].filter((group) => group.items.length > 0);
}

export default function TimelinePicker({ consultantId, locale, durationMinutes, serviceId, selected, onSelect }: Props) {
  const { ui } = useUiSection('ui_consultant', locale);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data, isFetching, isError } = useGetConsultantAvailabilityPublicQuery({
    id: consultantId,
    date: dateStr,
    duration: durationMinutes,
    service_id: serviceId || undefined,
    locale,
  });

  const ranges = data?.windows ?? [];
  const starts = data?.starts ?? [];
  const busy = data?.busy ?? [];
  const selectedStart = selected?.date === dateStr ? selected.time : null;
  const selectedEnd = selectedStart ? minutesToHm(timeToMinutes(selectedStart) + durationMinutes) : null;

  const bounds = useMemo(() => {
    if (ranges.length === 0) return null;
    const min = Math.min(...ranges.map((range) => timeToMinutes(range.start)));
    const max = Math.max(...ranges.map((range) => timeToMinutes(range.end)));
    return { min, max };
  }, [ranges]);

  const choose = (time: string) => {
    onSelect({
      date: dateStr,
      time,
      end: minutesToHm(timeToMinutes(time) + durationMinutes),
      duration_minutes: durationMinutes,
      resource_id: data?.resource_id ?? null,
    });
  };

  const renderBusy = (range: ConsultantAvailabilityBusyRange, index: number) => {
    if (!bounds) return null;
    const left = percent(timeToMinutes(range.start), bounds.min, bounds.max);
    const width = Math.max(1, percent(timeToMinutes(range.end), bounds.min, bounds.max) - left);
    return (
      <div
        key={`${range.kind}-${range.start}-${index}`}
        className={`absolute top-1 bottom-1 rounded-full ${
          range.kind === 'block'
            ? 'bg-[var(--gm-error)]/35 bg-[repeating-linear-gradient(45deg,rgba(229,91,77,0.35)_0,rgba(229,91,77,0.35)_6px,rgba(229,91,77,0.18)_6px,rgba(229,91,77,0.18)_12px)]'
            : 'bg-[var(--gm-gold)]/45'
        }`}
        style={{ left: `${left}%`, width: `${width}%` }}
        title={`${range.start} - ${range.end}`}
      />
    );
  };

  return (
    <div className="space-y-5">
      <SlotCalendar locale={locale} selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-bg-deep)]/25 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)]">
              {ui('ui_consultant_timeline_title', 'Zaman cizgisi')}
            </p>
            <p className="text-[12px] font-serif italic text-[var(--gm-text-dim)]">
              {selectedStart && selectedEnd
                ? `${selectedStart} - ${selectedEnd} (${durationMinutes} ${ui('ui_consultant_minutes_short', 'dk')})`
                : ui('ui_consultant_timeline_hint', 'Uygun baslangic saatlerinden birini secin.')}
            </p>
          </div>
          {isFetching && <Loader2 className="h-4 w-4 animate-spin text-[var(--gm-gold)]" />}
        </div>

        {bounds ? (
          <div className="space-y-2">
            <div className="relative h-9 overflow-hidden rounded-full border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]">
              {ranges.map((range, index) => {
                const left = percent(timeToMinutes(range.start), bounds.min, bounds.max);
                const width = percent(timeToMinutes(range.end), bounds.min, bounds.max) - left;
                return (
                  <div
                    key={`${range.start}-${range.end}-${index}`}
                    className="absolute top-1 bottom-1 rounded-full bg-[var(--gm-success)]/14"
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                );
              })}
              {busy.map(renderBusy)}
              {selectedStart && selectedEnd && (
                <div
                  className="absolute top-0.5 bottom-0.5 rounded-full border border-[var(--gm-gold)] bg-[var(--gm-gold)]/25 shadow-[0_0_18px_rgba(212,175,55,0.25)]"
                  style={{
                    left: `${percent(timeToMinutes(selectedStart), bounds.min, bounds.max)}%`,
                    width: `${Math.max(1, percent(timeToMinutes(selectedEnd), bounds.min, bounds.max) - percent(timeToMinutes(selectedStart), bounds.min, bounds.max))}%`,
                  }}
                />
              )}
            </div>
            <div className="flex justify-between text-[10px] text-[var(--gm-muted)]">
              <span>{minutesToHm(bounds.min)}</span>
              <span>{minutesToHm(bounds.max)}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--gm-border-soft)] p-5 text-center text-sm font-serif italic text-[var(--gm-text-dim)]">
            {isError ? ui('ui_consultant_timeline_error', 'Uygunluk getirilemedi.') : ui('ui_consultant_timeline_closed', 'Bu gun icin calisma saati yok.')}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {groupStarts(starts).map((group) => (
          <div key={group.key} className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-muted)]">
              {ui(group.labelKey, group.fallback)}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {group.items.map((time) => {
                const isSelected = selectedStart === time;
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => choose(time)}
                    className={`rounded-full border px-3 py-2 text-[11px] font-bold transition ${
                      isSelected
                        ? 'border-[var(--gm-gold)] bg-[var(--gm-gold)] text-[var(--gm-bg-deep)]'
                        : 'border-[var(--gm-border-soft)] bg-[var(--gm-surface)] text-[var(--gm-text)] hover:border-[var(--gm-gold)]/50'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {!isFetching && starts.length === 0 && bounds && (
          <div className="rounded-xl border border-dashed border-[var(--gm-border-soft)] p-5 text-center text-sm font-serif italic text-[var(--gm-text-dim)]">
            {ui('ui_consultant_timeline_no_starts', 'Bu sure icin uygun baslangic kalmadi.')}
          </div>
        )}
      </div>
    </div>
  );
}
