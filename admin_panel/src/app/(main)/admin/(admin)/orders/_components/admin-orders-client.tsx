'use client';

import * as React from 'react';
import Link from 'next/link';
import { Eye, RefreshCcw, Search, CreditCard, Receipt, Calendar, User } from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

import type { OrderStatus, PaymentStatus } from '@/integrations/shared';
import { useListOrdersAdminQuery } from '@/integrations/hooks';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

function fmtMoney(v: string | number, currency: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return `${v} ${currency}`;
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency || 'TRY',
  }).format(n);
}

const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'completed', 'cancelled', 'refunded'];
const PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'paid', 'failed', 'refunded'];

export default function AdminOrdersClient() {
  const t = useAdminT('admin.orders');

  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(20);
  const [status, setStatus] = React.useState<OrderStatus | 'all'>('all');
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatus | 'all'>('all');
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');

  const q = useListOrdersAdminQuery({
    page,
    limit,
    status: status === 'all' ? undefined : status,
    payment_status: paymentStatus === 'all' ? undefined : paymentStatus,
    q: search || undefined,
  });

  const orders = q.data?.data ?? [];
  const total = q.data?.total ?? 0;
  const hasPrev = page > 1;
  const hasNext = orders.length >= limit;

  function doSearch() {
    setSearch(searchInput.trim());
    setPage(1);
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-[#C9A961]" />
            <span className="text-[#C9A961] font-bold text-[10px] tracking-[0.2em] uppercase">Finansal Kayıtlar</span>
          </div>
          <h1 className="font-serif text-4xl text-foreground">Siparişler</h1>
          <p className="text-muted-foreground text-sm mt-2 font-serif italic">
            Tüm ödemeleri, iadeleri ve işlem durumlarını buradan takip edin.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Toplam İşlem</p>
            <p className="font-serif text-2xl text-[#C9A961]">{total}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => q.refetch()} 
            disabled={q.isFetching}
            className="rounded-full border-border/40 px-6 h-11"
          >
            <RefreshCcw className={`mr-2 size-4 ${q.isFetching ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="bg-card border-border/40 rounded-[32px] overflow-hidden">
        <CardContent className="p-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-end">
          <div className="space-y-3 md:col-span-2">
            <label className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase ml-1">İşlem No / E-posta</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                placeholder="Sipariş no veya e-posta..."
                className="pl-12 bg-muted/20 border-border/40 rounded-2xl h-12"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase ml-1 text-center block">Sipariş Durumu</label>
            <Select value={status} onValueChange={(v) => { setStatus(v as any); setPage(1); }}>
              <SelectTrigger className="bg-muted/20 border-border/40 rounded-2xl h-12 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/40 rounded-2xl">
                <SelectItem value="all">Tümü</SelectItem>
                {ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase ml-1 text-center block">Ödeme Durumu</label>
            <Select value={paymentStatus} onValueChange={(v) => { setPaymentStatus(v as any); setPage(1); }}>
              <SelectTrigger className="bg-muted/20 border-border/40 rounded-2xl h-12 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/40 rounded-2xl">
                <SelectItem value="all">Tümü</SelectItem>
                {PAYMENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="bg-card border-border/40 rounded-[32px] overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest">Sipariş No</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest">Müşteri Bilgisi</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center">Tutar</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center">Durum</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center">Ödeme</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center">Tarih</TableHead>
                <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest">Detay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.isFetching && orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center font-serif italic text-muted-foreground">Yükleniyor...</TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center font-serif italic text-muted-foreground opacity-30">
                    Sipariş kaydı bulunmuyor.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} className="border-border/20 hover:bg-muted/10 transition-colors">
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#C9A961]/10 flex items-center justify-center text-[#C9A961]">
                          <Receipt size={14} />
                        </div>
                        <span className="font-mono text-xs tracking-tighter text-[#C9A961]">{order.order_number}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted border border-border/50 flex items-center justify-center text-muted-foreground">
                          <User size={14} />
                        </div>
                        <div>
                          <div className="font-serif text-base text-foreground">{order.user_name || '-'}</div>
                          <div className="text-[10px] text-muted-foreground font-mono opacity-50">{order.user_email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <span className="font-serif text-lg text-foreground">{fmtMoney(order.total_amount, order.currency)}</span>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                        order.status === 'completed' ? 'bg-[#4CAF6E]/10 text-[#4CAF6E]' :
                        order.status === 'cancelled' || order.status === 'refunded' ? 'bg-[#E55B4D]/10 text-[#E55B4D]' :
                        'bg-[#F0A030]/10 text-[#F0A030]'
                      }`}>
                        {order.status.toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                        order.payment_status === 'paid' ? 'border-[#4CAF6E]/30 text-[#4CAF6E]' :
                        order.payment_status === 'failed' ? 'border-[#E55B4D]/30 text-[#E55B4D]' :
                        'border-border/50 text-muted-foreground'
                      }`}>
                        {order.payment_status.toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <div className="text-[10px] text-muted-foreground font-mono flex items-center justify-center gap-2">
                        <Calendar size={12} className="text-[#C9A961]" />
                        {order.created_at ? format(new Date(order.created_at), 'dd.MM.yyyy HH:mm') : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <Button asChild variant="ghost" size="icon" className="rounded-full hover:bg-[#C9A961]/10 hover:text-[#C9A961]">
                        <Link href={`/admin/orders/${order.id}`}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between px-8">
        <div className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
          Sayfa {page} • Toplam {total} İşlem
        </div>

        <div className="flex gap-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasPrev || q.isFetching}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="rounded-full px-6 hover:bg-[#C9A961]/10 hover:text-[#C9A961]"
          >
            Önceki
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasNext || q.isFetching}
            onClick={() => setPage(p => p + 1)}
            className="rounded-full px-6 hover:bg-[#C9A961]/10 hover:text-[#C9A961]"
          >
            Sonraki
          </Button>
        </div>
      </div>
    </div>
  );
}
