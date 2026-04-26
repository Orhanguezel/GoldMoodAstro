'use client';

import * as React from 'react';
import Link from 'next/link';
import { Eye, RefreshCcw, Search } from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

import type { OrderStatus, PaymentStatus } from '@/integrations/shared';
import { useListOrdersAdminQuery } from '@/integrations/hooks';

function fmtMoney(v: string | number, currency: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return `${v} ${currency}`;
  try {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency || 'EUR',
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

function fmtDate(v: string | null | undefined) {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString('de-DE');
}

const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'completed', 'cancelled', 'refunded'];
const PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'paid', 'failed', 'refunded'];

function statusVariant(s: OrderStatus) {
  switch (s) {
    case 'completed': return 'secondary' as const;
    case 'cancelled':
    case 'refunded': return 'destructive' as const;
    case 'processing': return 'default' as const;
    default: return 'outline' as const;
  }
}

function paymentVariant(s: PaymentStatus) {
  switch (s) {
    case 'paid': return 'secondary' as const;
    case 'failed': return 'destructive' as const;
    case 'refunded': return 'default' as const;
    default: return 'outline' as const;
  }
}

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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{t('title', {}, 'Siparisler')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('description', {}, 'Siparis yonetimi ve odeme takibi')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('list.title', {}, 'Siparis Listesi')}
            {total > 0 && (
              <Badge variant="outline" className="ml-2">
                {total}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {t('list.desc', {}, 'Tum siparisler ve odeme durumlari')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <Label>{t('filters.status', {}, 'Durum')}</Label>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v as OrderStatus | 'all');
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.all', {}, 'Tumu')}</SelectItem>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('filters.paymentStatus', {}, 'Odeme Durumu')}</Label>
              <Select
                value={paymentStatus}
                onValueChange={(v) => {
                  setPaymentStatus(v as PaymentStatus | 'all');
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.all', {}, 'Tumu')}</SelectItem>
                  {PAYMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{t('filters.search', {}, 'Ara')}</Label>
              <div className="flex gap-2">
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t('filters.searchPh', {}, 'Siparis no veya e-posta')}
                  onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                />
                <Button variant="outline" onClick={doSearch}>
                  <Search className="mr-2 size-4" />
                  {t('actions.search', {}, 'Ara')}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={q.isFetching}
              onClick={() => q.refetch()}
            >
              <RefreshCcw className="mr-2 size-4" />
              {t('actions.refresh', {}, 'Yenile')}
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.orderNumber', {}, 'Siparis No')}</TableHead>
                  <TableHead>{t('table.customer', {}, 'Musteri')}</TableHead>
                  <TableHead>{t('table.total', {}, 'Toplam')}</TableHead>
                  <TableHead>{t('table.status', {}, 'Durum')}</TableHead>
                  <TableHead>{t('table.payment', {}, 'Odeme')}</TableHead>
                  <TableHead>{t('table.date', {}, 'Tarih')}</TableHead>
                  <TableHead className="text-right">{t('table.actions', {}, 'Islemler')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!q.isFetching && orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      {t('list.empty', {}, 'Siparis bulunamadi')}
                    </TableCell>
                  </TableRow>
                ) : null}

                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium">{order.user_name || '-'}</p>
                        <p className="text-xs text-muted-foreground">{order.user_email || order.user_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>{fmtMoney(order.total_amount, order.currency)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={paymentVariant(order.payment_status)}>{order.payment_status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{fmtDate(order.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Eye className="mr-2 size-4" />
                          {t('actions.detail', {}, 'Detay')}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrev || q.isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t('actions.prev', {}, 'Onceki')}
            </Button>
            <Badge variant="outline">{t('labels.page', { page }, `Sayfa ${page}`)}</Badge>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext || q.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('actions.next', {}, 'Sonraki')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
