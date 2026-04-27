'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Check, Eye, Mail, Pencil, Trash2, X, ShieldCheck, User, Clock, Calendar } from 'lucide-react';

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
    const label = t(`status.${k}`, undefined, k);
    
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
        k === 'completed' || k === 'confirmed' ? 'bg-[#4CAF6E]/10 text-[#4CAF6E]' :
        k === 'rejected' || k === 'cancelled' ? 'bg-[#E55B4D]/10 text-[#E55B4D]' :
        'bg-[#F0A030]/10 text-[#F0A030]'
      }`}>
        <div className={`w-1 h-1 rounded-full ${
          k === 'completed' || k === 'confirmed' ? 'bg-[#4CAF6E]' :
          k === 'rejected' || k === 'cancelled' ? 'bg-[#E55B4D]' :
          'bg-[#F0A030]'
        }`} />
        {label}
      </div>
    );
  };

  const handleMarkRead = async (b: BookingMergedDto) => {
    try {
      await markRead(String(b.id)).unwrap();
      toast.success('Okundu olarak işaretlendi');
    } catch {
      toast.error('Hata oluştu');
    }
  };

  const handleDecisionSubmit = async () => {
    const b = decisionItem;
    if (!b) return;
    try {
      if (decisionMode === 'accept') {
        await acceptBooking({ id: String(b.id), body: decisionNote ? { decision_note: decisionNote } : {} } as any).unwrap();
        toast.success('Randevu onaylandı');
      } else {
        await rejectBooking({ id: String(b.id), body: decisionNote ? { decision_note: decisionNote } : {} } as any).unwrap();
        toast.success('Randevu reddedildi');
      }
      closeDecision();
    } catch {
      toast.error('Hata oluştu');
    }
  };

  const handleReminder = async (b: BookingMergedDto) => {
    try {
      await sendReminder({ id: String(b.id), body: { locale: String(b.locale || 'tr') } }).unwrap();
      toast.success('Hatırlatıcı gönderildi');
    } catch {
      toast.error('Hata oluştu');
    }
  };

  const handleDelete = async (b: BookingMergedDto) => {
    if (!window.confirm('Bu randevuyu silmek istediğinize emin misiniz?')) return;
    try {
      await deleteBooking(String(b.id)).unwrap();
      toast.success('Randevu silindi');
    } catch {
      toast.error('Hata oluştu');
    }
  };

  return (
    <Card className="bg-card border-border/40 rounded-[32px] overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest">Durum & Bilgi</TableHead>
              <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest">Danışan</TableHead>
              <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest">Zaman & Danışman</TableHead>
              <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest">Hizmet</TableHead>
              <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((b) => {
              const isRead = isReadRow(b);
              return (
                <TableRow key={b.id} className={cn("border-border/20 hover:bg-muted/10 transition-colors", !isRead && "bg-[#C9A961]/5")}>
                  <TableCell className="py-6 px-8">
                    <div className="flex flex-col gap-2">
                      {statusBadge(b.status)}
                      {!isRead && <span className="text-[9px] font-bold text-[#C9A961] tracking-widest">YENİ KAYIT</span>}
                    </div>
                  </TableCell>

                  <TableCell className="py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted border border-border/40 flex items-center justify-center text-muted-foreground">
                        <User size={14} />
                      </div>
                      <div>
                        <div className="font-serif text-lg text-foreground">{b.name || '-'}</div>
                        <div className="text-xs text-muted-foreground font-mono opacity-60">{b.email}</div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Calendar size={12} className="text-[#C9A961]" />
                        <span className="font-serif">{b.appointment_date}</span>
                        <Clock size={12} className="text-[#C9A961] ml-1" />
                        <span className="font-mono text-xs">{b.appointment_time?.slice(0, 5)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground italic font-serif">
                        Danışman: {b.resource_title || 'Atanmamış'}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-6">
                    <div className="text-sm font-serif text-[#C9A961]">{b.service_title || 'Genel Seans'}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{(b as any).session_duration ?? '—'} Dakika</div>
                  </TableCell>

                  <TableCell className="py-6 px-8 text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="icon" variant="ghost" className="rounded-full hover:bg-[#C9A961]/10 hover:text-[#C9A961]">
                        <Link href={`/admin/bookings/${encodeURIComponent(String(b.id))}`}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full hover:bg-[#4CAF6E]/10 hover:text-[#4CAF6E]"
                        disabled={busy || !canAccept(b)}
                        onClick={() => openDecision('accept', b)}
                      >
                        <Check className="size-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full hover:bg-[#E55B4D]/10 hover:text-[#E55B4D]"
                        disabled={busy || !canReject(b)}
                        onClick={() => openDecision('reject', b)}
                      >
                        <X className="size-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full hover:bg-[#C9A961]/10 hover:text-[#C9A961]"
                        disabled={busy}
                        onClick={() => handleReminder(b)}
                      >
                        <Mail className="size-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full hover:bg-[#E55B4D]/10 hover:text-[#E55B4D]"
                        disabled={busy}
                        onClick={() => handleDelete(b)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      {/* Decision Dialog */}
      <Dialog open={decisionOpen} onOpenChange={(v) => !v && closeDecision()}>
        <DialogContent className="bg-card border-border/40 rounded-[32px] p-8 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl">
              {decisionMode === 'accept' ? 'Randevuyu Onayla' : 'Randevuyu Reddet'}
            </DialogTitle>
            <DialogDescription className="font-serif italic text-lg pt-2">
              Danışana iletilecek notu girebilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <Textarea
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              placeholder="Mesajınız (opsiyonel)..."
              className="bg-muted/20 border-border/40 rounded-2xl p-4 min-h-[120px] focus:border-[#C9A961]/50 resize-none"
            />
          </div>

          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={closeDecision} className="rounded-full px-8">İptal</Button>
            <Button
              className={cn("rounded-full px-10 font-bold tracking-widest uppercase", decisionMode === 'accept' ? 'bg-[#C9A961] text-[#1A1715]' : 'bg-[#E55B4D] text-white')}
              onClick={handleDecisionSubmit}
              disabled={busy}
            >
              {decisionMode === 'accept' ? 'ONAYLA' : 'REDDET'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
