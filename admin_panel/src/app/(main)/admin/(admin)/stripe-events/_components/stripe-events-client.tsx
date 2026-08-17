'use client';
// =============================================================
// FILE: admin/(admin)/stripe-events/_components/stripe-events-client.tsx
//
// Stripe'tan gelen ödeme olayları — tutar, müşteri, sipariş eşleşmesi.
//
// NEDEN VAR: ödemeler bugüne kadar YALNIZ Stripe panelinde görünüyordu; admin
// "para geldi mi, hangi siparişe yazıldı" sorusunu siteden yanıtlayamıyordu
// (2026-08-16 finans incelemesi). Ham webhook gövdesi gösterilmez, işe yarayan
// alanlar backend'de ayrıştırılır.
//
// "İşlendi" sütunu kritik: olay geldi ama processed_at boşsa ödeme siparişe
// BAĞLANMAMIŞ demektir — sessiz kaybı burada yakalarız.
// =============================================================

import * as React from 'react';
import { RefreshCcw, CreditCard, CheckCircle2, AlertTriangle } from 'lucide-react';

import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import { useListStripeEventsAdminQuery } from '@/integrations/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function formatMoney(amount: number | null, currency: string | null, locale: string) {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  } catch {
    return `${amount} ${currency ?? ''}`.trim();
  }
}

// Stripe olay adları ham anahtar olarak görünüyordu ("checkout.session.completed").
// Admin'in okuyabileceği karşılıkları burada; bilinmeyen tip ham haliyle kalır
// (yeni bir olay tipi geldiğinde gizlenmesin, görünsün).
const EVENT_LABEL_KEYS: Record<string, { key: string; tr: string; en: string; de: string }> = {
  'checkout.session.completed': {
    key: 'event.checkoutCompleted',
    tr: 'Ödeme tamamlandı',
    en: 'Payment completed',
    de: 'Zahlung abgeschlossen',
  },
  'charge.refunded': { key: 'event.refunded', tr: 'İade edildi', en: 'Refunded', de: 'Erstattet' },
  'charge.dispute.created': {
    key: 'event.dispute',
    tr: 'İtiraz açıldı',
    en: 'Dispute opened',
    de: 'Zahlungsstreit eröffnet',
  },
  'payment_intent.succeeded': {
    key: 'event.paymentSucceeded',
    tr: 'Tahsilat başarılı',
    en: 'Payment succeeded',
    de: 'Zahlung erfolgreich',
  },
  'payment_intent.payment_failed': {
    key: 'event.paymentFailed',
    tr: 'Tahsilat başarısız',
    en: 'Payment failed',
    de: 'Zahlung fehlgeschlagen',
  },
};

const STATUS_LABELS: Record<string, { tr: string; en: string; de: string }> = {
  paid: { tr: 'Ödendi', en: 'Paid', de: 'Bezahlt' },
  unpaid: { tr: 'Ödenmedi', en: 'Unpaid', de: 'Unbezahlt' },
  no_payment_required: { tr: 'Ödeme gerekmiyor', en: 'No payment required', de: 'Keine Zahlung nötig' },
  succeeded: { tr: 'Başarılı', en: 'Succeeded', de: 'Erfolgreich' },
  complete: { tr: 'Tamamlandı', en: 'Complete', de: 'Abgeschlossen' },
};

