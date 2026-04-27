'use client';

import * as React from 'react';
import { AlertCircle, CheckCircle2, Clock, MessageSquare, RefreshCcw, Search, Inbox, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useListSupportTicketsAdminQuery,
  useToggleSupportTicketAdminMutation,
} from '@/integrations/hooks';
import Link from 'next/link';

export default function AdminSupportClient() {
  const [search, setSearch] = React.useState('');
  const query = useListSupportTicketsAdminQuery();
  const [toggleStatus] = useToggleSupportTicketAdminMutation();

  const tickets = React.useMemo(() => {
    if (!query.data) return [];
    if (!search) return query.data;
    const s = search.toLowerCase();
    return query.data.filter(t => 
      t.subject.toLowerCase().includes(s) || 
      t.message.toLowerCase().includes(s)
    );
  }, [query.data, search]);

  const handleToggle = async (id: string, currentStatus: string) => {
    const action = currentStatus === 'closed' ? 'reopen' : 'close';
    try {
      await toggleStatus({ id, action }).unwrap();
      toast.success(action === 'close' ? 'Talep kapatıldı.' : 'Talep yeniden açıldı.');
    } catch {
      toast.error('Hata oluştu.');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-[#C9A961]" />
            <span className="text-[#C9A961] font-bold text-[10px] tracking-[0.2em] uppercase">Yardım Masası</span>
          </div>
          <h1 className="font-serif text-4xl text-foreground">Destek Talepleri</h1>
          <p className="text-muted-foreground text-sm mt-2 font-serif italic">
            Kullanıcı sorularını ve teknik destek taleplerini buradan yönetin.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="relative w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              placeholder="Talep ara..." 
              className="pl-12 bg-muted/20 border-border/40 rounded-2xl h-11 focus:border-[#C9A961]/50" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => query.refetch()} 
            disabled={query.isFetching}
            className="rounded-full border-border/40 px-6 h-11"
          >
            <RefreshCcw className={`mr-2 size-4 ${query.isFetching ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>
      </div>

      {/* Queue Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border/40 rounded-[24px] p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <Inbox size={48} />
          </div>
          <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-2">Toplam Talep</p>
          <div className="text-3xl font-serif text-foreground">{tickets.length}</div>
        </Card>
        <Card className="bg-card border-border/40 rounded-[24px] p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <ShieldAlert size={48} className="text-[#E55B4D]" />
          </div>
          <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-2">Açık Talepler</p>
          <div className="text-3xl font-serif text-[#E55B4D]">{tickets.filter(t => t.status !== 'closed').length}</div>
        </Card>
        <Card className="bg-card border-border/40 rounded-[24px] p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <CheckCircle2 size={48} className="text-[#4CAF6E]" />
          </div>
          <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-2">Kapatılanlar</p>
          <div className="text-3xl font-serif text-[#4CAF6E]">{tickets.filter(t => t.status === 'closed').length}</div>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="bg-card border-border/40 rounded-[32px] overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest">Durum</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest">Öncelik</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest">Konu & Mesaj</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center">Tarih</TableHead>
                <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center font-serif italic text-muted-foreground">Yükleniyor...</TableCell>
                </TableRow>
              ) : tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center font-serif italic text-muted-foreground opacity-30">
                    Henüz destek talebi bulunmuyor.
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id} className="border-border/20 hover:bg-muted/10 transition-colors">
                    <TableCell className="py-6 px-8">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                        ticket.status === 'closed' ? 'bg-muted text-muted-foreground' :
                        ticket.status === 'waiting_response' ? 'bg-[#F0A030]/10 text-[#F0A030]' :
                        'bg-[#C9A961]/10 text-[#C9A961]'
                      }`}>
                        {ticket.status === 'closed' ? 'KAPANDI' : ticket.status === 'waiting_response' ? 'YANIT BEKLİYOR' : 'AÇIK'}
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex items-center gap-2">
                        {ticket.priority === 'urgent' || ticket.priority === 'high' ? (
                          <AlertCircle className="size-4 text-[#E55B4D]" />
                        ) : ticket.priority === 'medium' ? (
                          <Clock className="size-4 text-[#C9A961]" />
                        ) : (
                          <div className="size-4" />
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                          {ticket.priority === 'urgent' ? 'ACİL' : ticket.priority === 'high' ? 'YÜKSEK' : ticket.priority === 'medium' ? 'ORTA' : 'DÜŞÜK'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="max-w-md truncate font-serif text-lg text-foreground">{ticket.subject}</div>
                      <div className="max-w-md truncate text-xs text-muted-foreground font-serif italic opacity-70">{ticket.message}</div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <div className="text-xs text-muted-foreground font-mono">
                        {format(new Date(ticket.created_at), 'dd MMM yyyy, HH:mm', { locale: tr })}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <div className="flex justify-end gap-3">
                        <Button asChild size="sm" variant="ghost" className="rounded-full hover:bg-[#C9A961]/10 hover:text-[#C9A961] px-6">
                          <Link href={`/admin/support/${ticket.id}`}>
                            <MessageSquare className="mr-2 size-4" />
                            Yanıtla
                          </Link>
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          className="rounded-full"
                          onClick={() => handleToggle(ticket.id, ticket.status)}
                        >
                          {ticket.status === 'closed' ? (
                            <RefreshCcw className="size-4 text-[#C9A961]" />
                          ) : (
                            <CheckCircle2 className="size-4 text-[#4CAF6E]" />
                          )}
                        </Button>
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
