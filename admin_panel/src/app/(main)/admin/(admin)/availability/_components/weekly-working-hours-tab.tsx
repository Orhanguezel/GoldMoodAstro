// =============================================================
// FILE: src/components/admin/availability/tabs/WeeklyWorkingHoursTab.tsx
// FINAL — Weekly working hours CRUD tab (+ Edit Day action)
// =============================================================

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

import type { AdminUpsertWorkingHourPayload, ResourceType } from '@/integrations/shared';
import { clampInt, hmToMinutes, normalizeHm, toActiveBool } from '@/integrations/shared';
import {
  useDeleteRecurringOverrideAdminMutation,
  useListRecurringOverridesAdminQuery,
  useListWorkingHoursAdminQuery,
  useUpsertRecurringOverrideAdminMutation,
  useUpsertWorkingHourAdminMutation,
  useDeleteWorkingHourAdminMutation,
} from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

// ✅ helper
const toStr = (v: unknown) => String(v ?? '').trim();

const toTimeMinutes = (hm: string) => hmToMinutes(hm);

type WhEditRow = {
  id: string;
  dow: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  break_minutes: number;
  capacity: number;
  is_active: boolean;
};

export type WeeklyWorkingHoursTabProps = {
  resourceId: string;
  hasResourceId: boolean;
  disabled: boolean;
  resourceType?: ResourceType;

  onEditDay?: (args: { dow: number; wh_id?: string }) => void;
};

