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
import {
  useListSubscriptionsAdminQuery,
  useRefundSubscriptionAdminMutation,
} from '@/integrations/hooks';
import type { AdminSubscriptionStatus } from '@/integrations/shared';

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

export default function AdminSubscriptionsClient() {
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
    const reason = window.prompt('Refund reason');
    if (reason === null) return;
    try {
      await refund({ id, body: { reason: reason.trim() } }).unwrap();
      toast.success('Subscription refunded/closed.');
    } catch {
      toast.error('Could not refund subscription.');
    }
  }

  function doSearch() {
    setSearch(searchInput.trim());
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">List and refund active subscriptions.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => list.refetch()} disabled={list.isFetching}>
          <RefreshCcw className={`mr-2 size-4 ${list.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span>Subscription List</span>
            <Badge variant="outline">{total}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Durum</Label>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value as StatusFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Search</Label>
              <div className="flex gap-2">
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                  placeholder="Email, plan code, status, subscription id"
                />
                <Button variant="outline" onClick={doSearch}>
                  <Search className="mr-2 size-4" />
                  Search
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Ends</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!list.isLoading && rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      No subscriptions found.
                    </TableCell>
                  </TableRow>
                ) : null}

                {rows.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{resolveUser(item)}</div>
                      <div className="text-xs text-muted-foreground">{item.user_phone || '-'}</div>
                    </TableCell>
                    <TableCell>{resolvePlanName(item)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.provider}</TableCell>
                    <TableCell>{moneyFromMinor(item.price_minor, item.currency)}</TableCell>
                    <TableCell>{fmtDate(item.started_at)}</TableCell>
                    <TableCell>{fmtDate(item.ends_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => doRefund(item.id)}
                        disabled={refundState.isLoading || item.status === 'cancelled'}
                      >
                        <Undo2 className="mr-2 size-4" />
                        Refund
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">Page {page} / {totalPages}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1 || list.isLoading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Prev
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages || list.isLoading} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

