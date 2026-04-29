'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Calendar,
  MessageSquare, 
  RefreshCcw, 
  Search, 
  Inbox, 
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

import {
  useListSupportTicketsAdminQuery,
  useToggleSupportTicketAdminMutation,
} from '@/integrations/hooks';

export default function AdminSupportClient() {
  const t = useAdminT('admin.support');
  const [search, setSearch] = React.useState('');
  const query = useListSupportTicketsAdminQuery();
  const [toggleStatus, toggleStatusState] = useToggleSupportTicketAdminMutation();

  const tickets = React.useMemo(() => {
    if (!query.data) return [];
    if (!search) return query.data;
    const s = search.toLowerCase();
    return query.data.filter(ticket => 
      ticket.subject.toLowerCase().includes(s) || 
      ticket.message.toLowerCase().includes(s)
    );
  }, [query.data, search]);

  const handleToggle = async (id: string, currentStatus: string) => {
    const action = currentStatus === 'closed' ? 'reopen' : 'close';
    try {
      await toggleStatus({ id, action }).unwrap();
      toast.success(action === 'close' ? t('actions.close') : t('actions.reopen'));
      query.refetch();
    } catch {
      toast.error(t('actions.error'));
    }
  };

  const busy = query.isFetching || toggleStatusState.isLoading;

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">
              {t('header.badge')}
            </span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">{t('header.title')}</h1>
          <p className="text-gm-muted text-sm font-serif italic opacity-70">
            {t('header.description')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50 group-focus-within:text-gm-gold transition-colors" />
            <Input 
              placeholder={t('filters.searchPlaceholder')} 
              className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm transition-all" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => query.refetch()} 
            disabled={busy}
            className="rounded-full border-gm-border-soft bg-gm-surface/50 px-8 h-12 text-[10px] font-bold tracking-widest uppercase transition-all hover:bg-gm-primary/5 shadow-lg backdrop-blur-sm"
          >
            <RefreshCcw className={cn("mr-2 size-4", query.isFetching && "animate-spin")} />
            {t('admin.common.refresh', null, 'Yenile')}
          </Button>
        </div>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="bg-gm-bg-deep/40 border-gm-border-soft rounded-[32px] p-8 relative overflow-hidden group backdrop-blur-md shadow-xl transition-all hover:border-gm-gold/20">
          <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-700">
            <Inbox size={100} className="text-gm-gold" />
          </div>
          <div className="relative z-10 space-y-4">
            <p className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase">{t('stats.total')}</p>
            <div className="text-5xl font-serif text-gm-text">{tickets.length}</div>
          </div>
        </Card>

        <Card className="bg-gm-bg-deep/40 border-gm-border-soft rounded-[32px] p-8 relative overflow-hidden group backdrop-blur-md shadow-xl transition-all hover:border-gm-error/20">
          <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-700">
            <ShieldAlert size={100} className="text-gm-error" />
          </div>
          <div className="relative z-10 space-y-4">
            <p className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase">{t('stats.open')}</p>
            <div className="text-5xl font-serif text-gm-error font-bold">
              {tickets.filter(ticket => ticket.status !== 'closed').length}
            </div>
          </div>
        </Card>

        <Card className="bg-gm-bg-deep/40 border-gm-border-soft rounded-[32px] p-8 relative overflow-hidden group backdrop-blur-md shadow-xl transition-all hover:border-gm-success/20">
          <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-700">
            <CheckCircle2 size={100} className="text-gm-success" />
          </div>
          <div className="relative z-10 space-y-4">
            <p className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase">{t('stats.closed')}</p>
            <div className="text-5xl font-serif text-gm-success font-bold">
              {tickets.filter(ticket => ticket.status === 'closed').length}
            </div>
          </div>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gm-surface/40">
              <TableRow className="border-gm-border-soft hover:bg-transparent">
                <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.status')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.priority')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.subject')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center text-gm-muted">{t('table.date')}</TableHead>
                <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-gm-border-soft">
                    <TableCell className="py-6 px-8"><Skeleton className="h-8 w-24 rounded-full bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-6 w-20 rounded-full bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-10 w-64 bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-6 w-32 mx-auto bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6 px-8"><Skeleton className="h-10 w-24 ml-auto bg-gm-surface/20 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-30 animate-pulse">
                      <Inbox className="w-20 h-20 text-gm-gold/50" />
                      <span className="font-serif italic text-xl text-gm-muted">{t('table.empty')}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id} className="border-gm-border-soft hover:bg-gm-primary/[0.03] transition-colors group">
                    <TableCell className="py-6 px-8">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] border transition-all",
                        ticket.status === 'closed' ? "bg-gm-muted/5 border-gm-muted/20 text-gm-muted" :
                        ticket.status === 'waiting_response' ? "bg-gm-warning/5 border-gm-warning/20 text-gm-warning" :
                        "bg-gm-gold/5 border-gm-gold/20 text-gm-gold"
                      )}>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          ticket.status === 'closed' ? "bg-gm-muted" :
                          ticket.status === 'waiting_response' ? "bg-gm-warning animate-pulse" :
                          "bg-gm-gold"
                        )} />
                        {t(`status.${ticket.status}`)}
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex items-center gap-3">
                        {ticket.priority === 'urgent' || ticket.priority === 'high' ? (
                          <div className="p-1.5 rounded-full bg-gm-error/10 text-gm-error">
                            <AlertCircle className="size-3.5" />
                          </div>
                        ) : ticket.priority === 'medium' ? (
                          <div className="p-1.5 rounded-full bg-gm-gold/10 text-gm-gold">
                            <Clock className="size-3.5" />
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-full bg-gm-surface text-gm-muted opacity-40">
                            <ChevronRight className="size-3.5" />
                          </div>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                          {t(`priority.${ticket.priority}`)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="max-w-md font-serif text-xl text-gm-text group-hover:text-gm-primary transition-colors duration-500 truncate">
                        {ticket.subject}
                      </div>
                      <div className="max-w-md text-sm text-gm-muted font-serif italic opacity-60 leading-relaxed mt-1 truncate">
                        {ticket.message}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <div className="text-[10px] text-gm-muted font-mono flex items-center justify-center gap-2 opacity-70">
                        <Calendar size={12} className="text-gm-gold/60" />
                        {format(new Date(ticket.created_at), 'dd MMM yyyy, HH:mm', { locale: tr })}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <div className="flex justify-end gap-3 opacity-20 group-hover:opacity-100 transition-all duration-300">
                        <Button asChild size="sm" variant="ghost" className="rounded-full hover:bg-gm-gold/10 hover:text-gm-gold px-8 h-10 text-[10px] font-bold tracking-widest uppercase">
                          <Link href={`/admin/support/${ticket.id}`}>
                            <MessageSquare className="mr-2 size-4" />
                            {t('actions.reply')}
                          </Link>
                        </Button>
                        <button 
                          className={cn(
                            "p-2.5 rounded-full transition-all border border-transparent shadow-sm",
                            ticket.status === 'closed' 
                              ? "hover:bg-gm-gold/10 text-gm-gold/40 hover:text-gm-gold hover:border-gm-gold/20" 
                              : "hover:bg-gm-success/10 text-gm-success/40 hover:text-gm-success hover:border-gm-success/20"
                          )}
                          onClick={() => handleToggle(ticket.id, ticket.status)}
                          disabled={toggleStatusState.isLoading}
                        >
                          {ticket.status === 'closed' ? (
                            <RefreshCcw className={cn("size-4", toggleStatusState.isLoading && "animate-spin")} />
                          ) : (
                            <CheckCircle2 className={cn("size-4", toggleStatusState.isLoading && "animate-spin")} />
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
