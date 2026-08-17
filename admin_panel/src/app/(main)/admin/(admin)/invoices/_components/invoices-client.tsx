'use client';
// =============================================================
// FILE: admin/(admin)/invoices/_components/invoices-client.tsx
//
// Satış faturaları listesi — indir + yeniden gönder.
//
// PDF indirme doğrudan API'den (aynı origin değil) yapıldığı için oturum
// çerezi/başlığı gerekiyor: fetch ile blob alınıp indiriliyor, <a href> ile
// değil. Aksi halde tarayıcı yetkisiz istek atıp 401 alırdı.
// =============================================================
import * as React from 'react';
import { RefreshCcw, FileText, Download, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import { useListInvoicesAdminQuery, useResendInvoiceAdminMutation } from '@/integrations/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

function money(amount: string | number, currency: string, locale: string) {
  const n = Number(amount);
  try {
    return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : locale === 'en' ? 'en-US' : 'tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
    }).format(Number.isFinite(n) ? n : 0);
  } catch {
    return `${amount} ${currency}`;
  }
}

export default function InvoicesClient() {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);
  const locale = adminLocale || 'tr';
  const b = (key: string, fallback: string) => t(`invoices.${key}` as any, null, fallback);

  const [q, setQ] = React.useState('');
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const { data, isFetching, refetch } = useListInvoicesAdminQuery({ limit: 50, q: q || undefined });
  const [resend] = useResendInvoiceAdminMutation();

  const rows = data?.data ?? [];

  const download = async (id: string, number: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`${API_BASE}/admin/invoices/${encodeURIComponent(id)}/pdf`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('download_failed');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${number}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error(b('downloadError', 'Fatura indirilemedi.'));
    } finally {
      setBusyId(null);
    }
  };

  const doResend = async (id: string) => {
    setBusyId(id);
    try {
      await resend(id).unwrap();
      toast.success(b('resent', 'Fatura tekrar gönderildi.'));
    } catch {
      toast.error(b('resendError', 'Fatura gönderilemedi.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
      <CardHeader className="bg-gm-surface/40 p-8 border-b border-gm-border-soft gap-4">
        <div className="flex items-start justify-between gap-6">
          <div>
            <CardTitle className="font-serif text-2xl text-gm-text flex items-center gap-3">
              <FileText className="w-6 h-6 text-gm-gold" />
              {b('title', 'Faturalar')}
            </CardTitle>
            <CardDescription className="text-gm-muted font-serif italic opacity-80">
              {b('desc', 'Müşteriye kesilen satış faturaları (§19 UStG — KDV gösterilmez).')}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="shrink-0 rounded-2xl border-gm-border-soft text-gm-muted hover:text-gm-text"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            {t('admin.common.refresh', null, 'Yenile')}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={b('search', 'Fatura no / müşteri ara')}
            className="h-11 max-w-xs rounded-2xl border-gm-border-soft bg-gm-bg-deep"
          />
          <span className="rounded-full border border-gm-border-soft px-4 py-1.5 text-xs text-gm-muted">
            {b('count', 'Adet')}: <strong className="text-gm-text">{data?.total ?? 0}</strong>
          </span>
          <span className="rounded-full border border-gm-border-soft px-4 py-1.5 text-xs text-gm-muted">
            {b('sum', 'Toplam')}:{' '}
            <strong className="text-gm-text">
              {money(data?.totals?.amount ?? 0, rows[0]?.currency ?? 'TRY', locale)}
            </strong>
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-gm-surface/40">
            <TableRow className="border-gm-border-soft hover:bg-transparent">
              <TableHead className="px-7 py-5 text-[10px] uppercase tracking-widest text-gm-muted">
                {b('colNumber', 'Fatura No')}
              </TableHead>
              <TableHead className="py-5 text-[10px] uppercase tracking-widest text-gm-muted">
                {b('colCustomer', 'Müşteri')}
              </TableHead>
              <TableHead className="py-5 text-[10px] uppercase tracking-widest text-gm-muted">
                {b('colDesc', 'Açıklama')}
              </TableHead>
              <TableHead className="py-5 text-right text-[10px] uppercase tracking-widest text-gm-muted">
                {b('colAmount', 'Tutar')}
              </TableHead>
              <TableHead className="py-5 text-[10px] uppercase tracking-widest text-gm-muted">
                {b('colDate', 'Tarih')}
              </TableHead>
              <TableHead className="px-7 py-5 text-right text-[10px] uppercase tracking-widest text-gm-muted">
                {b('colActions', 'İşlem')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-20 text-center text-sm italic text-gm-muted">
                  {t('admin.common.loading', null, 'Yükleniyor…')}
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-24 text-center text-sm italic text-gm-muted">
                  {b('empty', 'Henüz fatura kesilmedi.')}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} className="border-gm-border-soft hover:bg-gm-surface/40">
                  <TableCell className="px-7 py-4">
                    <code className="text-sm text-gm-text">{row.invoice_number}</code>
                  </TableCell>
                  <TableCell className="py-4 text-sm text-gm-text">
                    <div>{row.customer_name}</div>
                    <div className="text-[11px] text-gm-muted">{row.customer_email || ''}</div>
                  </TableCell>
                  <TableCell className="py-4 text-xs text-gm-muted max-w-xs truncate">{row.description}</TableCell>
                  <TableCell className="py-4 text-right font-medium text-gm-text whitespace-nowrap">
                    {money(row.amount, row.currency, locale)}
                  </TableCell>
                  <TableCell className="py-4 text-xs text-gm-muted whitespace-nowrap">
                    {String(row.issued_at).slice(0, 10)}
                    {row.emailed_at ? (
                      <div className="text-[10px] text-emerald-500">{b('sent', 'gönderildi')}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="px-7 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyId === row.id}
                        onClick={() => download(row.id, row.invoice_number)}
                        className="rounded-2xl border-gm-border-soft"
                      >
                        {busyId === row.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyId === row.id || !row.customer_email}
                        onClick={() => doResend(row.id)}
                        className="rounded-2xl border-gm-border-soft"
                        title={b('resend', 'Tekrar gönder')}
                      >
                        <Send className="w-4 h-4" />
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
  );
}