export const WeeklyWorkingHoursTab: React.FC<WeeklyWorkingHoursTabProps> = ({
  resourceId,
  hasResourceId,
  disabled,
  onEditDay,
}) => {
  const t = useAdminT();

  const DOWS = useMemo(
    () => [
      { value: 1, label: t('availability.weekly.days.1') },
      { value: 2, label: t('availability.weekly.days.2') },
      { value: 3, label: t('availability.weekly.days.3') },
      { value: 4, label: t('availability.weekly.days.4') },
      { value: 5, label: t('availability.weekly.days.5') },
      { value: 6, label: t('availability.weekly.days.6') },
      { value: 7, label: t('availability.weekly.days.7') },
    ],
    [t],
  );

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

  const whRows = useMemo(() => {
    const list: any[] = (whQuery.data as any) ?? [];
    return [...list]
      .map((r) => ({
        id: toStr(r.id),
        dow: clampInt(r.dow, 1, 1, 7),
        start_time: normalizeHm(r.start_time),
        end_time: normalizeHm(r.end_time),
        slot_minutes: clampInt(r.slot_minutes, 60, 1, 24 * 60),
        break_minutes: clampInt(r.break_minutes, 0, 0, 24 * 60),
        capacity: clampInt(r.capacity, 1, 0, 999),
        is_active: toActiveBool(r.is_active),
      }))
      .sort((a, b) =>
        a.dow !== b.dow ? a.dow - b.dow : toTimeMinutes(a.start_time) - toTimeMinutes(b.start_time),
      );
  }, [whQuery.data]);

  const [whEdit, setWhEdit] = useState<Record<string, WhEditRow>>({});
  useEffect(() => {
    const next: Record<string, WhEditRow> = {};
    for (const r of whRows) next[r.id] = { ...r };
    setWhEdit(next);
  }, [whRows]);

  const [upsertWH, { isLoading: isSavingWh }] = useUpsertWorkingHourAdminMutation();
  const [deleteWH, { isLoading: isDeletingWh }] = useDeleteWorkingHourAdminMutation();
  const [upsertRecurring, { isLoading: isSavingRecurring }] = useUpsertRecurringOverrideAdminMutation();
  const [deleteRecurring, { isLoading: isDeletingRecurring }] = useDeleteRecurringOverrideAdminMutation();

  const busy =
    disabled ||
    whQuery.isLoading ||
    whQuery.isFetching ||
    recurringQuery.isLoading ||
    recurringQuery.isFetching ||
    isSavingWh ||
    isDeletingWh ||
    isSavingRecurring ||
    isDeletingRecurring;

  const [newWh, setNewWh] = useState<AdminUpsertWorkingHourPayload>(() => ({
    resource_id: resourceId || ('00000000-0000-0000-0000-000000000000' as any),
    dow: 1,
    start_time: '10:00' as any,
    end_time: '18:00' as any,
    slot_minutes: 60,
    break_minutes: 0,
    capacity: 1,
    is_active: true,
  }));

  useEffect(() => {
    if (!hasResourceId) return;
    setNewWh((p) => ({ ...p, resource_id: resourceId }) as any);
  }, [hasResourceId, resourceId]);

  const recurringRows = useMemo(() => {
    const list: any[] = (recurringQuery.data as any) ?? [];
    return [...list]
      .map((r) => ({
        id: toStr(r.id),
        dow: clampInt(r.dow, 1, 1, 7),
        is_active: toActiveBool(r.is_active),
      }))
      .sort((a, b) => a.dow - b.dow);
  }, [recurringQuery.data]);

  const recurringByDow = useMemo(() => {
    const out = new Map<number, { id: string; is_active: boolean }>();
    for (const row of recurringRows) out.set(row.dow, { id: row.id, is_active: row.is_active });
    return out;
  }, [recurringRows]);

  const validateRange = (start: string, end: string) => {
    const sMin = toTimeMinutes(start);
    const eMin = toTimeMinutes(end);
    return Number.isFinite(sMin) && Number.isFinite(eMin) && eMin > sMin;
  };

  const handleAdd = async () => {
    if (!hasResourceId) return;
    const start = normalizeHm(newWh.start_time);
    const end = normalizeHm(newWh.end_time);

    if (!validateRange(start, end)) {
      toast.error(
        t('availability.weekly.messages.invalidRange'),
      );
      return;
    }

    try {
      await upsertWH({
        resource_id: resourceId,
        dow: clampInt(newWh.dow, 1, 1, 7),
        start_time: start as any,
        end_time: end as any,
        slot_minutes: clampInt(newWh.slot_minutes, 60, 1, 24 * 60),
        break_minutes: clampInt(newWh.break_minutes, 0, 0, 24 * 60),
        capacity: clampInt(newWh.capacity, 1, 1, 999),
        is_active: toActiveBool(newWh.is_active),
      } as any).unwrap();

      toast.success(t('availability.weekly.messages.added'));
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.message ||
          t('availability.weekly.messages.addFailed'),
      );
    }
  };

  const handleUpdate = async (row: WhEditRow) => {
    if (!hasResourceId) return;
    const start = normalizeHm(row.start_time);
    const end = normalizeHm(row.end_time);

    if (!validateRange(start, end)) {
      toast.error(t('availability.weekly.messages.invalidRange'));
      return;
    }

    try {
      await upsertWH({
        id: row.id as any,
        resource_id: resourceId,
        dow: clampInt(row.dow, 1, 1, 7),
        start_time: start as any,
        end_time: end as any,
        slot_minutes: clampInt(row.slot_minutes, 60, 1, 24 * 60),
        break_minutes: clampInt(row.break_minutes, 0, 0, 24 * 60),
        capacity: clampInt(row.capacity, 1, 1, 999),
        is_active: !!row.is_active,
      } as any).unwrap();

      toast.success(t('availability.weekly.messages.updated'));
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.message ||
          t('availability.weekly.messages.updateFailed'),
      );
    }
  };

  const handleDelete = async (row: WhEditRow) => {
    const dayLabel = DOWS.find((x) => x.value === row.dow)?.label || String(row.dow);

    const ok = window.confirm(
      t('availability.weekly.messages.deleteConfirm')
        .replace('{day}', dayLabel)
        .replace('{start}', row.start_time)
        .replace('{end}', row.end_time),
    );
    if (!ok) return;

    try {
      await deleteWH({ id: String(row.id), resource_id: resourceId } as any).unwrap();
      toast.success(t('availability.weekly.messages.deleted'));
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.message ||
          t('availability.weekly.messages.deleteFailed'),
      );
    }
  };

  const handleEditDay = (row: WhEditRow) => {
    onEditDay?.({ dow: row.dow, wh_id: row.id });
  };

  const handleRecurringChange = async (dow: number, mode: 'default' | 'open' | 'closed') => {
    if (!hasResourceId) return;
    const existing = recurringByDow.get(dow);

    try {
      if (mode === 'default') {
        if (!existing?.id) return;
        await deleteRecurring({ id: existing.id, resource_id: resourceId } as any).unwrap();
        toast.success(t('availability.recurring.messages.deleted'));
        return;
      }

      await upsertRecurring({
        id: existing?.id || undefined,
        resource_id: resourceId,
        dow,
        is_active: mode === 'open',
      } as any).unwrap();
      toast.success(t('availability.recurring.messages.saved'));
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.message ||
          t('availability.recurring.messages.saveFailed'),
      );
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">{t('availability.weekly.title')}</div>
          <div className="text-xs text-muted-foreground">
            {t('availability.weekly.description')}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {busy ? (
            <Badge variant="secondary" className="text-xs">
              {t('availability.common.loading')}
            </Badge>
          ) : null}

          <Button variant="outline" size="sm" onClick={() => whQuery.refetch()} disabled={busy}>
            {t('availability.header.actions.refresh')}
          </Button>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 180 }}>{t('availability.weekly.columns.day')}</TableHead>
              <TableHead style={{ width: 120 }}>{t('availability.weekly.columns.start')}</TableHead>
              <TableHead style={{ width: 120 }}>{t('availability.weekly.columns.end')}</TableHead>
              <TableHead style={{ width: 120 }}>{t('availability.weekly.columns.session')}</TableHead>
              <TableHead style={{ width: 120 }}>{t('availability.weekly.columns.break')}</TableHead>
              <TableHead style={{ width: 110 }}>{t('availability.weekly.columns.capacity')}</TableHead>
              <TableHead style={{ width: 90 }}>{t('availability.weekly.columns.active')}</TableHead>
              <TableHead className="text-right" style={{ width: 260 }}>
                {t('availability.list.columns.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {whRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-sm text-muted-foreground">
                  {t('availability.weekly.empty')}
                </TableCell>
              </TableRow>
            ) : null}

            {whRows.map((row) => {
              const r = whEdit[row.id] || row;
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <Select
                      value={String(r.dow)}
                      onValueChange={(v) =>
                        setWhEdit((p) => ({
                          ...p,
                          [row.id]: { ...r, dow: Number(v) },
                        }))
                      }
                      disabled={busy}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOWS.map((d) => (
                          <SelectItem key={d.value} value={String(d.value)}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell>
                    <Input
                      type="time"
                      value={r.start_time}
                      disabled={busy}
                      onChange={(e) =>
                        setWhEdit((p) => ({
                          ...p,
                          [row.id]: { ...r, start_time: e.target.value },
                        }))
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <Input
                      type="time"
                      value={r.end_time}
                      disabled={busy}
                      onChange={(e) =>
                        setWhEdit((p) => ({
                          ...p,
                          [row.id]: { ...r, end_time: e.target.value },
                        }))
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <Input
                      type="number"
                      value={r.slot_minutes}
                      min={1}
                      max={24 * 60}
                      disabled={busy}
                      onChange={(e) =>
                        setWhEdit((p) => ({
                          ...p,
                          [row.id]: { ...r, slot_minutes: Number(e.target.value) },
                        }))
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <Input
                      type="number"
                      value={r.break_minutes}
                      min={0}
                      max={24 * 60}
                      disabled={busy}
                      onChange={(e) =>
                        setWhEdit((p) => ({
                          ...p,
                          [row.id]: { ...r, break_minutes: Number(e.target.value) },
                        }))
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <Input
                      type="number"
                      value={r.capacity}
                      min={0}
                      max={999}
                      disabled={busy}
                      onChange={(e) =>
                        setWhEdit((p) => ({
                          ...p,
                          [row.id]: { ...r, capacity: Number(e.target.value) },
                        }))
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <Switch
                      checked={!!r.is_active}
                      disabled={busy}
                      onCheckedChange={(v) =>
                        setWhEdit((p) => ({
                          ...p,
                          [row.id]: { ...r, is_active: v },
                        }))
                      }
                    />
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy || !onEditDay}
                        onClick={() => handleEditDay(r)}
                        title={t('availability.weekly.actions.editDayHint')}
                      >
                        {t('availability.weekly.actions.edit')}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => void handleUpdate(r)}
                      >
                        {t('availability.weekly.actions.save')}
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={busy}
                        onClick={() => void handleDelete(r)}
                      >
                        {t('availability.weekly.actions.delete')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Separator className="my-4" />

      <div className="text-sm font-semibold mb-2">{t('availability.weekly.addTitle')}</div>

      <div className="grid gap-3 md:grid-cols-8">
        <div className="space-y-2 md:col-span-2">
          <Label>{t('availability.weekly.columns.day')}</Label>
          <Select
            value={String(newWh.dow)}
            onValueChange={(v) => setNewWh((p) => ({ ...p, dow: Number(v) }) as any)}
            disabled={busy}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOWS.map((d) => (
                <SelectItem key={d.value} value={String(d.value)}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label>{t('availability.weekly.columns.start')}</Label>
          <Input
            type="time"
            value={String(newWh.start_time)}
            onChange={(e) => setNewWh((p) => ({ ...p, start_time: e.target.value }) as any)}
            disabled={busy}
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label>{t('availability.weekly.columns.end')}</Label>
          <Input
            type="time"
            value={String(newWh.end_time)}
            onChange={(e) => setNewWh((p) => ({ ...p, end_time: e.target.value }) as any)}
            disabled={busy}
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label>{t('availability.weekly.columns.session')}</Label>
          <Input
            type="number"
            value={Number(newWh.slot_minutes ?? 60)}
            min={1}
            max={24 * 60}
            onChange={(e) =>
              setNewWh((p) => ({ ...p, slot_minutes: Number(e.target.value) }) as any)
            }
            disabled={busy}
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label>{t('availability.weekly.columns.break')}</Label>
          <Input
            type="number"
            value={Number(newWh.break_minutes ?? 0)}
            min={0}
            max={24 * 60}
            onChange={(e) =>
              setNewWh((p) => ({ ...p, break_minutes: Number(e.target.value) }) as any)
            }
            disabled={busy}
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label>{t('availability.weekly.columns.capacity')}</Label>
          <Input
            type="number"
            value={Number(newWh.capacity ?? 1)}
            min={1}
            max={999}
            onChange={(e) => setNewWh((p) => ({ ...p, capacity: Number(e.target.value) }) as any)}
            disabled={busy}
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <Label>{t('availability.weekly.columns.active')}</Label>
          <div className="flex items-center gap-2">
            <Switch
              checked={toActiveBool(newWh.is_active)}
              onCheckedChange={(v) => setNewWh((p) => ({ ...p, is_active: v }) as any)}
              disabled={busy}
            />
          </div>
        </div>

        <div className="md:col-span-1 flex items-end justify-end">
          <Button type="button" variant="outline" size="sm" onClick={handleAdd} disabled={busy}>
            {t('availability.weekly.actions.add')}
          </Button>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="space-y-3">
        <div>
          <div className="text-sm font-semibold">{t('availability.recurring.title')}</div>
          <div className="text-xs text-muted-foreground">
            {t('availability.recurring.description')}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {DOWS.map((day) => {
            const existing = recurringByDow.get(day.value);
            const value = existing ? (existing.is_active ? 'open' : 'closed') : 'default';

            return (
              <div key={day.value} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{day.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {value === 'default'
                        ? t('availability.recurring.modes.defaultDesc')
                        : value === 'closed'
                          ? t('availability.recurring.modes.closedDesc')
                          : t('availability.recurring.modes.openDesc')}
                    </div>
                  </div>

                  <Select
                    value={value}
                    onValueChange={(next) =>
                      void handleRecurringChange(day.value, next as 'default' | 'open' | 'closed')
                    }
                    disabled={busy}
                  >
                    <SelectTrigger className="w-[170px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">{t('availability.recurring.modes.default')}</SelectItem>
                      <SelectItem value="open">{t('availability.recurring.modes.open')}</SelectItem>
                      <SelectItem value="closed">{t('availability.recurring.modes.closed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
