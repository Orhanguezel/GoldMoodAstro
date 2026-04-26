'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/bookings/booking-form.tsx
// Admin Booking Create/Edit Form (+ Accept/Reject actions)
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { localeShortClientOr } from '@/i18n/localeShortClient';

import type {
  BookingMergedDto,
  BookingStatus,
  PlannedSlotDto,
  ResourceAdminListItemDto,
} from '@/integrations/shared';

import {
  useAcceptBookingAdminMutation,
  useGetDailyPlanAdminQuery,
  useGetSlotAvailabilityAdminQuery,
  useListResourcesAdminQuery,
  useListServicesAdminQuery,
  useRejectBookingAdminMutation,
} from '@/integrations/hooks';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AdminLocaleSelect, type AdminLocaleOption } from '@/app/(main)/admin/_components/common/AdminLocaleSelect';
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

export type BookingFormMode = 'create' | 'edit';

export type BookingFormValues = {
  name: string;
  email: string;
  phone: string;
  locale: string;

  customer_message: string;

  resource_id: string;
  service_id: string;

  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:mm

  status: BookingStatus | string;
  is_read: boolean;

  admin_note: string;
  decision_note: string;
};

export type BookingFormProps = {
  mode: BookingFormMode;
  initialData?: BookingMergedDto | null;
  loading: boolean;
  saving: boolean;
  onSubmit: (values: BookingFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

const norm = (v: unknown) => String(v ?? '').trim();

const normLocale = (v: unknown, fallback = 'de') => {
  const raw = String(v ?? '')
    .trim()
    .toLowerCase()
    .replace('_', '-');
  const short = raw.split('-')[0] || '';
  return short || fallback;
};

const isValidYmd = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
const isValidHm = (v: string) => /^\d{2}:\d{2}$/.test(v);

const toBool01 = (v: any) => Number(v ?? 0) === 1 || v === true;

const buildInitial = (dto?: BookingMergedDto | null): BookingFormValues => {
  if (!dto) {
    return {
      name: '',
      email: '',
      phone: '',
      locale: 'de',

      customer_message: '',

      resource_id: '',
      service_id: '',

      appointment_date: '',
      appointment_time: '',

      status: 'new',
      is_read: false,

      admin_note: '',
      decision_note: '',
    };
  }

  return {
    name: norm(dto.name),
    email: norm(dto.email),
    phone: norm(dto.phone),
    locale: normLocale((dto as any).locale, 'de'),

    customer_message: norm(dto.customer_message ?? ''),

    resource_id: norm(dto.resource_id),
    service_id: norm(dto.service_id ?? ''),

    appointment_date: norm(dto.appointment_date),
    appointment_time: norm(dto.appointment_time ?? ''),

    status: norm(dto.status) || 'new',
    is_read: toBool01((dto as any).is_read),

    admin_note: norm(dto.admin_note ?? ''),
    decision_note: norm(dto.decision_note ?? ''),
  };
};

const slotRowClass = (p: PlannedSlotDto) => {
  const active = Number((p as any).is_active ?? 0) === 1;
  const available = !!(p as any).available;
  if (!active) return 'text-muted-foreground';
  if (!available) return 'text-muted-foreground';
  return '';
};

export const BookingForm: React.FC<BookingFormProps> = ({
  mode,
  initialData,
  loading,
  saving,
  onSubmit,
  onCancel,
}) => {
  const t = useAdminT('admin.bookings');

  const [values, setValues] = React.useState<BookingFormValues>(buildInitial(initialData));

  React.useEffect(() => {
    setValues(buildInitial(initialData));
  }, [initialData]);

  const disabled = loading || saving;

  const bookingId = norm((initialData as any)?.id);
  const hasId = bookingId.length === 36;
  const decidedAtRaw = (initialData as any)?.decided_at;
  const isDecided = !!decidedAtRaw;
  const currentStatus = norm((initialData as any)?.status);
  const canAccept = ['new', 'booked', 'pending_payment'].includes(currentStatus);
  const canReject = ['new', 'booked', 'pending_payment', 'confirmed'].includes(currentStatus);

  const [acceptBooking, acceptState] = useAcceptBookingAdminMutation();
  const [rejectBooking, rejectState] = useRejectBookingAdminMutation();

  const actionBusy = disabled || acceptState.isLoading || rejectState.isLoading;

  const { localeOptions, defaultLocaleFromDb, loading: localesLoading, fetching: localesFetching } = useAdminLocales();
  const safeLocaleOptions: AdminLocaleOption[] = React.useMemo(() => {
    if (!Array.isArray(localeOptions)) return [];
    return localeOptions.map((opt) => ({
      value: opt.value || '',
      label: opt.label || opt.value || '',
    }));
  }, [localeOptions]);

  React.useEffect(() => {
    setValues((prev) => {
      if (norm(prev.locale)) return prev;
      return { ...prev, locale: localeShortClientOr(defaultLocaleFromDb, 'de') };
    });
  }, [defaultLocaleFromDb]);

  // Resources dropdown
  const {
    data: resourcesData,
    isLoading: resLoading,
    isFetching: resFetching,
  } = useListResourcesAdminQuery(
    {
      limit: 500,
      offset: 0,
      sort: 'title',
      order: 'asc',
      is_active: 1,
    } as any,
    { refetchOnMountOrArgChange: true } as any,
  );

  const resources: ResourceAdminListItemDto[] = React.useMemo(
    () => ((resourcesData as any) ?? []) as ResourceAdminListItemDto[],
    [resourcesData],
  );

  const {
    data: servicesData,
    isLoading: servicesLoading,
    isFetching: servicesFetching,
  } = useListServicesAdminQuery(
    {
      limit: 1,
      offset: 0,
      order: 'asc',
      sort: 'display_order',
    } as any,
    { refetchOnMountOrArgChange: true } as any,
  );

  const primaryService = React.useMemo(() => {
    const items = Array.isArray((servicesData as any)?.items) ? (servicesData as any).items : [];
    return (items[0] as any) ?? null;
  }, [servicesData]);

  const primaryServiceId = norm(primaryService?.id);
  const primaryServiceLabel =
    norm(primaryService?.name) || norm(primaryService?.title) || primaryServiceId;

  React.useEffect(() => {
    if (!primaryServiceId) return;
    setValues((prev) => {
      if (norm(prev.service_id)) return prev;
      return { ...prev, service_id: primaryServiceId };
    });
  }, [primaryServiceId]);

  // Plan query
  const planArgs = React.useMemo(() => {
    const rid = norm(values.resource_id);
    const d = norm(values.appointment_date);
    if (!rid || !isValidYmd(d)) return null;
    return { resource_id: rid, date: d };
  }, [values.resource_id, values.appointment_date]);

  const {
    data: planData,
    isLoading: planLoading,
    isFetching: planFetching,
    refetch: refetchPlan,
  } = useGetDailyPlanAdminQuery(
    planArgs as any,
    {
      skip: !planArgs,
      refetchOnMountOrArgChange: true,
    } as any,
  );

  const planned: PlannedSlotDto[] = React.useMemo(
    () => ((planData as any) ?? []) as PlannedSlotDto[],
    [planData],
  );

  // Availability check for selected time
  const availArgs = React.useMemo(() => {
    const rid = norm(values.resource_id);
    const d = norm(values.appointment_date);
    const tm = norm(values.appointment_time);
    if (!rid || !isValidYmd(d) || !isValidHm(tm)) return null;
    return { resource_id: rid, date: d, time: tm };
  }, [values.resource_id, values.appointment_date, values.appointment_time]);

  const { data: availData, isLoading: availLoading } = useGetSlotAvailabilityAdminQuery(
    availArgs as any,
    { skip: !availArgs } as any,
  );

  const availabilityText = React.useMemo(() => {
    if (!availArgs) return '';
    if (availLoading) return t('form.availability.checking');
    const dto: any = availData as any;
    if (!dto) return '';
    if (dto.exists === false) return t('form.availability.noSlot');
    if (dto.available)
      return t('form.availability.available', {
        reserved: Number(dto.reserved_count ?? 0),
        cap: dto.capacity ?? '-',
      });
    return t('form.availability.unavailable', {
      reserved: Number(dto.reserved_count ?? 0),
      cap: dto.capacity ?? '-',
    });
  }, [availArgs, availLoading, availData, t]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) return;

    const payload: BookingFormValues = {
      ...values,
      name: norm(values.name),
      email: norm(values.email),
      phone: norm(values.phone),
      locale: normLocale(values.locale, 'de'),
      customer_message: norm(values.customer_message),
      resource_id: norm(values.resource_id),
      service_id: norm(values.service_id || primaryServiceId),
      appointment_date: norm(values.appointment_date),
      appointment_time: norm(values.appointment_time),
      admin_note: norm(values.admin_note),
      decision_note: norm(values.decision_note),
    };

    if (!payload.name || !payload.email || !payload.phone) {
      toast.error(t('form.validation.requiredCustomerFields'));
      return;
    }
    if (!payload.resource_id) {
      toast.error(t('form.validation.resourceRequired'));
      return;
    }
    if (!isValidYmd(payload.appointment_date)) {
      toast.error(t('form.validation.invalidDate'));
      return;
    }
    if (!isValidHm(payload.appointment_time)) {
      toast.error(t('form.validation.invalidTime'));
      return;
    }

    void onSubmit(payload);
  };

  const handleAccept = async () => {
    if (mode !== 'edit' || !hasId) return;
    if (isDecided) return;

    try {
      await acceptBooking({
        id: bookingId,
        body: { decision_note: norm(values.decision_note) || undefined },
      }).unwrap();
      toast.success(t('messages.accepted'));
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || t('messages.genericError'));
    }
  };

  const handleReject = async () => {
    if (mode !== 'edit' || !hasId) return;
    if (isDecided) return;

    const ok = window.confirm(t('confirm.reject'));
    if (!ok) return;

    try {
      await rejectBooking({
        id: bookingId,
        body: { decision_note: norm(values.decision_note) || undefined },
      }).unwrap();
      toast.success(t('messages.rejected'));
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || t('messages.genericError'));
    }
  };

  const planBusy = planLoading || planFetching;
  const resBusy = resLoading || resFetching;
  const servicesBusy = servicesLoading || servicesFetching;

  const availableSlots = React.useMemo(() => {
    return planned
      .filter((p) => !!(p as any).is_active)
      .map((p) => ({
        time: String((p as any).time || ''),
        available: !!(p as any).available,
        reserved: Number((p as any).reserved_count ?? 0),
        cap: Number((p as any).capacity ?? 0),
        raw: p,
      }));
  }, [planned]);

  const showDecisionActions = mode === 'edit' && hasId;

  const statusOptions: Array<{ value: string; label: string }> = React.useMemo(
    () => [
      { value: 'pending_payment', label: t('status.pending_payment') },
      { value: 'booked', label: t('status.booked') },
      { value: 'new', label: t('status.new') },
      { value: 'confirmed', label: t('status.confirmed') },
      { value: 'rejected', label: t('status.rejected') },
      { value: 'completed', label: t('status.completed') },
      { value: 'cancelled', label: t('status.cancelled') },
      { value: 'no_show', label: t('status.no_show') },
      { value: 'expired', label: t('status.expired') },
    ],
    [t],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-base">
                {mode === 'create' ? t('form.titles.create') : t('form.titles.edit')}
              </CardTitle>
              <CardDescription>{t('form.description')}</CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onCancel ? (
                <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={actionBusy}>
                  {t('admin.common.back')}
                </Button>
              ) : null}

              {showDecisionActions ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleAccept()}
                    disabled={actionBusy || isDecided || !canAccept}
                    title={isDecided ? t('tooltips.decisionAlreadyMade') : !canAccept ? t('tooltips.acceptDisabled') : undefined}
                  >
                    {acceptState.isLoading ? t('actions.accepting') : t('actions.accept')}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => void handleReject()}
                    disabled={actionBusy || isDecided || !canReject}
                    title={isDecided ? t('tooltips.decisionAlreadyMade') : !canReject ? t('tooltips.rejectDisabled') : undefined}
                  >
                    {rejectState.isLoading ? t('actions.rejecting') : t('actions.reject')}
                  </Button>
                </>
              ) : null}

              <Button type="submit" size="sm" disabled={actionBusy}>
                {saving
                  ? t('admin.common.saving')
                  : mode === 'create'
                    ? t('admin.common.create')
                    : t('admin.common.save')}
              </Button>

              {loading ? <Badge variant="secondary">{t('states.loadingInline')}</Badge> : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-12 grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{t('form.fields.name')}</Label>
              <Input
                value={values.name}
                onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))}
                disabled={actionBusy}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.fields.email')}</Label>
              <Input
                type="email"
                value={values.email}
                onChange={(e) => setValues((p) => ({ ...p, email: e.target.value }))}
                disabled={actionBusy}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.fields.phone')}</Label>
              <Input
                value={values.phone}
                onChange={(e) => setValues((p) => ({ ...p, phone: e.target.value }))}
                disabled={actionBusy}
              />
            </div>
          </div>

          <div className="lg:col-span-12 grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <AdminLocaleSelect
                value={values.locale}
                onChange={(v) => setValues((p) => ({ ...p, locale: v }))}
                options={safeLocaleOptions}
                loading={localesLoading || localesFetching}
                disabled={actionBusy}
                label={t('form.fields.locale')}
              />
              <div className="text-xs text-muted-foreground">{t('form.help.locale')}</div>
            </div>

            <div className="space-y-2">
              <Label>{t('form.fields.status')}</Label>
              <Select
                value={String(values.status || '')}
                onValueChange={(v) => setValues((p) => ({ ...p, status: v }))}
                disabled={actionBusy}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">{t('form.help.status')}</div>
            </div>

            <div className="space-y-2">
              <Label>{t('form.fields.isRead')}</Label>
              <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2">
                <Switch
                  checked={values.is_read}
                  onCheckedChange={(v) => setValues((p) => ({ ...p, is_read: v }))}
                  disabled={actionBusy}
                />
                <span className="text-sm">
                  {values.is_read ? t('read.read') : t('read.unread')}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-12 grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{t('form.fields.serviceId')}</Label>
              <Input
                value={primaryServiceLabel || values.service_id}
                readOnly
                placeholder={t('form.placeholders.serviceId')}
                disabled={actionBusy || servicesBusy}
              />
              <div className="text-xs text-muted-foreground">
                {primaryServiceId
                  ? primaryServiceId
                  : t('states.loadingInline')}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{t('form.fields.resource')}</Label>
              <Select
                value={values.resource_id || '__none__'}
                onValueChange={(v) =>
                  setValues((p) => ({
                    ...p,
                    resource_id: v === '__none__' ? '' : v,
                    appointment_time: '',
                  }))
                }
                disabled={actionBusy || resBusy}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.placeholders.resource')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('form.placeholders.select')}</SelectItem>
                  {resources.map((r) => (
                    <SelectItem key={String(r.id)} value={String(r.id)}>
                      {r.title} ({String((r as any).type)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {resBusy ? <div className="text-xs text-muted-foreground">{t('states.resourcesLoading')}</div> : null}
            </div>
          </div>

          <div className="lg:col-span-12 grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{t('form.fields.date')}</Label>
              <Input
                type="date"
                value={values.appointment_date}
                onChange={(e) =>
                  setValues((p) => ({
                    ...p,
                    appointment_date: e.target.value,
                    appointment_time: '',
                  }))
                }
                disabled={actionBusy}
              />
              <div className="text-xs text-muted-foreground">{t('form.help.date')}</div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <Label>{t('form.fields.time')}</Label>
                {planArgs ? (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto px-0"
                    onClick={() => void refetchPlan()}
                    disabled={actionBusy || planBusy}
                  >
                    {t('admin.common.refresh')}
                  </Button>
                ) : null}
              </div>

              <Select
                value={values.appointment_time || '__none__'}
                onValueChange={(v) => setValues((p) => ({ ...p, appointment_time: v === '__none__' ? '' : v }))}
                disabled={actionBusy || !planArgs || planBusy}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.placeholders.time')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('form.placeholders.select')}</SelectItem>
                  {availableSlots.map((x) => (
                    <SelectItem key={x.time} value={x.time} disabled={!x.available}>
                      {x.time} {!x.available ? ` (${t('labels.full')})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {!planArgs
                    ? t('form.help.pickResourceAndDate')
                    : planBusy
                      ? t('form.help.slotsLoading')
                      : t('form.help.slotCount', { count: availableSlots.length })}
                </span>

                {planBusy ? <Badge variant="secondary">{t('states.loadingInline')}</Badge> : null}
              </div>

              {availabilityText ? <div className="text-xs text-muted-foreground">{availabilityText}</div> : null}
            </div>
          </div>

          <div className="lg:col-span-12 space-y-2">
            <Label>{t('form.fields.customerMessage')}</Label>
            <Textarea
              value={values.customer_message}
              onChange={(e) => setValues((p) => ({ ...p, customer_message: e.target.value }))}
              rows={3}
              disabled={actionBusy}
              placeholder={t('form.placeholders.optional')}
            />
          </div>

          <div className="lg:col-span-6 space-y-2">
            <Label>{t('form.fields.adminNote')}</Label>
            <Textarea
              value={values.admin_note}
              onChange={(e) => setValues((p) => ({ ...p, admin_note: e.target.value }))}
              rows={3}
              disabled={actionBusy}
              placeholder={t('form.placeholders.optional')}
            />
          </div>

          <div className="lg:col-span-6 space-y-2">
            <Label>{t('form.fields.decisionNote')}</Label>
            <Textarea
              value={values.decision_note}
              onChange={(e) => setValues((p) => ({ ...p, decision_note: e.target.value }))}
              rows={3}
              disabled={actionBusy}
              placeholder={t('form.placeholders.decisionNote')}
            />
          </div>

          {planArgs ? (
            <div className="lg:col-span-12">
              <Card>
                <CardHeader className="gap-1">
                  <CardTitle className="text-base">{t('plan.title')}</CardTitle>
                  <CardDescription>{t('plan.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('plan.columns.time')}</TableHead>
                        <TableHead>{t('plan.columns.status')}</TableHead>
                        <TableHead className="text-right">{t('plan.columns.capacity')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {planned.map((p) => {
                        const time = String((p as any).time || '');
                        const active = Number((p as any).is_active ?? 0) === 1;
                        const available = !!(p as any).available;
                        const reserved = Number((p as any).reserved_count ?? 0);
                        const cap = Number((p as any).capacity ?? 0);
                        const selected = values.appointment_time === time;

                        return (
                          <TableRow
                            key={time}
                            className={cn(
                              slotRowClass(p),
                              selected ? 'bg-primary/10' : '',
                              active && available ? 'cursor-pointer' : '',
                            )}
                            role={active && available ? 'button' : undefined}
                            tabIndex={active && available ? 0 : -1}
                            onClick={() => {
                              if (!active || !available) return;
                              setValues((x) => ({ ...x, appointment_time: time }));
                            }}
                            onKeyDown={(e) => {
                              if (!active || !available) return;
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setValues((x) => ({ ...x, appointment_time: time }));
                              }
                            }}
                          >
                            <TableCell className="text-nowrap">
                              <code>{time}</code>
                              {selected ? (
                                <Badge className="ml-2" variant="secondary">
                                  {t('labels.selected')}
                                </Badge>
                              ) : null}
                            </TableCell>
                            <TableCell className="text-sm text-nowrap">
                              {active ? (available ? t('labels.available') : t('labels.full')) : t('labels.inactive')}
                            </TableCell>
                            <TableCell className="text-right text-sm text-nowrap">
                              {reserved}/{cap}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </form>
  );
};
