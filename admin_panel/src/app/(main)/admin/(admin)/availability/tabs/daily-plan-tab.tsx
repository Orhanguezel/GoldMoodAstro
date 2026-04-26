// =============================================================
// FILE: src/components/admin/availability/tabs/DailyPlanTab.tsx
// FINAL — Daily plan tab (select WH range + preview + DB plan)
// =============================================================

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { AdminOverrideSlotPayload, PlannedSlotDto } from '@/integrations/shared';
import { hmToMinutes, minutesToHm, normalizeHm, normalizeYmd } from '@/integrations/shared';
import {
  useListWorkingHoursAdminQuery,
  useListRecurringOverridesAdminQuery,
  useGetDailyPlanAdminQuery,
  useGenerateSlotsAdminMutation,
  useOverrideDayAdminMutation,
  useOverrideSlotAdminMutation,
} from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

const toStr = (v: unknown) => String(v ?? '').trim();
const todayYmd = () => normalizeYmd(new Date().toISOString());

const formatCapacity = (cap: number, reserved: number) => {
  const c = Number(cap ?? 0);
  const r = Number(reserved ?? 0);
  if (c <= 0) return '-';
  return `${r}/${c}`;
};

const getDow1to7 = (ymd: string): number => {
  // JS: 0=Sun..6=Sat  -> 1=Mon..7=Sun
  const d = new Date(`${ymd}T00:00:00`);
  const js = d.getDay();
  if (js === 0) return 7;
  return js;
};

type WhRow = {
  id: string;
  dow: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  break_minutes: number;
  capacity: number;
  is_active: boolean;
};

type PreviewSession = {
  time: string;
  wh_id: string;
  capacity: number;
  slot_minutes: number;
  break_minutes: number;
  range: string;
};

export type DailyPlanTabProps = {
  resourceId: string;
  hasResourceId: boolean;
  disabled: boolean;

  // Weekly tab'dan "Düzenle" ile gelince
  initialDow?: number;
  initialWhId?: string;
};

function DailyPlanHeader(props: {
  busy: boolean;
  effectiveDate: string;
  dayDow: number;
  t: (key: string) => string;
  onChangeDate: (ymd: string) => void;
  onRefresh: () => void;
  onGenerate: () => void;
  onCloseDay: () => void;
  onOpenDay: () => void;
}) {
  const {
    busy,
    effectiveDate,
    dayDow,
    t,
    onChangeDate,
    onRefresh,
    onGenerate,
    onCloseDay,
    onOpenDay,
  } = props;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div>
          <div className="text-sm font-semibold">{t('availability.daily.title')}</div>
          <div className="text-xs text-muted-foreground">
            {t('availability.daily.description')}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {busy ? (
            <Badge variant="secondary" className="text-xs">
              {t('availability.common.loading')}
            </Badge>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={onRefresh} disabled={busy}>
            {t('availability.header.actions.refresh')}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <Label>{t('availability.daily.fields.date')}</Label>
          <Input
            type="date"
            value={effectiveDate}
            onChange={(e) => onChangeDate(e.target.value)}
            disabled={busy}
          />
          <div className="text-xs text-muted-foreground">
            {t('availability.daily.fields.dayOfWeek').replace('{dow}', String(dayDow))}
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col gap-2 md:items-end">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onGenerate} disabled={busy}>
              {t('availability.daily.actions.generate')}
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={onCloseDay} disabled={busy}>
              {t('availability.daily.actions.closeDay')}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onOpenDay} disabled={busy}>
              {t('availability.daily.actions.openDay')}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            {t('availability.daily.notes.capacityCheck')}
          </div>
        </div>
      </div>

      <Separator className="my-4" />
    </>
  );
}

