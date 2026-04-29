'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
  Check, 
  Eye, 
  Mail, 
  Trash2, 
  X, 
  User, 
  Clock, 
  Calendar,
  MoreVertical,
  AlertCircle
} from 'lucide-react';

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
import { Card, CardContent } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';

export type BookingsListProps = {
  items?: BookingMergedDto[];
  loading: boolean;
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

  const [deleteBooking, deleteState] = useDeleteBookingAdminMutation();
  const [markRead, markReadState] = useMarkBookingReadAdminMutation();
  const [acceptBooking, acceptState] = useAcceptBookingAdminMutation();
  const [rejectBooking, rejectState] = useRejectBookingAdminMutation();
  const [sendReminder, reminderState] = useSendBookingReminderAdminMutation();

  const busy = loading || deleteState.isLoading || markReadState.isLoading || acceptState.isLoading || rejectState.isLoading || reminderState.isLoading;

  const [decisionOpen, setDecisionOpen] = React.useState(false);
  const [decisionMode, setDecisionMode] = React.useState<DecisionMode>('accept');
  const [decisionItem, setDecisionItem] = React.useState<BookingMergedDto | null>(null);
  const [decisionNote, setDecisionNote] = React.useState('');

  const openDecision = (mode: DecisionMode, b: BookingMergedDto) => {
    setDecisionMode(mode);
    setDecisionItem(b);
    setDecisionNote('');
    setDecisionOpen(true);
  };

  const closeDecision = () => {
    if (busy) return;
    setDecisionOpen(false);
    setDecisionItem(null);
    setDecisionNote('');
  };

  const statusBadge = (s: unknown) => {
    const k = statusKey(s);
    const label = t(`status.${k}`, undefined, k.toUpperCase());
    
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all",
        k === 'completed' || k === 'confirmed' ? 'bg-gm-success/10 text-gm-success' :
        k === 'rejected' || k === 'cancelled' ? 'bg-gm-error/10 text-gm-error' :
        'bg-gm-gold/10 text-gm-gold'
      )}>
        <div className={cn(
          "w-1 h-1 rounded-full",
          k === 'completed' || k === 'confirmed' ? 'bg-gm-success' :
          k === 'rejected' || k === 'cancelled' ? 'bg-gm-error' :
          'bg-gm-gold'
        )} />
        {label}
      </div>
    );
  };

  const handleDecisionSubmit = async () => {
    const b = decisionItem;
    if (!b) return;
    try {
      if (decisionMode === 'accept') {
        await acceptBooking({ id: String(b.id), body: decisionNote ? { decision_note: decisionNote } : {} } as any).unwrap();
        toast.success(t('toasts.acceptSuccess', null, 'Randevu onaylandı'));
      } else {
        await rejectBooking({ id: String(b.id), body: decisionNote ? { decision_note: decisionNote } : {} } as any).unwrap();
        toast.success(t('toasts.rejectSuccess', null, 'Randevu reddedildi'));
      }
      closeDecision();
    } catch {
      toast.error(t('toasts.error', null, 'Hata oluştu'));
    }
  };

  const handleReminder = async (b: BookingMergedDto) => {
    try {
      await sendReminder({ id: String(b.id), body: { locale: String(b.locale || 'tr') } }).unwrap();
      toast.success(t('toasts.reminderSent', null, 'Hatırlatıcı gönderildi'));
    } catch {
      toast.error(t('toasts.error', null, 'Hata oluştu'));
    }
  };

  const handleDelete = async (b: BookingMergedDto) => {
    if (!window.confirm(t('deleteConfirm', { item: String(b.id).slice(0, 8) }, 'Bu randevuyu silmek istediğinize emin misiniz?'))) return;
    try {
      await deleteBooking(String(b.id)).unwrap();
      toast.success(t('toasts.deleteSuccess', null, 'Randevu silindi'));
    } catch {
      toast.error(t('toasts.error', null, 'Hata oluştu'));
    }
  };

  return (
    <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-gm-surface/40">
            <TableRow className="border-gm-border-soft hover:bg-transparent">
              <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('list.columns.status')}</TableHead>
              <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('list.columns.customer')}</TableHead>
              <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('list.columns.date')}</TableHead>
              <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('list.columns.service')}</TableHead>
              <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('admin.common.actions', null, 'İşlemler')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-gm-border-soft">
                  <TableCell className="py-6 px-8"><Skeleton className="h-6 w-20 bg-gm-surface/20 rounded-full" /></TableCell>
                  <TableCell className="py-6"><Skeleton className="h-10 w-40 bg-gm-surface/20" /></TableCell>
                  <TableCell className="py-6"><Skeleton className="h-10 w-32 bg-gm-surface/20" /></TableCell>
                  <TableCell className="py-6"><Skeleton className="h-10 w-24 bg-gm-surface/20" /></TableCell>
                  <TableCell className="py-6 px-8"><Skeleton className="h-8 w-24 ml-auto bg-gm-surface/20 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-30">
                    <AlertCircle className="w-16 h-16 text-gm-gold/50" />
                    <span className="font-serif italic text-lg text-gm-muted">{t('states.empty')}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((b) => {
                const isRead = isReadRow(b);
                return (
                  <TableRow 
                    key={b.id} 
                    className={cn(
                      "border-gm-border-soft hover:bg-gm-primary/[0.03] transition-colors group", 
                      !isRead && "bg-gm-gold/[0.02]"
                    )}
                  >
                    <TableCell className="py-6 px-8">
                      <div className="flex flex-col gap-2">
                        {statusBadge(b.status)}
                        {!isRead && (
                          <Badge variant="outline" className="w-fit text-[8px] font-bold text-gm-gold tracking-[0.2em] bg-gm-gold/5 border-gm-gold/20 rounded-full px-2">
                            {t('badges.unread', null, 'YENİ')}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gm-surface border border-gm-border-soft flex items-center justify-center text-gm-gold group-hover:border-gm-gold/50 transition-all shadow-inner">
                          <User size={16} />
                        </div>
                        <div>
                          <div className="font-serif text-lg text-gm-text group-hover:text-gm-primary transition-colors">
                            {b.name || t('table.unknownUser', null, '-')}
                          </div>
                          <div className="text-[10px] text-gm-muted font-mono opacity-60 leading-none tracking-tighter">
                            {b.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-6">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-gm-text">
                          <Calendar size={14} className="text-gm-gold/60" />
                          <span className="font-serif">{b.appointment_date}</span>
                          <Clock size={14} className="text-gm-gold/60 ml-1" />
                          <span className="font-mono text-[11px] opacity-70">{b.appointment_time?.slice(0, 5)}</span>
                        </div>
                        <div className="text-[10px] text-gm-muted italic font-serif opacity-80 flex items-center gap-1">
                          <span className="text-gm-gold/40 tracking-widest uppercase text-[8px] font-bold not-italic">{t('labels.resource', null, 'DANIŞMAN')}:</span>
                          <span className="text-gm-text/70">{b.resource_title || '-'}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-6">
                      <div className="text-sm font-serif text-gm-gold group-hover:text-gm-gold-light transition-colors">{b.service_title || 'Seans'}</div>
                      <div className="text-[9px] text-gm-muted font-bold tracking-[0.2em] uppercase mt-1 opacity-60">
                        {(b as any).session_duration || '30'} {t('admin.common.minutes', null, 'DAKİKA')}
                      </div>
                    </TableCell>

                    <TableCell className="py-6 px-8 text-right">
                      <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-all">
                        <Button asChild size="icon" variant="ghost" className="rounded-full hover:bg-gm-gold/10 hover:text-gm-gold transition-colors">
                          <Link href={`/admin/bookings/${encodeURIComponent(String(b.id))}`}>
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full hover:bg-gm-success/10 text-gm-success/40 hover:text-gm-success transition-all"
                          disabled={busy || !canAccept(b)}
                          onClick={() => openDecision('accept', b)}
                        >
                          <Check className="size-4" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full hover:bg-gm-error/10 text-gm-error/40 hover:text-gm-error transition-all"
                          disabled={busy || !canReject(b)}
                          onClick={() => openDecision('reject', b)}
                        >
                          <X className="size-4" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full hover:bg-gm-gold/10 text-gm-gold/40 hover:text-gm-gold transition-all"
                          disabled={busy}
                          onClick={() => handleReminder(b)}
                        >
                          <Mail className="size-4" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full hover:bg-gm-error/10 text-gm-error/40 hover:text-gm-error transition-all"
                          disabled={busy}
                          onClick={() => handleDelete(b)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Decision Dialog */}
      <Dialog open={decisionOpen} onOpenChange={(v) => !v && closeDecision()}>
        <DialogContent className="bg-gm-surface-high border-gm-border-soft rounded-[32px] p-8 max-w-md backdrop-blur-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl text-gm-text">
              {decisionMode === 'accept' ? t('actions.acceptTitle', null, 'Randevuyu Onayla') : t('actions.rejectTitle', null, 'Randevuyu Reddet')}
            </DialogTitle>
            <DialogDescription className="font-serif italic text-lg pt-2 text-gm-muted">
              {t('actions.decisionNoteDescription', null, 'Danışana iletilecek notu girebilirsiniz.')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <Textarea
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              placeholder={t('actions.decisionNotePlaceholder', null, 'Mesajınız (opsiyonel)...')}
              className="bg-gm-surface border-gm-border-soft rounded-2xl p-4 min-h-[140px] focus:ring-gm-gold/50 resize-none transition-all text-sm font-serif"
            />
          </div>

          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={closeDecision} className="rounded-full px-8 text-gm-muted hover:text-gm-text transition-all font-bold tracking-widest uppercase text-[10px]">
              {t('admin.common.cancel')}
            </Button>
            <Button
              className={cn(
                "rounded-full px-10 h-12 font-bold tracking-widest uppercase transition-all shadow-lg text-[10px] active:scale-95", 
                decisionMode === 'accept' ? 'bg-gm-gold text-gm-bg hover:opacity-90 shadow-gm-gold/20' : 'bg-gm-error text-white hover:bg-gm-error/90 shadow-gm-error/20'
              )}
              onClick={handleDecisionSubmit}
              disabled={busy}
            >
              {decisionMode === 'accept' ? t('admin.common.confirm') : t('admin.common.reject', null, 'REDDET')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
