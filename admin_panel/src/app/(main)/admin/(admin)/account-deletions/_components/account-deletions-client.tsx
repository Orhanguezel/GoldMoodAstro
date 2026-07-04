'use client';

import * as React from 'react';
import { AlertTriangle, CalendarClock, RefreshCcw, Search, ShieldAlert, Trash2, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { AccountDeletionRequestAdmin, AccountDeletionRequestStatus } from '@/integrations/shared';
import { useListAccountDeletionRequestsAdminQuery } from '@/integrations/hooks';

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function remainingText(row: AccountDeletionRequestAdmin) {
  if (row.status !== 'pending') return '-';
  const seconds = Number(row.seconds_until_deletion ?? 0);
  if (!Number.isFinite(seconds)) return '-';
  if (seconds <= 0) return 'Süre doldu';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}g ${hours}s`;
  return `${Math.max(1, hours)}s`;
}

function statusBadge(status: AccountDeletionRequestStatus) {
  const classes = {
    pending: 'border-gm-warning/30 bg-gm-warning/10 text-gm-warning',
    cancelled: 'border-gm-muted/30 bg-gm-muted/10 text-gm-muted',
    completed: 'border-gm-success/30 bg-gm-success/10 text-gm-success',
  } satisfies Record<AccountDeletionRequestStatus, string>;
  const labels = {
    pending: 'Beklemede',
    cancelled: 'İptal',
    completed: 'Tamamlandı',
  } satisfies Record<AccountDeletionRequestStatus, string>;
  return <Badge variant="outline" className={cn('rounded-full px-3 py-1 text-[10px] uppercase tracking-widest', classes[status])}>{labels[status]}</Badge>;
}

export default function AccountDeletionsClient() {
  const [status, setStatus] = React.useState<AccountDeletionRequestStatus>('pending');
  const [search, setSearch] = React.useState('');
  const query = useListAccountDeletionRequestsAdminQuery({ status, limit: 100, offset: 0 });

  const rows = React.useMemo(() => {
    const data = query.data?.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) =>
      row.user_email?.toLowerCase().includes(q) ||
      row.user_full_name?.toLowerCase().includes(q) ||
      row.user_id.toLowerCase().includes(q) ||
      row.reason?.toLowerCase().includes(q)
    );
  }, [query.data?.data, search]);

  const pendingCount = rows.filter((row) => row.status === 'pending').length;
  const expiredCount = rows.filter((row) => row.status === 'pending' && Number(row.seconds_until_deletion ?? 1) <= 0).length;

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">KVKK</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">Hesap Silme Talepleri</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted/50 group-focus-within:text-gm-gold transition-colors" />
            <Input
              placeholder="E-posta, kullanıcı veya gerekçe ara"
              className="pl-12 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={status} onValueChange={(value) => setStatus(value as AccountDeletionRequestStatus)}>
            <SelectTrigger className="w-full sm:w-44 bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl">
              <SelectItem value="pending">Beklemede</SelectItem>
              <SelectItem value="cancelled">İptal</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            className="rounded-full border-gm-border-soft bg-gm-surface/50 px-8 h-12 text-[10px] font-bold tracking-widest uppercase"
          >
            <RefreshCcw className={cn('mr-2 size-4', query.isFetching && 'animate-spin')} />
            Yenile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="bg-gm-bg-deep/40 border-gm-border-soft rounded-[32px] p-8 relative overflow-hidden backdrop-blur-md shadow-xl">
          <Trash2 className="absolute -right-4 -top-4 size-28 text-gm-gold opacity-5" />
          <div className="relative z-10 space-y-4">
            <p className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase">Toplam Kayıt</p>
            <div className="text-5xl font-serif text-gm-text">{query.data?.meta.total ?? rows.length}</div>
          </div>
        </Card>
        <Card className="bg-gm-bg-deep/40 border-gm-border-soft rounded-[32px] p-8 relative overflow-hidden backdrop-blur-md shadow-xl">
          <CalendarClock className="absolute -right-4 -top-4 size-28 text-gm-warning opacity-5" />
          <div className="relative z-10 space-y-4">
            <p className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase">Bekleyen</p>
            <div className="text-5xl font-serif text-gm-warning">{pendingCount}</div>
          </div>
        </Card>
        <Card className="bg-gm-bg-deep/40 border-gm-border-soft rounded-[32px] p-8 relative overflow-hidden backdrop-blur-md shadow-xl">
          <ShieldAlert className="absolute -right-4 -top-4 size-28 text-gm-error opacity-5" />
          <div className="relative z-10 space-y-4">
            <p className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase">Süresi Dolan</p>
            <div className="text-5xl font-serif text-gm-error">{expiredCount}</div>
          </div>
        </Card>
      </div>

      <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gm-surface/40">
              <TableRow className="border-gm-border-soft hover:bg-transparent">
                <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Kullanıcı</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Durum</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Talep</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Silinme</TableHead>
                <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Gerekçe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="border-gm-border-soft">
                    <TableCell className="py-6 px-8"><Skeleton className="h-12 w-64 bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-7 w-24 rounded-full bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-5 w-36 bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-5 w-36 bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6 px-8"><Skeleton className="h-5 w-48 bg-gm-surface/20" /></TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-28 text-center">
                    <div className="flex flex-col items-center gap-5 opacity-40">
                      <AlertTriangle className="size-16 text-gm-gold" />
                      <span className="font-serif italic text-xl text-gm-muted">Kayıt bulunamadı</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.map((row) => (
                <TableRow key={row.id} className="border-gm-border-soft hover:bg-gm-primary/[0.03] transition-colors">
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      <div className="size-11 rounded-full bg-gm-surface border border-gm-border-soft flex items-center justify-center">
                        <UserRound className="size-5 text-gm-gold" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-serif text-lg text-gm-text">{row.user_full_name || row.user_email || 'Silinmiş kullanıcı'}</div>
                        <div className="text-[10px] font-mono text-gm-muted">{row.user_email || row.user_id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-6">{statusBadge(row.status)}</TableCell>
                  <TableCell className="py-6 text-xs text-gm-muted font-mono">{formatDate(row.requested_at)}</TableCell>
                  <TableCell className="py-6">
                    <div className="space-y-1">
                      <div className="text-xs text-gm-muted font-mono">{formatDate(row.scheduled_for)}</div>
                      <div className="text-[10px] text-gm-warning font-bold tracking-widest uppercase">{remainingText(row)}</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8 max-w-sm">
                    <div className="text-sm text-gm-muted line-clamp-2">{row.reason || '-'}</div>
                    {row.ip_address && <div className="mt-1 text-[10px] font-mono text-gm-muted/60">IP {row.ip_address}</div>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
