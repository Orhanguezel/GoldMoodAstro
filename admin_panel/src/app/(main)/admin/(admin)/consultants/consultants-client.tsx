'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, Eye, RefreshCcw, X, ShieldCheck, Star, Users } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useApproveConsultantAdminMutation,
  useListConsultantsAdminQuery,
  useRejectConsultantAdminMutation,
} from '@/integrations/hooks';

const FILTERS = [
  { label: 'Hepsi', value: undefined },
  { label: 'Bekleyenler', value: 'pending' },
  { label: 'Onaylılar', value: 'approved' },
  { label: 'Reddedilenler', value: 'rejected' },
] as const;

export default function ConsultantsClient() {
  const [status, setStatus] = React.useState<string | undefined>();
  const query = useListConsultantsAdminQuery(status ? { approval_status: status } : undefined);
  const [approve, approveState] = useApproveConsultantAdminMutation();
  const [reject, rejectState] = useRejectConsultantAdminMutation();

  async function approveConsultant(id: string) {
    try {
      await approve(id).unwrap();
      toast.success('Danışman onaylandı.');
    } catch {
      toast.error('Onaylanırken hata oluştu.');
    }
  }

  async function rejectConsultant(id: string) {
    const reason = window.prompt('Reddetme nedeni');
    if (!reason?.trim()) return;
    try {
      await reject({ id, rejection_reason: reason.trim() }).unwrap();
      toast.success('Danışman reddedildi.');
    } catch {
      toast.error('Reddedilirken hata oluştu.');
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-[#C9A961]" />
            <span className="text-[#C9A961] font-bold text-[10px] tracking-[0.2em] uppercase">Rehber Yönetimi</span>
          </div>
          <h1 className="font-serif text-4xl text-foreground">Danışmanlar</h1>
          <p className="text-muted-foreground text-sm mt-2 font-serif italic">
            Danışman başvurularını inceleyin, onaylayın veya düzenleyin.
          </p>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => query.refetch()} 
          disabled={query.isFetching}
          className="rounded-full border-border/40 px-6"
        >
          <RefreshCcw className={`mr-2 size-4 ${query.isFetching ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 p-1 bg-muted/30 rounded-full border border-border/50 w-fit">
        {FILTERS.map((item) => (
          <button
            key={item.label}
            onClick={() => setStatus(item.value)}
            className={`px-6 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${
              status === item.value ? 'bg-[#C9A961] text-[#1A1715]' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <Card className="bg-card border-border/40 rounded-[32px] overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest">Danışman</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest">Uzmanlık</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest">Ücret</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest">Durum</TableHead>
                <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data?.map((item) => (
                <TableRow key={item.id} className="border-border/20 hover:bg-muted/10 transition-colors">
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted border border-border/50 flex items-center justify-center text-[#C9A961] font-serif">
                        {item.full_name?.[0] || 'D'}
                      </div>
                      <div>
                        <div className="font-serif text-lg text-foreground flex items-center gap-2">
                          {item.full_name}
                          {item.approval_status === 'approved' && <ShieldCheck className="w-4 h-4 text-[#C9A961]" />}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono opacity-60">{item.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-6">
                    <div className="flex flex-wrap gap-1">
                      {item.expertise?.slice(0, 2).map(e => (
                        <span key={e} className="text-[9px] font-bold px-2 py-0.5 rounded bg-muted border border-border/30 uppercase tracking-tighter">
                          {e}
                        </span>
                      ))}
                      {(item.expertise?.length || 0) > 2 && <span className="text-[9px] opacity-40">+{(item.expertise?.length || 0) - 2}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="py-6">
                    <span className="font-serif text-[#C9A961]">₺{Math.round(Number(item.session_price))}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">/ {item.session_duration}DK</span>
                  </TableCell>
                  <TableCell className="py-6">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                      item.approval_status === 'approved' ? 'bg-[#4CAF6E]/10 text-[#4CAF6E]' :
                      item.approval_status === 'rejected' ? 'bg-[#E55B4D]/10 text-[#E55B4D]' :
                      'bg-[#F0A030]/10 text-[#F0A030]'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${
                        item.approval_status === 'approved' ? 'bg-[#4CAF6E]' :
                        item.approval_status === 'rejected' ? 'bg-[#E55B4D]' :
                        'bg-[#F0A030]'
                      }`} />
                      {item.approval_status === 'approved' ? 'ONAYLI' : item.approval_status === 'rejected' ? 'REDDEDİLDİ' : 'BEKLEMEDE'}
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <div className="flex justify-end gap-3">
                      <Button asChild size="icon" variant="ghost" className="rounded-full hover:bg-[#C9A961]/10 hover:text-[#C9A961] transition-colors">
                        <Link href={`/admin/consultants/${item.id}`}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full hover:bg-[#4CAF6E]/10 hover:text-[#4CAF6E] transition-colors"
                        disabled={approveState.isLoading || item.approval_status === 'approved'}
                        onClick={() => approveConsultant(item.id)}
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full hover:bg-[#E55B4D]/10 hover:text-[#E55B4D] transition-colors"
                        disabled={rejectState.isLoading || item.approval_status === 'rejected'}
                        onClick={() => rejectConsultant(item.id)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!query.isLoading && !query.data?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center text-muted-foreground font-serif italic">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    Henüz danışman başvurusu bulunmuyor.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