function formatDate(value: string | null, locale: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

export default function StripeEventsClient() {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);
  const locale = adminLocale || 'tr';
  const b = (key: string, fallback: string) => t(`admin.stripeEvents.${key}` as any, null, fallback);

  const lang = (locale === 'en' || locale === 'de' ? locale : 'tr') as 'tr' | 'en' | 'de';
  const eventLabel = (type: string) => {
    const entry = EVENT_LABEL_KEYS[type];
    return entry ? b(entry.key, entry[lang]) : type;
  };
  const statusLabel = (value: string) => {
    const entry = STATUS_LABELS[value];
    return entry ? entry[lang] : value;
  };

  const [page, setPage] = React.useState(1);
  const limit = 50;
  const { data, isFetching, refetch } = useListStripeEventsAdminQuery({ page, limit });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const paidSum = rows
    .filter((r) => r.type === 'checkout.session.completed' && r.amount != null)
    .reduce((acc, r) => acc + Number(r.amount ?? 0), 0);
  const unprocessed = rows.filter((r) => !r.processed_at).length;

  return (
    <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
      <CardHeader className="bg-gm-surface/40 p-8 border-b border-gm-border-soft gap-4">
        <div className="flex items-start justify-between gap-6">
          <div>
            <CardTitle className="font-serif text-2xl text-gm-text flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-gm-gold" />
              {b('title', 'Stripe Ödemeleri')}
            </CardTitle>
            <CardDescription className="text-gm-muted font-serif italic opacity-80">
              {b('desc', 'Stripe’tan gelen ödeme olayları. “İşlendi” boşsa ödeme siparişe bağlanmamıştır.')}
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

        <div className="flex flex-wrap gap-3 pt-2">
          <span className="rounded-full border border-gm-border-soft px-4 py-1.5 text-xs text-gm-muted">
            {b('statTotal', 'Kayıt')}: <strong className="text-gm-text">{total}</strong>
          </span>
          <span className="rounded-full border border-gm-border-soft px-4 py-1.5 text-xs text-gm-muted">
            {b('statPageSum', 'Bu sayfadaki tahsilat')}:{' '}
            <strong className="text-gm-text">{formatMoney(paidSum, rows[0]?.currency ?? null, locale)}</strong>
          </span>
          {unprocessed > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-4 py-1.5 text-xs text-amber-500">
              <AlertTriangle className="w-3.5 h-3.5" />
              {b('statUnprocessed', 'İşlenmemiş')}: <strong>{unprocessed}</strong>
            </span>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-gm-surface/40">
            <TableRow className="border-gm-border-soft hover:bg-transparent">
              <TableHead className="px-7 py-5 text-[10px] uppercase tracking-widest text-gm-muted">
                {b('colDate', 'Tarih')}
              </TableHead>
              <TableHead className="py-5 text-[10px] uppercase tracking-widest text-gm-muted">
                {b('colType', 'Olay')}
              </TableHead>
              <TableHead className="py-5 text-[10px] uppercase tracking-widest text-gm-muted">
                {b('colCustomer', 'Müşteri')}
              </TableHead>
              <TableHead className="py-5 text-[10px] uppercase tracking-widest text-gm-muted text-right">
                {b('colAmount', 'Tutar')}
              </TableHead>
              <TableHead className="py-5 text-[10px] uppercase tracking-widest text-gm-muted">
                {b('colOrder', 'Sipariş')}
              </TableHead>
              <TableHead className="px-7 py-5 text-[10px] uppercase tracking-widest text-gm-muted">
                {b('colProcessed', 'İşlendi')}
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
                  {b('empty', 'Henüz Stripe ödeme olayı yok.')}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} className="border-gm-border-soft hover:bg-gm-surface/40">
                  <TableCell className="px-7 py-4 text-xs text-gm-muted whitespace-nowrap">
                    {formatDate(row.created_at, locale)}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-gm-text">{eventLabel(row.type)}</span>
                      <code className="text-[10px] text-gm-muted">{row.type}</code>
                      {row.payment_status ? (
                        <span className="text-[10px] text-gm-muted">{statusLabel(row.payment_status)}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-sm text-gm-text">
                    <div>{row.customer_name || '—'}</div>
                    <div className="text-[11px] text-gm-muted">{row.customer_email || ''}</div>
                  </TableCell>
                  <TableCell className="py-4 text-right font-medium text-gm-text whitespace-nowrap">
                    {formatMoney(row.amount, row.currency, locale)}
                  </TableCell>
                  <TableCell className="py-4 text-[11px] text-gm-muted">
                    {row.order_id ? (
                      <code className="break-all">{row.order_id}</code>
                    ) : (
                      <span className="italic">{b('noOrder', 'bağlı değil')}</span>
                    )}
                  </TableCell>
                  <TableCell className="px-7 py-4">
                    {row.processed_at ? (
                      <Badge className="bg-emerald-500/15 text-emerald-500">
                        <CheckCircle2 className="mr-1 w-3 h-3" />
                        {formatDate(row.processed_at, locale)}
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/15 text-amber-500">
                        <AlertTriangle className="mr-1 w-3 h-3" />
                        {b('notProcessed', 'işlenmedi')}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-gm-border-soft px-7 py-4">
            <span className="text-xs text-gm-muted">
              {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-2xl border-gm-border-soft"
              >
                {t('admin.common.previous', null, 'Önceki')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-2xl border-gm-border-soft"
              >
                {t('admin.common.next', null, 'Sonraki')}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
