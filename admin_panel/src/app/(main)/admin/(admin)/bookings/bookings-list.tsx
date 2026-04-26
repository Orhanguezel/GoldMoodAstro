'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/bookings/bookings-list.tsx
// Admin Bookings List (table + cards + decision modal)
// =============================================================

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { CalendarDays, Check, Eye, Mail, Pencil, Trash2, X } from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { cn } from '@/lib/utils';

import type { BookingMergedDto } from '@/integrations/shared';
import {
  useAcceptBookingAdminMutation,
  useDeleteBookingAdminMutation,
  useMarkBookingReadAdminMutation,
  useRejectBookingAdminMutation,
  useSendBookingReminderAdminMutation,
} from '@/integrations/hooks';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export type BookingsListProps = {
  items?: BookingMergedDto[];
  loading: boolean;
};

const formatDateTime = (date: string | null | undefined, time: string | null | undefined) => {
  const d = String(date || '').trim();
  const t = String(time || '').trim();
  if (!d && !t) return '-';
  if (d && t) return `${d} ${t}`;
  return d || t;
};

const isReadRow = (b: BookingMergedDto) =>
  Number((b as any).is_read ?? 0) === 1 || (b as any).is_read === true;

const statusKey = (s: unknown) => String(s || '').trim().toLowerCase();

const canAccept = (b: BookingMergedDto) =>
  ['new', 'booked', 'pending_payment'].includes(statusKey(b.status));
const canReject = (b: BookingMergedDto) => {
  const s = statusKey(b.status);
  return ['new', 'booked', 'pending_payment', 'confirmed'].includes(s);
};

type DecisionMode = 'accept' | 'reject';

