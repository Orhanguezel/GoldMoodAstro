import * as React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  CheckCircle2,
  Clock,
  Inbox,
  Mail,
  MessageSquare,
  Phone,
  RefreshCcw,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ContactDto, ContactStatus } from '@/integrations/shared';
import { useUpdateContactAdminMutation } from '@/integrations/hooks';

function formatDate(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, 'dd MMM yyyy, HH:mm', { locale: tr });
}

function statusLabel(status: ContactStatus) {
  if (status === 'closed') return 'Kapalı';
  if (status === 'in_progress') return 'İşlemde';
  return 'Yeni';
}

function statusClass(status: ContactStatus) {
  if (status === 'closed') return 'border-gm-muted/20 bg-gm-muted/5 text-gm-muted';
  if (status === 'in_progress') return 'border-gm-warning/20 bg-gm-warning/5 text-gm-warning';
  return 'border-gm-gold/20 bg-gm-gold/5 text-gm-gold';
}

export type ContactListProps = {
  contacts: ContactDto[];
  isLoading?: boolean;
  isFetching?: boolean;
};

export function ContactList({ contacts, isLoading = false, isFetching = false }: ContactListProps) {
  const [updateContact, updateState] = useUpdateContactAdminMutation();

  const counts = React.useMemo(() => {
    return {
      total: contacts.length,
      open: contacts.filter((contact) => contact.status !== 'closed').length,
      resolved: contacts.filter((contact) => contact.is_resolved || contact.status === 'closed').length,
    };
  }, [contacts]);

  const handleToggleResolved = async (contact: ContactDto) => {
    const resolved = !(contact.is_resolved || contact.status === 'closed');
    try {
      await updateContact({
        id: contact.id,
        patch: {
          is_resolved: resolved,
          status: resolved ? 'closed' : 'in_progress',
        },
      }).unwrap();
      toast.success(resolved ? 'Mesaj kapatıldı.' : 'Mesaj yeniden açıldı.');
    } catch {
      toast.error('İşlem tamamlanamadı.');
    }
  };

  const busy = isFetching || updateState.isLoading;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="relative overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-bg-deep/40 p-8 shadow-xl backdrop-blur-md">
          <Inbox className="absolute -right-4 -top-4 size-24 text-gm-gold opacity-5" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Toplam</p>
          <div className="mt-4 font-serif text-5xl text-gm-text">{counts.total}</div>
        </Card>
        <Card className="relative overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-bg-deep/40 p-8 shadow-xl backdrop-blur-md">
          <ShieldAlert className="absolute -right-4 -top-4 size-24 text-gm-error opacity-5" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Açık</p>
          <div className="mt-4 font-serif text-5xl font-bold text-gm-error">{counts.open}</div>
        </Card>
        <Card className="relative overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-bg-deep/40 p-8 shadow-xl backdrop-blur-md">
          <CheckCircle2 className="absolute -right-4 -top-4 size-24 text-gm-success opacity-5" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">Çözülen</p>
          <div className="mt-4 font-serif text-5xl font-bold text-gm-success">{counts.resolved}</div>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gm-surface/40">
              <TableRow className="border-gm-border-soft hover:bg-transparent">
                <TableHead className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Durum</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Kişi</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Konu</TableHead>
                <TableHead className="py-6 text-center text-[10px] font-bold uppercase tracking-widest text-gm-muted">Tarih</TableHead>
                <TableHead className="px-8 py-6 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="border-gm-border-soft">
                    <TableCell className="px-8 py-6"><Skeleton className="h-8 w-24 rounded-full bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-12 w-52 bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-12 w-72 bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="mx-auto h-6 w-32 bg-gm-surface/20" /></TableCell>
                    <TableCell className="px-8 py-6"><Skeleton className="ml-auto h-10 w-32 rounded-full bg-gm-surface/20" /></TableCell>
                  </TableRow>
                ))
              ) : contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-30">
                      <Inbox className="size-20 text-gm-gold/50" />
                      <span className="font-serif text-xl italic text-gm-muted">Henüz iletişim mesajı yok.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact) => (
                  <TableRow key={contact.id} className="group border-gm-border-soft transition-colors hover:bg-gm-primary/[0.03]">
                    <TableCell className="px-8 py-6">
                      <div className={cn('inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em]', statusClass(contact.status))}>
                        <span className={cn('size-1.5 rounded-full', contact.status === 'closed' ? 'bg-gm-muted' : contact.status === 'in_progress' ? 'bg-gm-warning' : 'bg-gm-gold')} />
                        {statusLabel(contact.status)}
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="font-serif text-lg text-gm-text">{contact.name || '-'}</div>
                      <div className="mt-1 flex flex-col gap-1 text-xs text-gm-muted">
                        <span className="flex items-center gap-2"><Mail className="size-3 text-gm-gold/70" />{contact.email || '-'}</span>
                        {contact.phone ? <span className="flex items-center gap-2"><Phone className="size-3 text-gm-gold/70" />{contact.phone}</span> : null}
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="max-w-md truncate font-serif text-xl text-gm-text transition-colors duration-500 group-hover:text-gm-primary">
                        {contact.subject || 'Konu yok'}
                      </div>
                      <div className="mt-1 max-w-md truncate font-serif text-sm italic leading-relaxed text-gm-muted opacity-60">
                        {contact.message}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <div className="flex items-center justify-center gap-2 font-mono text-[10px] text-gm-muted opacity-70">
                        <Clock className="size-3 text-gm-gold/60" />
                        {formatDate(contact.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-3 opacity-30 transition-all duration-300 group-hover:opacity-100">
                        <Button asChild size="sm" variant="ghost" className="h-10 rounded-full px-6 text-[10px] font-bold uppercase tracking-widest hover:bg-gm-gold/10 hover:text-gm-gold">
                          <Link href={`/admin/contacts/${contact.id}`}>
                            <MessageSquare className="mr-2 size-4" />
                            Detay
                          </Link>
                        </Button>
                        <button
                          className={cn(
                            'rounded-full border border-transparent p-2.5 shadow-sm transition-all',
                            contact.status === 'closed'
                              ? 'text-gm-gold/50 hover:border-gm-gold/20 hover:bg-gm-gold/10 hover:text-gm-gold'
                              : 'text-gm-success/50 hover:border-gm-success/20 hover:bg-gm-success/10 hover:text-gm-success',
                          )}
                          onClick={() => handleToggleResolved(contact)}
                          disabled={busy}
                          title={contact.status === 'closed' ? 'Yeniden aç' : 'Kapat'}
                        >
                          {contact.status === 'closed' ? (
                            <RefreshCcw className={cn('size-4', busy && 'animate-spin')} />
                          ) : (
                            <CheckCircle2 className={cn('size-4', busy && 'animate-spin')} />
                          )}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default ContactList;
