'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { 
  Save, 
  X, 
  Check, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Activity, 
  Calendar, 
  Clock, 
  MessageSquare, 
  FileText, 
  ChevronLeft,
  Search,
  AlertCircle
} from 'lucide-react';

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
import { Separator } from '@/components/ui/separator';
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
import { Skeleton } from '@/components/ui/skeleton';

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

const normLocale = (v: unknown, fallback = 'tr') => {
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
      locale: 'tr',
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
    locale: normLocale((dto as any).locale, 'tr'),
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
      return { ...prev, locale: localeShortClientOr(defaultLocaleFromDb, 'tr') };
    });
  }, [defaultLocaleFromDb]);

  const { data: resourcesData, isLoading: resLoading, isFetching: resFetching } = useListResourcesAdminQuery({
    limit: 500,
    offset: 0,
    sort: 'title',
    order: 'asc',
    is_active: 1,
  } as any);

  const resources: ResourceAdminListItemDto[] = React.useMemo(
    () => ((resourcesData as any) ?? []) as ResourceAdminListItemDto[],
    [resourcesData],
  );

  const { data: servicesData, isLoading: servicesLoading } = useListServicesAdminQuery({
    limit: 100,
    offset: 0,
    order: 'asc',
    sort: 'display_order',
  } as any);

  const primaryServiceId = React.useMemo(() => {
    const items = Array.isArray((servicesData as any)?.items) ? (servicesData as any).items : [];
    return norm(items[0]?.id);
  }, [servicesData]);

  React.useEffect(() => {
    if (!primaryServiceId) return;
    setValues((prev) => {
      if (norm(prev.service_id)) return prev;
      return { ...prev, service_id: primaryServiceId };
    });
  }, [primaryServiceId]);

  const planArgs = React.useMemo(() => {
    const rid = norm(values.resource_id);
    const d = norm(values.appointment_date);
    if (!rid || !isValidYmd(d)) return null;
    return { resource_id: rid, date: d };
  }, [values.resource_id, values.appointment_date]);

  const { data: planData, isLoading: planLoading, isFetching: planFetching, refetch: refetchPlan } = useGetDailyPlanAdminQuery(
    planArgs as any,
    { skip: !planArgs } as any,
  );

  const planned: PlannedSlotDto[] = React.useMemo(() => ((planData as any) ?? []) as PlannedSlotDto[], [planData]);

  const availArgs = React.useMemo(() => {
    const rid = norm(values.resource_id);
    const d = norm(values.appointment_date);
    const tm = norm(values.appointment_time);
    if (!rid || !isValidYmd(d) || !isValidHm(tm)) return null;
    return { resource_id: rid, date: d, time: tm };
  }, [values.resource_id, values.appointment_date, values.appointment_time]);

  const { data: availData, isLoading: availLoading } = useGetSlotAvailabilityAdminQuery(availArgs as any, { skip: !availArgs } as any);

  const availabilityBadge = React.useMemo(() => {
    if (!availArgs || availLoading) return null;
    const dto: any = availData as any;
    if (!dto) return null;
    const available = !!dto.available;
    return (
      <Badge variant="outline" className={cn(
        "rounded-full px-4 py-1 text-[10px] font-bold tracking-widest uppercase border",
        available ? "bg-gm-success/10 text-gm-success border-gm-success/20" : "bg-gm-error/10 text-gm-error border-gm-error/20"
      )}>
        {available ? t('labels.available') : t('labels.full')} ({dto.reserved_count ?? 0}/{dto.capacity ?? '-'})
      </Badge>
    );
  }, [availArgs, availLoading, availData, t]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) return;
    onSubmit(values);
  };

  const handleAccept = async () => {
    if (mode !== 'edit' || !hasId || isDecided) return;
    try {
      await acceptBooking({ id: bookingId, body: { decision_note: norm(values.decision_note) || undefined } }).unwrap();
      toast.success(t('messages.accepted'));
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || t('messages.genericError'));
    }
  };

  const handleReject = async () => {
    if (mode !== 'edit' || !hasId || isDecided) return;
    if (!window.confirm(t('confirm.reject', null, 'Reddetmek istediğinize emin misiniz?'))) return;
    try {
      await rejectBooking({ id: bookingId, body: { decision_note: norm(values.decision_note) || undefined } }).unwrap();
      toast.success(t('messages.rejected'));
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || t('messages.genericError'));
    }
  };

  const statusOptions = [
    { value: 'pending_payment', label: t('status.pending_payment') },
    { value: 'booked', label: t('status.booked') },
    { value: 'new', label: t('status.new') },
    { value: 'confirmed', label: t('status.confirmed') },
    { value: 'rejected', label: t('status.rejected') },
    { value: 'completed', label: t('status.completed') },
    { value: 'cancelled', label: t('status.cancelled') },
    { value: 'no_show', label: t('status.no_show') },
    { value: 'expired', label: t('status.expired') },
  ];

  const availableSlots = planned.filter(p => !!(p as any).is_active);

  return (
    <form onSubmit={handleSubmit} className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {onCancel && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCancel} 
                disabled={actionBusy}
                className="rounded-full -ml-3 hover:bg-gm-surface group transition-all"
              >
                <ChevronLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
              </Button>
            )}
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">
              {mode === 'create' ? t('form.titles.create') : t('form.titles.edit')}
            </span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">
            {mode === 'edit' ? initialData?.name || t('unknownUser') : t('form.titles.create')}
          </h1>
          <p className="text-gm-muted text-sm font-serif italic opacity-70">
            {t('form.description')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {mode === 'edit' && !isDecided && (
            <>
              <Button
                type="button"
                onClick={handleAccept}
                disabled={actionBusy || !canAccept}
                className="rounded-full bg-gm-success/10 text-gm-success border border-gm-success/20 hover:bg-gm-success hover:text-white px-8 h-12 font-bold tracking-widest uppercase text-[10px] transition-all"
              >
                <Check className="mr-2 size-4" />
                {t('actions.accept')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReject}
                disabled={actionBusy || !canReject}
                className="rounded-full border-gm-error/20 text-gm-error hover:bg-gm-error hover:text-white px-8 h-12 font-bold tracking-widest uppercase text-[10px] transition-all"
              >
                <X className="mr-2 size-4" />
                {t('actions.reject')}
              </Button>
            </>
          )}
          <Button 
            type="submit" 
            disabled={actionBusy} 
            className="rounded-full bg-gm-gold text-gm-bg hover:bg-gm-gold-dim px-10 h-12 font-bold tracking-widest uppercase text-[10px] shadow-lg shadow-gm-gold/20 transition-all active:scale-95"
          >
            <Save className="mr-2 size-4" />
            {saving ? t('admin.common.saving') : t('admin.common.save')}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Customer & Main Info */}
          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
            <CardHeader className="p-8 pb-4 bg-gm-surface/40 border-b border-gm-border-soft">
              <CardTitle className="font-serif text-2xl flex items-center gap-3">
                <User className="h-5 w-5 text-gm-gold" /> {t('form.sections.customer', null, 'Müşteri Bilgileri')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('form.fields.name')}</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50" />
                    <Input
                      value={values.name}
                      onChange={(e) => setValues(v => ({ ...v, name: e.target.value }))}
                      disabled={actionBusy}
                      className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('form.fields.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50" />
                    <Input
                      type="email"
                      value={values.email}
                      onChange={(e) => setValues(v => ({ ...v, email: e.target.value }))}
                      disabled={actionBusy}
                      className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('form.fields.phone')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50" />
                    <Input
                      value={values.phone}
                      onChange={(e) => setValues(v => ({ ...v, phone: e.target.value }))}
                      disabled={actionBusy}
                      className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('form.fields.locale')}</Label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50 z-10" />
                    <AdminLocaleSelect
                      value={values.locale}
                      onChange={(v) => setValues(p => ({ ...p, locale: v }))}
                      options={safeLocaleOptions}
                      loading={localesLoading}
                      disabled={actionBusy}
                      className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-gm-border-soft" />

              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('form.fields.customerMessage')}</Label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 size-4 text-gm-muted/50" />
                  <Textarea
                    value={values.customer_message}
                    onChange={(e) => setValues(v => ({ ...v, customer_message: e.target.value }))}
                    disabled={actionBusy}
                    rows={4}
                    className="pl-12 pt-4 bg-gm-surface/40 border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 text-sm font-serif italic"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointment Slot Details */}
          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
            <CardHeader className="p-8 pb-4 bg-gm-surface/40 border-b border-gm-border-soft">
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif text-2xl flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gm-gold" /> {t('form.sections.appointment', null, 'Randevu Detayları')}
                </CardTitle>
                {availabilityBadge}
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('form.fields.resource')}</Label>
                  <Select
                    value={values.resource_id}
                    onValueChange={(v) => setValues(p => ({ ...p, resource_id: v, appointment_time: '' }))}
                    disabled={actionBusy || resLoading}
                  >
                    <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50">
                      <SelectValue placeholder={t('form.placeholders.resource')} />
                    </SelectTrigger>
                    <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl">
                      {resources.map((r) => (
                        <SelectItem key={String(r.id)} value={String(r.id)}>
                          {r.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('form.fields.date')}</Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50" />
                    <Input
                      type="date"
                      value={values.appointment_date}
                      onChange={(e) => setValues(p => ({ ...p, appointment_date: e.target.value, appointment_time: '' }))}
                      disabled={actionBusy}
                      className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3 md:col-span-2">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('form.fields.time')}</Label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                    {planLoading ? (
                      Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl bg-gm-surface/20" />)
                    ) : availableSlots.length === 0 ? (
                      <div className="col-span-full py-4 text-center text-xs text-gm-muted italic bg-gm-surface/10 rounded-2xl border border-dashed border-gm-border-soft">
                        {t('form.help.pickResourceAndDate')}
                      </div>
                    ) : (
                      availableSlots.map((s: any) => {
                        const time = s.time?.slice(0, 5);
                        const isSelected = values.appointment_time === s.time;
                        const isAvailable = !!s.available;
                        return (
                          <button
                            key={s.time}
                            type="button"
                            disabled={actionBusy || !isAvailable}
                            onClick={() => setValues(p => ({ ...p, appointment_time: s.time }))}
                            className={cn(
                              "h-10 rounded-xl text-xs font-mono transition-all border",
                              isSelected 
                                ? "bg-gm-gold text-gm-bg border-gm-gold shadow-lg shadow-gm-gold/20" 
                                : isAvailable 
                                  ? "bg-gm-surface/40 border-gm-border-soft text-gm-text hover:border-gm-gold/50" 
                                  : "bg-gm-surface/10 border-transparent text-gm-muted/30 cursor-not-allowed"
                            )}
                          >
                            {time}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Status & Control */}
          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
            <CardHeader className="p-8 pb-4 bg-gm-surface/40 border-b border-gm-border-soft">
              <CardTitle className="font-serif text-2xl flex items-center gap-3">
                <Activity className="h-5 w-5 text-gm-gold" /> {t('form.sections.status', null, 'Yönetim')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('form.fields.status')}</Label>
                <Select
                  value={values.status}
                  onValueChange={(v) => setValues(p => ({ ...p, status: v }))}
                  disabled={actionBusy}
                >
                  <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl">
                    {statusOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 bg-gm-surface/40 rounded-2xl border border-gm-border-soft">
                <div className="space-y-0.5">
                  <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase">{t('form.fields.isRead')}</Label>
                  <div className="text-[10px] font-serif italic text-gm-muted/60">{values.is_read ? t('read.read') : t('read.unread')}</div>
                </div>
                <Switch
                  checked={values.is_read}
                  onCheckedChange={(v) => setValues(p => ({ ...p, is_read: v }))}
                  disabled={actionBusy}
                  className="data-[state=checked]:bg-gm-gold"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
            <CardHeader className="p-8 pb-4 bg-gm-surface/40 border-b border-gm-border-soft">
              <CardTitle className="font-serif text-2xl flex items-center gap-3">
                <FileText className="h-5 w-5 text-gm-gold" /> {t('form.sections.notes', null, 'Notlar')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('form.fields.adminNote')}</Label>
                <Textarea
                  value={values.admin_note}
                  onChange={(e) => setValues(v => ({ ...v, admin_note: e.target.value }))}
                  disabled={actionBusy}
                  rows={4}
                  className="bg-gm-surface/40 border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 text-sm font-serif italic"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('form.fields.decisionNote')}</Label>
                <Textarea
                  value={values.decision_note}
                  onChange={(e) => setValues(v => ({ ...v, decision_note: e.target.value }))}
                  disabled={actionBusy}
                  rows={4}
                  className="bg-gm-surface/40 border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 text-sm font-serif italic"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
};
