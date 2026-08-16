'use client';

import * as React from 'react';
import { ExternalLink, Loader2, Mic, RefreshCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  useGetMediaMessageStatsAdminQuery,
  useListMediaMessagesAdminQuery,
} from '@/integrations/hooks';

function fmtDate(value: string | null | undefined) {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('tr-TR');
}

function statusClass(status: string) {
  if (status === 'answered') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600';
  if (status === 'sent') return 'border-amber-500/30 bg-amber-500/10 text-amber-600';
  if (status === 'expired' || status === 'refunded') return 'border-sky-500/30 bg-sky-500/10 text-sky-600';
  return 'border-slate-500/30 bg-slate-500/10 text-slate-500';
}

export default function AdminMediaMessagesClient() {
  const [status, setStatus] = React.useState('all');
  const listQ = useListMediaMessagesAdminQuery(status === 'all' ? undefined : { status });
  const statsQ = useGetMediaMessageStatsAdminQuery();
  const rows = listQ.data ?? [];
  const stats = statsQ.data;
  const busy = listQ.isFetching || statsQ.isFetching;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">İletişim & CRM</p>
          <h1 className="text-3xl font-semibold tracking-tight">Medya Mesajları</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="sent">Yanıt bekliyor</SelectItem>
              <SelectItem value="answered">Yanıtlandı</SelectItem>
              <SelectItem value="expired">Süresi doldu</SelectItem>
              <SelectItem value="refunded">İade edildi</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { listQ.refetch(); statsQ.refetch(); }}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Yenile
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Toplam', stats?.total ?? 0],
          ['Yanıtlandı', stats?.answered ?? 0],
          ['Bekleyen', stats?.waiting ?? 0],
          ['Yanıt oranı', `${stats?.response_rate ?? 0}%`],
        ].map(([label, value]) => (
          <Card key={String(label)} className="rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <Mic className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-2xl font-semibold">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Danışan</TableHead>
              <TableHead>Danışman</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Ücret</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">Dosya</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.customer_name || row.user_id}</TableCell>
                <TableCell>{row.consultant_name || row.consultant_id}</TableCell>
                <TableCell>{row.kind === 'video' ? 'Video' : 'Sesli'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusClass(row.status)}>{row.status}</Badge>
                </TableCell>
                <TableCell>₺{Number(row.price || 0).toFixed(2)}</TableCell>
                <TableCell>{fmtDate(row.created_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <a href={`/api/admin/media-messages/${row.id}/file`} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    {row.reply_id && (
                      <Button asChild size="sm" variant="outline">
                        <a href={`/api/admin/media-messages/${row.reply_id}/file`} target="_blank" rel="noreferrer">
                          Yanıt
                        </a>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Kayıt bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