export const BookingsList: React.FC<BookingsListProps> = ({ items, loading }) => {
  const t = useAdminT('admin.bookings');

  const rows = items ?? [];
  const hasData = rows.length > 0;

  const [deleteBooking, deleteState] = useDeleteBookingAdminMutation();
  const [markRead, markReadState] = useMarkBookingReadAdminMutation();
  const [acceptBooking, acceptState] = useAcceptBookingAdminMutation();
  const [rejectBooking, rejectState] = useRejectBookingAdminMutation();
  const [sendReminder, reminderState] = useSendBookingReminderAdminMutation();

  const busy =
    loading ||
    deleteState.isLoading ||
    markReadState.isLoading ||
    acceptState.isLoading ||
    rejectState.isLoading ||
    reminderState.isLoading;

  const [view, setView] = React.useState<'table' | 'cards' | 'calendar'>('table');

  const [decisionOpen, setDecisionOpen] = React.useState(false);
  const [decisionMode, setDecisionMode] = React.useState<DecisionMode>('accept');
  const [decisionItem, setDecisionItem] = React.useState<BookingMergedDto | null>(null);
  const [decisionNote, setDecisionNote] = React.useState('');

  const openDecision = (mode: DecisionMode, b: BookingMergedDto) => {
    setDecisionMode(mode);
    setDecisionItem(b);
    setDecisionNote(String((b as any)?.decision_note ?? '').trim());
    setDecisionOpen(true);
  };

  const closeDecision = () => {
    if (busy) return;
    setDecisionOpen(false);
    setDecisionItem(null);
    setDecisionNote('');
  };

  const getStatusLabel = React.useCallback(
    (s: unknown) => {
      const k = statusKey(s);
      if (!k) return '-';
      return t(`status.${k}`, undefined, k);
    },
    [t],
  );

  const statusBadge = React.useCallback(
    (s: unknown) => {
      const k = statusKey(s);
      const base = 'border px-2 py-0.5 text-xs';

      const cls =
        k === 'new' || k === 'pending_payment'
          ? 'border-primary/20 bg-primary/10 text-primary'
          : k === 'booked' || k === 'confirmed'
            ? 'border-accent/40 bg-accent text-accent-foreground'
            : k === 'completed'
              ? 'border-secondary/40 bg-secondary text-secondary-foreground'
              : k === 'rejected' || k === 'cancelled' || k === 'no_show'
                ? 'border-destructive/20 bg-destructive/10 text-destructive'
                : k === 'expired'
                  ? 'border-muted-foreground/20 bg-muted text-muted-foreground'
                  : 'border-muted-foreground/20 bg-background text-foreground';

      return (
        <Badge variant="outline" className={cn(base, cls)}>
          {getStatusLabel(s)}
        </Badge>
      );
    },
    [getStatusLabel],
  );

  const handleDelete = async (b: BookingMergedDto) => {
    const ok = window.confirm(
      t('confirm.delete', {
        name: b.name || '-',
        dateTime: formatDateTime(b.appointment_date, b.appointment_time),
      }),
    );
    if (!ok) return;

    try {
      await deleteBooking(String(b.id)).unwrap();
      toast.success(t('messages.deleted'));
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || t('messages.deleteError'));
    }
  };

  const handleMarkRead = async (b: BookingMergedDto) => {
    try {
      await markRead(String(b.id)).unwrap();
      toast.success(t('messages.markedRead'));
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || t('messages.genericError'));
    }
  };

  const handleDecisionSubmit = async () => {
    const b = decisionItem;
    if (!b) return;

    const note = String(decisionNote || '').trim();

    try {
      if (decisionMode === 'accept') {
        await acceptBooking({
          id: String(b.id),
          body: note ? { decision_note: note } : {},
        } as any).unwrap();
        toast.success(t('messages.accepted'));
      } else {
        await rejectBooking({
          id: String(b.id),
          body: note ? { decision_note: note } : {},
        } as any).unwrap();
        toast.success(t('messages.rejected'));
      }

      closeDecision();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || t('messages.genericError'));
    }
  };

  const handleReminder = async (b: BookingMergedDto) => {
    try {
      await sendReminder({
        id: String(b.id),
        body: {
          locale: String(b.locale || 'de'),
        },
      }).unwrap();
      toast.success(t('messages.reminderSent'));
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || t('messages.genericError'));
    }
  };

  const renderEmpty = () => {
    if (loading) return <div className="p-6 text-sm text-muted-foreground">{t('states.loading')}</div>;
    return <div className="p-6 text-sm text-muted-foreground">{t('states.empty')}</div>;
  };

  const DecisionDialog = () => {
    const b = decisionItem;
    const isAccept = decisionMode === 'accept';
    const title = isAccept ? t('decision.titleAccept') : t('decision.titleReject');
    const actionLabel = isAccept ? t('decision.actionAccept') : t('decision.actionReject');

    return (
      <Dialog open={decisionOpen} onOpenChange={(v) => (v ? null : closeDecision())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {b ? (
                <span>
                  <span className="font-medium">{b.name || '-'}</span>
                  <span className="mx-2">•</span>
                  <span>{formatDateTime(b.appointment_date, b.appointment_time)}</span>
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="text-sm font-medium">{t('decision.noteLabel')}</div>
            <Textarea
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              rows={4}
              disabled={busy}
              placeholder={t('decision.notePlaceholder')}
            />
            <div className="text-xs text-muted-foreground">{t('decision.noteHelp')}</div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDecision} disabled={busy}>
              {t('admin.common.cancel')}
            </Button>
            <Button
              variant={isAccept ? 'default' : 'destructive'}
              onClick={() => void handleDecisionSubmit()}
              disabled={busy}
            >
              {busy ? t('decision.processing') : actionLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderTable = () => {
    if (!hasData) return renderEmpty();

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('list.columns.status')}</TableHead>
              <TableHead>{t('list.columns.customer')}</TableHead>
              <TableHead>{t('list.columns.date')}</TableHead>
              <TableHead>{t('list.columns.resource')}</TableHead>
              <TableHead>{t('list.columns.service')}</TableHead>
              <TableHead className="text-right">{t('admin.common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((b) => {
              const isRead = isReadRow(b);
              return (
                <TableRow key={b.id} className={!isRead ? 'bg-muted/40' : ''}>
                  <TableCell className="space-x-2">
                    {statusBadge(b.status)}
                    {!isRead ? <Badge variant="secondary">{t('badges.unread')}</Badge> : null}
                  </TableCell>

                  <TableCell>
                    <div className="font-medium truncate max-w-[260px]">{b.name || '-'}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[260px]">
                      {b.email || ''} {b.phone ? `• ${b.phone}` : ''}
                    </div>
                  </TableCell>

                  <TableCell className="text-sm">
                    {formatDateTime(b.appointment_date, b.appointment_time)}
                  </TableCell>

                  <TableCell className="text-sm truncate max-w-[240px]">
                    {b.resource_title ? b.resource_title : <span className="text-muted-foreground">—</span>}
                  </TableCell>

                  <TableCell className="text-sm truncate max-w-[240px]">
                    {b.service_title ? b.service_title : <span className="text-muted-foreground">—</span>}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 flex-wrap">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => openDecision('accept', b)}
                        disabled={busy || !canAccept(b)}
                        title={!canAccept(b) ? t('tooltips.acceptDisabled') : undefined}
                      >
                        <Check className="mr-2 size-4" />
                        {t('actions.accept')}
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => openDecision('reject', b)}
                        disabled={busy || !canReject(b)}
                        title={!canReject(b) ? t('tooltips.rejectDisabled') : undefined}
                      >
                        <X className="mr-2 size-4" />
                        {t('actions.reject')}
                      </Button>

                      <Button asChild type="button" size="sm" variant="outline">
                        <Link href={`/admin/bookings/${encodeURIComponent(String(b.id))}`}>
                          <Pencil className="mr-2 size-4" />
                          {t('admin.common.edit')}
                        </Link>
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void handleReminder(b)}
                        disabled={busy}
                      >
                        <Mail className="mr-2 size-4" />
                        {t('actions.sendReminder')}
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void handleMarkRead(b)}
                        disabled={busy || isRead}
                        title={isRead ? t('tooltips.alreadyRead') : undefined}
                      >
                        <Eye className="mr-2 size-4" />
                        {t('actions.markRead')}
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => void handleDelete(b)}
                        disabled={busy}
                      >
                        <Trash2 className="mr-2 size-4" />
                        {t('admin.common.delete')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderCards = () => {
    if (!hasData) return renderEmpty();

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((b) => {
          const isRead = isReadRow(b);
          return (
            <Card key={b.id} className={!isRead ? 'bg-muted/30' : undefined}>
              <CardHeader className="gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-sm truncate">{b.name || '-'}</CardTitle>
                    <CardDescription className="truncate">
                      {b.email || '-'} {b.phone ? `• ${b.phone}` : ''}
                    </CardDescription>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {statusBadge(b.status)}
                    {!isRead ? <Badge variant="secondary">{t('badges.unread')}</Badge> : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">{t('labels.dateTime')}:</span>{' '}
                  <span className="font-medium">
                    {formatDateTime(b.appointment_date, b.appointment_time)}
                  </span>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">{t('labels.resource')}:</span>{' '}
                  <span className="font-medium">{b.resource_title || '—'}</span>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">{t('labels.service')}:</span>{' '}
                  <span className="font-medium">{b.service_title || '—'}</span>
                </div>

                {b.customer_message ? (
                  <div className="text-sm">
                    <div className="text-muted-foreground">{t('labels.customerMessage')}:</div>
                    <div className="mt-1 whitespace-pre-wrap break-words rounded-md border bg-background p-2">
                      {String(b.customer_message).slice(0, 220)}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => openDecision('accept', b)}
                    disabled={busy || !canAccept(b)}
                  >
                    <Check className="mr-2 size-4" />
                    {t('actions.accept')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => openDecision('reject', b)}
                    disabled={busy || !canReject(b)}
                  >
                    <X className="mr-2 size-4" />
                    {t('actions.reject')}
                  </Button>
                  <Button asChild type="button" size="sm" variant="outline">
                    <Link href={`/admin/bookings/${encodeURIComponent(String(b.id))}`}>
                      <Pencil className="mr-2 size-4" />
                      {t('admin.common.edit')}
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleReminder(b)}
                    disabled={busy}
                  >
                    <Mail className="mr-2 size-4" />
                    {t('actions.sendReminder')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleMarkRead(b)}
                    disabled={busy || isRead}
                  >
                    <Eye className="mr-2 size-4" />
                    {t('actions.markRead')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => void handleDelete(b)}
                    disabled={busy}
                  >
                    <Trash2 className="mr-2 size-4" />
                    {t('admin.common.delete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderCalendar = () => {
    if (!hasData) return renderEmpty();

    const grouped = rows.reduce<Record<string, BookingMergedDto[]>>((acc, row) => {
      const key = String(row.appointment_date || '').trim() || 'no-date';
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});

    const days = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, items]) => ({
        date,
        items: [...items].sort((l, r) =>
          formatDateTime(l.appointment_date, l.appointment_time).localeCompare(
            formatDateTime(r.appointment_date, r.appointment_time),
          ),
        ),
      }));

    return (
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {days.map((day) => (
          <Card key={day.date} className="border-border/80">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" />
                <CardTitle className="text-sm">{day.date === 'no-date' ? '—' : day.date}</CardTitle>
              </div>
              <CardDescription>
                {t('list.calendar.count', { count: day.items.length })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {day.items.map((b) => {
                const isRead = isReadRow(b);
                return (
                  <div
                    key={String(b.id)}
                    className={cn(
                      'rounded-lg border p-3 space-y-3',
                      !isRead ? 'bg-muted/30' : 'bg-background',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{b.name || '-'}</div>
                        <div className="text-xs text-muted-foreground">
                          {b.appointment_time || '--:--'} {b.resource_title ? `• ${b.resource_title}` : ''}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {statusBadge(b.status)}
                        {!isRead ? <Badge variant="secondary">{t('badges.unread')}</Badge> : null}
                      </div>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t('labels.service')}:</span>{' '}
                        <span className="font-medium">{b.service_title || '—'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('list.calendar.contact')}:</span>{' '}
                        <span className="font-medium">{b.email || b.phone || '—'}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => openDecision('accept', b)}
                        disabled={busy || !canAccept(b)}
                      >
                        <Check className="mr-2 size-4" />
                        {t('actions.accept')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => openDecision('reject', b)}
                        disabled={busy || !canReject(b)}
                      >
                        <X className="mr-2 size-4" />
                        {t('actions.reject')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void handleReminder(b)}
                        disabled={busy}
                      >
                        <Mail className="mr-2 size-4" />
                        {t('actions.sendReminder')}
                      </Button>
                      <Button asChild type="button" size="sm" variant="outline">
                        <Link href={`/admin/bookings/${encodeURIComponent(String(b.id))}`}>
                          <Pencil className="mr-2 size-4" />
                          {t('admin.common.edit')}
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">{t('list.title')}</CardTitle>

            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-md border p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'table' ? 'secondary' : 'ghost'}
                  onClick={() => setView('table')}
                  disabled={busy}
                >
                  {t('list.views.table')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'cards' ? 'secondary' : 'ghost'}
                  onClick={() => setView('cards')}
                  disabled={busy}
                >
                  {t('list.views.cards')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'calendar' ? 'secondary' : 'ghost'}
                  onClick={() => setView('calendar')}
                  disabled={busy}
                >
                  {t('list.views.calendar')}
                </Button>
              </div>

              {busy ? <Badge variant="secondary">{t('states.loadingInline')}</Badge> : null}
            </div>
          </div>
          <CardDescription>{t('list.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {view === 'table' ? renderTable() : view === 'cards' ? renderCards() : renderCalendar()}
        </CardContent>
      </Card>

      <DecisionDialog />
    </>
  );
};