function PreviewSessionsTable(props: {
  busy: boolean;
  t: (key: string) => string;
  whForDay: WhRow[];
  selectedWhId: string;
  onSelectWhId: (id: string) => void;
  preview: PreviewSession[];
}) {
  const { busy, t, whForDay, selectedWhId, onSelectWhId, preview } = props;

  const hasRanges = whForDay.length > 0;
  const hasPreview = preview.length > 0;

  return (
    <>
      <div className="mb-2">
        <div className="text-sm font-semibold">{t('availability.daily.preview.title')}</div>
        <div className="text-xs text-muted-foreground">
          {t('availability.daily.preview.description')}
        </div>
      </div>

      {!hasRanges ? (
        <div className="rounded-md border border-muted bg-muted/40 px-3 py-2 text-sm">
          {t('availability.daily.preview.noRanges')}
        </div>
      ) : (
        <>
          <div className="grid gap-2 md:grid-cols-2 mb-2">
            <div className="space-y-2">
              <Label>{t('availability.daily.preview.rangeLabel')}</Label>
              <Select value={selectedWhId} onValueChange={onSelectWhId} disabled={busy}>
                <SelectTrigger>
                  <SelectValue placeholder={t('availability.daily.preview.rangePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {whForDay.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.start_time}-{wh.end_time} • {wh.slot_minutes}dk + {wh.break_minutes}dk •
                      kap:{wh.capacity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                {t('availability.daily.preview.rangeHelp')}
              </div>
            </div>
          </div>

          {!selectedWhId ? (
            <div className="rounded-md border border-muted bg-muted/40 px-3 py-2 text-sm">
              {t('availability.daily.preview.selectRange')}
            </div>
          ) : !hasPreview ? (
            <div className="rounded-md border border-muted bg-muted/40 px-3 py-2 text-sm">
              {t('availability.daily.preview.noPreview')}
            </div>
          ) : (
            <div className="overflow-x-auto mb-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ width: 120 }}>{t('availability.daily.columns.time')}</TableHead>
                    <TableHead style={{ width: 120 }}>{t('availability.daily.columns.capacity')}</TableHead>
                    <TableHead>{t('availability.daily.columns.range')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((s) => (
                    <TableRow key={`${s.wh_id}:${s.time}`}>
                      <TableCell className="text-nowrap">
                        <Badge variant="outline">{s.time}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{s.capacity}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.range}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </>
  );
}

function DbPlanTable(props: {
  busy: boolean;
  t: (key: string) => string;
  planRows: PlannedSlotDto[];
  onToggle: (row: PlannedSlotDto) => void;
}) {
  const { busy, t, planRows, onToggle } = props;
  const hasPlan = planRows.length > 0;

  return (
    <>
      <div className="mb-2">
        <div className="text-sm font-semibold">{t('availability.daily.dbPlan.title')}</div>
        <div className="text-xs text-muted-foreground">{t('availability.daily.dbPlan.description')}</div>
      </div>

      {!hasPlan ? (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
          {t('availability.daily.dbPlan.empty')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: 110 }}>{t('availability.daily.columns.time')}</TableHead>
                <TableHead style={{ width: 140 }}>{t('availability.daily.columns.capacity')}</TableHead>
                <TableHead style={{ width: 140 }}>{t('availability.daily.columns.status')}</TableHead>
                <TableHead className="text-right" style={{ width: 160 }}>
                  {t('availability.list.columns.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planRows.map((p) => {
                const time = normalizeHm((p as any).time);
                const isActive = Number((p as any).is_active ?? 0) === 1;
                const cap = Number((p as any).capacity ?? 0);
                const reserved = Number((p as any).reserved_count ?? 0);
                const available = !!(p as any).available;

                return (
                  <TableRow key={String((p as any).id || `${time}:${toStr((p as any).slot_id || '')}`)}>
                    <TableCell className="text-nowrap">
                      <Badge variant="outline">{time}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatCapacity(cap, reserved)}
                      {cap > 0 ? <span className="text-xs text-muted-foreground ml-2">{t('availability.daily.capacityLegend')}</span> : null}
                    </TableCell>
                    <TableCell className="text-nowrap">
                      {isActive ? (
                        available ? (
                          <Badge className="bg-emerald-100 text-emerald-700">{t('availability.daily.statusOpen')}</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-700">{t('availability.daily.statusFull')}</Badge>
                        )
                      ) : (
                        <Badge variant="secondary">{t('availability.daily.statusClosed')}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-nowrap">
                      <Button
                        type="button"
                        variant={isActive ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => onToggle(p)}
                        disabled={busy}
                      >
                        {isActive ? t('availability.daily.actions.closeSlot') : t('availability.daily.actions.openSlot')}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-3 rounded-md border border-muted bg-muted/40 px-3 py-2 text-sm">
        <div className="font-semibold mb-1">{t('availability.daily.rules.title')}</div>
        <div>{t('availability.daily.rules.weekly')}</div>
        <div>{t('availability.daily.rules.db')}</div>
        <div>{t('availability.daily.rules.empty')}</div>
      </div>
    </>
  );
}

export const DailyPlanTab: React.FC<DailyPlanTabProps> = ({
  resourceId,
  hasResourceId,
  disabled,
  initialDow,
  initialWhId,
}) => {
  const t = useAdminT();
  const [selectedDate, setSelectedDate] = useState<string>(() => todayYmd());
  const effectiveDate = useMemo(() => normalizeYmd(selectedDate) || todayYmd(), [selectedDate]);
  const dayDow = useMemo(() => getDow1to7(effectiveDate), [effectiveDate]);

  // Weekly hours
  const whArgs = useMemo(
    () => (hasResourceId ? ({ resource_id: resourceId } as any) : undefined),
    [hasResourceId, resourceId],
  );
  const whQuery = useListWorkingHoursAdminQuery(
    whArgs as any,
    { skip: !whArgs, refetchOnMountOrArgChange: true } as any,
  );
  const recurringQuery = useListRecurringOverridesAdminQuery(
    whArgs as any,
    { skip: !whArgs, refetchOnMountOrArgChange: true } as any,
  );

  const whRows: WhRow[] = useMemo(() => {
    const list: any[] = (whQuery.data as any) ?? [];
    return [...list].map((r) => ({
      id: toStr(r.id),
      dow: Number(r.dow ?? 1),
      start_time: normalizeHm(r.start_time),
      end_time: normalizeHm(r.end_time),
      slot_minutes: Number(r.slot_minutes ?? 60),
      break_minutes: Number(r.break_minutes ?? 0),
      capacity: Number(r.capacity ?? 1),
      is_active: Number(r.is_active ?? 0) === 1,
    }));
  }, [whQuery.data]);

  const recurringByDow = useMemo(() => {
    const rows: any[] = (recurringQuery.data as any) ?? [];
    const out = new Map<number, boolean>();
    for (const row of rows) {
      out.set(Number(row?.dow ?? 0), Number(row?.is_active ?? 0) === 1);
    }
    return out;
  }, [recurringQuery.data]);

  const effectiveDow = Number(initialDow ?? dayDow);
  const recurringClosed = recurringByDow.get(effectiveDow) === false;

  // Active WH ranges for this day
  const whForDay = useMemo(() => {
    if (recurringClosed) return [];
    const d = effectiveDow;
    return whRows
      .filter((r) => r.is_active)
      .filter((r) => Number(r.dow) === d)
      .sort((a, b) => hmToMinutes(a.start_time) - hmToMinutes(b.start_time));
  }, [whRows, effectiveDow, recurringClosed]);

  // Selected WH for preview
  const [selectedWhId, setSelectedWhId] = useState<string>('');

  // When coming from Weekly "Düzenle", preselect
  useEffect(() => {
    if (initialWhId) {
      setSelectedWhId(String(initialWhId));
      return;
    }
    // default: first range
    if (!selectedWhId && whForDay.length) setSelectedWhId(whForDay[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialWhId, whForDay.length]);

  const selectedWh = useMemo(
    () => whForDay.find((x) => x.id === selectedWhId) || null,
    [whForDay, selectedWhId],
  );

  // PREVIEW from selected WH
  const preview: PreviewSession[] = useMemo(() => {
    if (!selectedWh) return [];
    const wh = selectedWh;

    const out: PreviewSession[] = [];
    const s = hmToMinutes(wh.start_time);
    const e = hmToMinutes(wh.end_time);

    const slotLen = Math.max(1, Number(wh.slot_minutes ?? 60));
    const step = Math.max(1, slotLen + Math.max(0, Number(wh.break_minutes ?? 0)));

    if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return [];

    for (let t = s; t + slotLen <= e; t += step) {
      out.push({
        time: minutesToHm(t),
        wh_id: wh.id,
        capacity: Math.max(0, Number(wh.capacity ?? 1)),
        slot_minutes: slotLen,
        break_minutes: Math.max(0, Number(wh.break_minutes ?? 0)),
        range: `${wh.start_time}-${wh.end_time} • ${slotLen}dk + ${Math.max(
          0,
          Number(wh.break_minutes ?? 0),
        )}dk`,
      });
    }

    return out.sort((a, b) => hmToMinutes(a.time) - hmToMinutes(b.time));
  }, [selectedWh]);

  // DB plan
  const planArgs = useMemo(
    () => (hasResourceId ? ({ resource_id: resourceId, date: effectiveDate } as any) : undefined),
    [hasResourceId, resourceId, effectiveDate],
  );

  const planQuery = useGetDailyPlanAdminQuery(
    planArgs as any,
    { skip: !planArgs, refetchOnMountOrArgChange: true } as any,
  );

  const planRows: PlannedSlotDto[] = useMemo(() => {
    const list: PlannedSlotDto[] = (planQuery.data as any) ?? [];
    return [...list].sort(
      (a, b) =>
        hmToMinutes(normalizeHm((a as any).time)) - hmToMinutes(normalizeHm((b as any).time)),
    );
  }, [planQuery.data]);

  const [generateSlots, { isLoading: isGenerating }] = useGenerateSlotsAdminMutation();
  const [overrideDay, { isLoading: isOverridingDay }] = useOverrideDayAdminMutation();
  const [overrideSlot, { isLoading: isOverridingSlot }] = useOverrideSlotAdminMutation();

  const busy =
    disabled ||
    whQuery.isLoading ||
    whQuery.isFetching ||
    recurringQuery.isLoading ||
    recurringQuery.isFetching ||
    planQuery.isLoading ||
    planQuery.isFetching ||
    isGenerating ||
    isOverridingDay ||
    isOverridingSlot;

  const handleGenerate = async () => {
    if (!hasResourceId) return;
    try {
      const res = await generateSlots({
        resource_id: resourceId,
        date: effectiveDate,
      } as any).unwrap();
      toast.success(
        t('availability.daily.messages.generateSuccess')
          .replace('{created}', String((res as any)?.created ?? 0))
          .replace('{planned}', String((res as any)?.planned ?? 0)),
      );
      await planQuery.refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || t('availability.daily.messages.generateFailed'));
    }
  };

  const handleOverrideDay = async (isActive: boolean) => {
    if (!hasResourceId) return;
    try {
      const res = await overrideDay({
        resource_id: resourceId,
        date: effectiveDate,
        is_active: isActive,
      } as any).unwrap();
      toast.success(
        t('availability.daily.messages.dayUpdated').replace('{updated}', String((res as any)?.updated ?? 0)),
      );
      await planQuery.refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || t('availability.daily.messages.dayUpdateFailed'));
    }
  };

  const handleToggleSlot = async (row: PlannedSlotDto) => {
    if (!hasResourceId) return;
    const time = normalizeHm((row as any).time);
    if (!time) return;

    const nextActive = !(Number((row as any).is_active ?? 0) === 1);
    const reserved = Number((row as any).reserved_count ?? 0);

    if (!nextActive && reserved > 0) {
      const ok = window.confirm(
        t('availability.daily.messages.reservationWarning').replace('{reserved}', String(reserved)),
      );
      if (!ok) return;
    }

    const payload: AdminOverrideSlotPayload = {
      resource_id: resourceId as any,
      date: effectiveDate as any,
      time: time as any,
      is_active: nextActive,
    };

    try {
      await overrideSlot(payload as any).unwrap();
      toast.success(t('availability.daily.messages.slotUpdated'));
      await planQuery.refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || t('availability.daily.messages.slotUpdateFailed'));
    }
  };

  return (
    <>
      <DailyPlanHeader
        busy={busy}
        effectiveDate={effectiveDate}
        dayDow={dayDow}
        t={t}
        onChangeDate={(v) => setSelectedDate(normalizeYmd(v) || todayYmd())}
        onRefresh={() => planQuery.refetch()}
        onGenerate={handleGenerate}
        onCloseDay={() => void handleOverrideDay(false)}
        onOpenDay={() => void handleOverrideDay(true)}
      />

      <PreviewSessionsTable
        busy={busy}
        t={t}
        whForDay={whForDay}
        selectedWhId={selectedWhId}
        onSelectWhId={setSelectedWhId}
        preview={preview}
      />

      {recurringClosed ? (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t('availability.recurring.preview.closedByRecurring')}
        </div>
      ) : null}

      <DbPlanTable busy={busy} t={t} planRows={planRows} onToggle={handleToggleSlot} />
    </>
  );
};
