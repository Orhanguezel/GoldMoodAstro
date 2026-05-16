'use client';

import * as React from 'react';
import { RefreshCcw, Search, Undo2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import type { TranslateFn } from '@/i18n';
import {
  useListSubscriptionsAdminQuery,
  useRefundSubscriptionAdminMutation,
} from '@/integrations/hooks';
import type { AdminSubscriptionStatus } from '@/integrations/shared';
import { cn } from '@/lib/utils';

type StatusFilter = AdminSubscriptionStatus | 'all';

const STATUSES: StatusFilter[] = ['all', 'pending', 'active', 'cancelled', 'expired', 'grace_period', 'past_due'];

function fmtDate(value: string | null | undefined) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('tr-TR');
}

function statusVariant(status: AdminSubscriptionStatus) {
  if (status === 'active') return 'default' as const;
  if (status === 'cancelled') return 'destructive' as const;
  return 'secondary' as const;
}

function moneyFromMinor(amount: number, currency: string) {
  const n = Number(amount || 0) / 100;
  if (!Number.isFinite(n)) return `${currency}`;
  return `${n.toFixed(2)} ${currency}`;
}

function resolvePlanName(item: { plan_name_tr: string | null; plan_name_en: string | null; plan_code: string | null }) {
  return item.plan_name_tr || item.plan_name_en || item.plan_code || '-';
}

function resolveUser(item: { user_full_name: string | null; user_email: string | null; user_id: string }) {
  return item.user_full_name || item.user_email || item.user_id;
}

function statusLabel(t: TranslateFn, status: StatusFilter) {
  return status === 'all' ? t('statuses.all') : t(`statuses.${status}` as string);
}

export default function AdminSubscriptionsClient() {
  const t = useAdminT('admin.subscriptions');
  const [status, setStatus] = React.useState<StatusFilter>('all');
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const list = useListSubscriptionsAdminQuery({
    limit,
    offset,
    status: status === 'all' ? undefined : status,
    q: search || undefined,
  });

  const [refund, refundState] = useRefundSubscriptionAdminMutation();

  const rows = list.data?.data ?? [];
  const total = list.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  async function doRefund(id: string) {
    const reason = window.prompt(t('actions.refundReasonPrompt'));
    if (reason === null) return;
    try {
      await refund({ id, body: { reason: reason.trim() } }).unwrap();
      toast.success(t('toasts.refundSuccess'));
    } catch {
      toast.error(t('toasts.refundFailed'));
    }
  }

  const busy = list.isFetching;

  function doSearch() {
    setSearch(searchInput.trim());
    setPage(1);
  }

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Outside Page Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">SİSTEM YÖNETİMİ</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">{t('title')}</h1>
          <p className="text-sm italic text-gm-muted">{t('description')}</p>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => list.refetch()}
            disabled={busy}
            className="h-12 rounded-full border-gm-border-soft bg-gm-surface/50 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface/80"
          >
            <RefreshCcw className={cn("mr-2 size-4 text-gm-gold", list.isFetching && "animate-spin")} />
            {t('actions.refresh')}
          </Button>
        </div>
      </div>

      {/* Main Glassmorphic Panel */}
      <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
        <CardHeader className="border-b border-gm-border-soft/50 pb-6 px-8 pt-8 flex flex-row items-center justify-between">
          <CardTitle className="font-serif text-xl text-gm-text flex items-center gap-3">
            {t('listTitle')}
            <Badge variant="outline" className="rounded-full border-gm-gold/30 text-gm-gold bg-gm-gold/5 text-[11px] font-mono px-2.5 py-0.5">
              {total}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-8">
          {/* Filters Bar */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted pl-1">{t('filters.status')}</Label>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value as StatusFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/30 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-gm-border-soft bg-gm-surface text-gm-text rounded-2xl">
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabel(t, s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted pl-1">{t('filters.search')}</Label>
              <div className="flex gap-2">
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                  placeholder={t('filters.searchPlaceholder')}
                  className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button 
                  variant="outline" 
                  onClick={doSearch}
                  className="h-11 rounded-full border-gm-border-soft bg-gm-surface/50 px-6 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface/80"
                >
                  <Search className="mr-2 size-4 text-gm-gold" />
                  {t('actions.search')}
                </Button>
              </div>
            </div>
          </div>

          {/* Table Wrap */}
          <div className="overflow-x-auto rounded-2xl border border-gm-border-soft/60 bg-gm-surface/10">
            <Table>
              <TableHeader className="bg-gm-surface/40">
                <TableRow className="border-gm-border-soft hover:bg-transparent">
                  <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.user')}</TableHead>
                  <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.plan')}</TableHead>
                  <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.status')}</TableHead>
                  <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.provider')}</TableHead>
                  <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.price')}</TableHead>
                  <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.started')}</TableHead>
                  <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.ends')}</TableHead>
                  <TableHead className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!list.isLoading && rows.length === 0 ? (
                  <TableRow className="border-gm-border-soft">
                    <TableCell colSpan={8} className="py-16 text-center text-sm text-gm-muted italic font-serif">
                      {t('table.noRecords')}
                    </TableCell>
                  </TableRow>
                ) : null}

                {rows.map((item) => (
                  <TableRow key={item.id} className="border-gm-border-soft hover:bg-gm-surface/40 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="font-bold text-gm-text">{resolveUser(item)}</div>
                      <div className="text-[11px] text-gm-muted/80 mt-1 font-light">{item.user_phone || '-'}</div>
                    </TableCell>
                    <TableCell className="py-4 font-medium text-gm-text">{resolvePlanName(item)}</TableCell>
                    <TableCell className="py-4">
                      <Badge variant={statusVariant(item.status)} className="rounded-full text-[9px] uppercase tracking-widest px-2.5 py-0.5">
                        {statusLabel(t, item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 font-mono text-xs text-gm-muted">{item.provider}</TableCell>
                    <TableCell className="py-4 font-bold text-gm-text">{moneyFromMinor(item.price_minor, item.currency)}</TableCell>
                    <TableCell className="py-4 text-xs text-gm-text-dim font-light">{fmtDate(item.started_at)}</TableCell>
                    <TableCell className="py-4 text-xs text-gm-text-dim font-light">{fmtDate(item.ends_at)}</TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => doRefund(item.id)}
                        disabled={refundState.isLoading || item.status === 'cancelled'}
                        className="h-9 rounded-full border-gm-error/30 text-gm-error bg-gm-error/5 hover:bg-gm-error hover:text-white transition-all text-xs font-semibold px-4"
                      >
                        <Undo2 className="mr-1.5 size-4" />
                        {t('actions.refund')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="text-xs text-gm-muted font-light italic">
              {t('pagination.page', { page, totalPages })}
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                disabled={page <= 1 || list.isLoading} 
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-10 rounded-full border-gm-border-soft bg-gm-surface/50 px-5 text-xs text-gm-text hover:bg-gm-surface/80"
              >
                {t('pagination.prev')}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                disabled={page >= totalPages || list.isLoading} 
                onClick={() => setPage((p) => p + 1)}
                className="h-10 rounded-full border-gm-border-soft bg-gm-surface/50 px-5 text-xs text-gm-text hover:bg-gm-surface/80"
              >
                {t('pagination.next')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
