'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Eye, 
  RefreshCcw, 
  Search, 
  Receipt, 
  Calendar, 
  User,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

import type { OrderStatus, PaymentStatus } from '@/integrations/shared';
import { useListOrdersAdminQuery } from '@/integrations/hooks';

function fmtMoney(v: string | number, currency: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return `${v} ${currency}`;
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency || 'TRY',
    minimumFractionDigits: 2,
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
  const hasNext = orders.length >= limit && (page * limit) < total;

  function doSearch() {
    setSearch(searchInput.trim());
    setPage(1);
  }

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">
              {t('header.badge', null, 'Finansal Kayıtlar')}
            </span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">{t('header.title')}</h1>
          <p className="text-gm-muted text-sm font-serif italic opacity-70">
            {t('header.description')}
          </p>
        </div>

        <div className="flex items-center gap-6 bg-gm-surface/20 px-8 py-4 rounded-[24px] border border-gm-border-soft backdrop-blur-sm shadow-lg">
          <div className="text-center sm:text-right min-w-[80px]">
            <p className="text-[10px] font-bold text-gm-muted tracking-widest uppercase mb-1">{t('summary.total_label')}</p>
            <p className="font-serif text-3xl text-gm-gold">{total}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => q.refetch()} 
            disabled={q.isFetching}
            className="rounded-full border-gm-border-soft px-8 h-12 hover:bg-gm-surface transition-all font-bold tracking-widest uppercase text-[10px]"
          >
            <RefreshCcw className={cn("mr-2 size-4", q.isFetching && "animate-spin")} />
            {t('admin.common.refresh', null, 'Yenile')}
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="bg-gm-bg-deep/50 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-md shadow-2xl">
        <CardContent className="p-8 grid gap-8 md:grid-cols-2 lg:grid-cols-4 items-end">
          <div className="space-y-3 md:col-span-2">
            <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">
              {t('filters.searchLabel')}
            </Label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                placeholder={t('filters.searchPlaceholder')}
                className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1 block">
              {t('filters.orderStatusLabel')}
            </Label>
            <Select value={status} onValueChange={(v) => { setStatus(v as any); setPage(1); }}>
              <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl">
                <SelectItem value="all">{t('filters.all')}</SelectItem>
                {ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1 block">
              {t('filters.paymentStatusLabel')}
            </Label>
            <Select value={paymentStatus} onValueChange={(v) => { setPaymentStatus(v as any); setPage(1); }}>
              <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl">
                <SelectItem value="all">{t('filters.all')}</SelectItem>
                {PAYMENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gm-surface/40">
              <TableRow className="border-gm-border-soft hover:bg-transparent">
                <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.orderNo')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.customer')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center text-gm-muted">{t('table.amount')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center text-gm-muted">{t('table.status')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center text-gm-muted">{t('table.payment')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center text-gm-muted">{t('table.date')}</TableHead>
                <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.isFetching && orders.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-gm-border-soft">
                    <TableCell className="py-6 px-8"><Skeleton className="h-6 w-24 bg-gm-surface/20 rounded-full" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-10 w-40 bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-6 w-20 bg-gm-surface/20 mx-auto" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-8 w-24 bg-gm-surface/20 mx-auto rounded-full" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-8 w-24 bg-gm-surface/20 mx-auto rounded-full" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-6 w-32 bg-gm-surface/20 mx-auto" /></TableCell>
                    <TableCell className="py-6 px-8"><Skeleton className="h-10 w-10 ml-auto bg-gm-surface/20 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <AlertCircle className="w-16 h-16 text-gm-gold/50" />
                      <span className="font-serif italic text-lg text-gm-muted">{t('table.empty')}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} className="border-gm-border-soft hover:bg-gm-primary/[0.03] transition-colors group">
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gm-gold/10 flex items-center justify-center text-gm-gold shadow-inner border border-gm-gold/20">
                          <Receipt size={16} />
                        </div>
                        <span className="font-mono text-[11px] font-bold tracking-widest text-gm-gold opacity-80">{order.order_number}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gm-surface border border-gm-border-soft flex items-center justify-center text-gm-muted/60 group-hover:border-gm-gold/50 transition-all shadow-inner">
                          <User size={16} />
                        </div>
                        <div>
                          <div className="font-serif text-lg text-gm-text group-hover:text-gm-primary transition-colors">{order.user_name || t('table.unknownUser', null, '-')}</div>
                          <div className="text-[10px] text-gm-muted font-mono opacity-50 tracking-tighter">{order.user_email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <span className="font-serif text-lg text-gm-text font-bold">{fmtMoney(order.total_amount, order.currency)}</span>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] transition-all",
                        order.status === 'completed' ? 'bg-gm-success/10 text-gm-success border border-gm-success/20' :
                        order.status === 'cancelled' || order.status === 'refunded' ? 'bg-gm-error/10 text-gm-error border border-gm-error/20' :
                        'bg-gm-warning/10 text-gm-warning border border-gm-warning/20'
                      )}>
                        <div className={cn(
                          "w-1 h-1 rounded-full",
                          order.status === 'completed' ? 'bg-gm-success' :
                          order.status === 'cancelled' || order.status === 'refunded' ? 'bg-gm-error' :
                          'bg-gm-warning'
                        )} />
                        {order.status.toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] border transition-all",
                        order.payment_status === 'paid' ? 'bg-gm-success/5 border-gm-success/20 text-gm-success' :
                        order.payment_status === 'failed' ? 'bg-gm-error/5 border-gm-error/20 text-gm-error' :
                        'bg-gm-surface/40 border-gm-border-soft text-gm-muted'
                      )}>
                        <CreditCard size={10} className="opacity-60" />
                        {order.payment_status.toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <div className="text-[10px] text-gm-muted font-mono flex items-center justify-center gap-2 tracking-tighter opacity-70">
                        <Calendar size={12} className="text-gm-gold/60" />
                        {order.created_at ? format(new Date(order.created_at), 'dd.MM.yyyy HH:mm') : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <Button asChild variant="ghost" size="icon" className="rounded-full hover:bg-gm-gold/10 hover:text-gm-gold transition-all opacity-20 group-hover:opacity-100">
                        <Link href={`/admin/orders/${order.id}`}>
                          <Eye className="size-5" />
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-8">
        <div className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase bg-gm-surface/30 px-6 py-3 rounded-full border border-gm-border-soft">
          {t('pagination.info', { page, total })}
        </div>

        <div className="flex gap-4">
          <Button
            variant="ghost"
            disabled={!hasPrev || q.isFetching}
            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="rounded-full px-8 h-12 hover:bg-gm-gold/10 hover:text-gm-gold transition-all font-bold tracking-widest uppercase text-[10px] border border-transparent hover:border-gm-gold/20 disabled:opacity-30"
          >
            <ChevronLeft className="mr-2 size-4" />
            {t('pagination.prev')}
          </Button>
          <Button
            variant="ghost"
            disabled={!hasNext || q.isFetching}
            onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="rounded-full px-8 h-12 hover:bg-gm-gold/10 hover:text-gm-gold transition-all font-bold tracking-widest uppercase text-[10px] border border-transparent hover:border-gm-gold/20 disabled:opacity-30"
          >
            {t('pagination.next')}
            <ChevronRight className="ml-2 size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
