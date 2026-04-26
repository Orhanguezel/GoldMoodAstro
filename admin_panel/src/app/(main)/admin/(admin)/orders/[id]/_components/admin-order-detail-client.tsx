'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';

import type { OrderStatus, PaymentStatus } from '@/integrations/shared';
import { useGetOrderAdminQuery, useUpdateOrderAdminMutation, useRefundOrderAdminMutation } from '@/integrations/hooks';

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

function errMsg(err: unknown, fallback: string) {
  const e = err as any;
  return e?.data?.error || e?.data?.message || e?.error || e?.message || fallback;
}

const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'completed', 'cancelled', 'refunded'];
const PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'paid', 'failed', 'refunded'];

export default function AdminOrderDetailClient() {
  const t = useAdminT('admin.orders');
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const { data: order, isLoading, isError } = useGetOrderAdminQuery({ id: orderId }, { skip: !orderId });
  const [updateOrder, updateState] = useUpdateOrderAdminMutation();
  const [refundOrder, refundState] = useRefundOrderAdminMutation();

  const [editStatus, setEditStatus] = React.useState<OrderStatus | ''>('');
  const [editPayment, setEditPayment] = React.useState<PaymentStatus | ''>('');
  const [editNote, setEditNote] = React.useState('');
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    if (order) {
      setEditStatus(order.status);
      setEditPayment(order.payment_status);
      setEditNote(order.order_notes ?? '');
      setDirty(false);
    }
  }, [order]);

  async function onSave() {
    if (!order) return;
    const body: Record<string, unknown> = {};
    if (editStatus && editStatus !== order.status) body.status = editStatus;
    if (editPayment && editPayment !== order.payment_status) body.payment_status = editPayment;
    if (editNote !== (order.order_notes ?? '')) body.admin_note = editNote || null;

    if (Object.keys(body).length === 0) {
      toast.info(t('messages.noChanges', {}, 'Degisiklik yok'));
      return;
    }

    try {
      await updateOrder({ id: orderId, body: body as any }).unwrap();
      toast.success(t('messages.updated', {}, 'Siparis guncellendi'));
      setDirty(false);
    } catch (e) {
      toast.error(errMsg(e, t('messages.updateFailed', {}, 'Guncelleme basarisiz')));
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        {t('detail.loading', {}, 'Yukleniyor...')}
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-muted-foreground">{t('detail.notFound', {}, 'Siparis bulunamadi')}</p>
        <Button variant="outline" onClick={() => router.push('/admin/orders')}>
          <ArrowLeft className="mr-2 size-4" />
          {t('actions.back', {}, 'Geri')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/orders')}>
          <ArrowLeft className="mr-2 size-4" />
          {t('actions.back', {}, 'Geri')}
        </Button>
        <div>
          <h1 className="text-lg font-semibold">
            {t('detail.title', {}, 'Siparis Detayi')} — {order.order_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            {order.user_name || order.user_email || order.user_id}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('detail.info', {}, 'Siparis Bilgileri')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('detail.orderNumber', {}, 'Siparis No')}</span>
              <span className="font-mono">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('detail.total', {}, 'Toplam')}</span>
              <span className="font-semibold">{fmtMoney(order.total_amount, order.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('detail.txId', {}, 'Transaction ID')}</span>
              <span className="font-mono text-xs">{order.transaction_id || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('detail.createdAt', {}, 'Olusturulma')}</span>
              <span>{fmtDate(order.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('detail.updatedAt', {}, 'Guncelleme')}</span>
              <span>{fmtDate(order.updated_at)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Status Update */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('detail.statusUpdate', {}, 'Durum Guncelle')}</CardTitle>
            <CardDescription>
              {t('detail.statusDesc', {}, 'Siparis ve odeme durumunu degistirin')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('detail.orderStatus', {}, 'Siparis Durumu')}</Label>
              <Select
                value={editStatus}
                onValueChange={(v) => { setEditStatus(v as OrderStatus); setDirty(true); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('detail.paymentStatus', {}, 'Odeme Durumu')}</Label>
              <Select
                value={editPayment}
                onValueChange={(v) => { setEditPayment(v as PaymentStatus); setDirty(true); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('detail.adminNote', {}, 'Admin Notu')}</Label>
              <Textarea
                value={editNote}
                onChange={(e) => { setEditNote(e.target.value); setDirty(true); }}
                rows={3}
                placeholder={t('detail.adminNotePh', {}, 'Dahili not...')}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={onSave}
                disabled={!dirty || updateState.isLoading}
              >
                <Save className="mr-2 size-4" />
                {t('actions.save', {}, 'Kaydet')}
              </Button>

              {order.payment_status === 'paid' && order.status !== 'refunded' && (
                <Button
                  variant="destructive"
                  disabled={refundState.isLoading}
                  onClick={async () => {
                    const reason = window.prompt(t('detail.refundReason', {}, 'Iade nedeni (opsiyonel):')) || undefined;
                    try {
                      await refundOrder({ id: orderId, body: reason ? { reason } : {} }).unwrap();
                      toast.success(t('messages.refunded', {}, 'Siparis iade edildi'));
                    } catch (e) {
                      toast.error(errMsg(e, t('messages.refundFailed', {}, 'Iade basarisiz')));
                    }
                  }}
                >
                  <RotateCcw className="mr-2 size-4" />
                  {t('actions.refund', {}, 'Iade Et')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('detail.items', {}, 'Siparis Kalemleri')}
            <Badge variant="outline" className="ml-2">{order.items.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('detail.itemTitle', {}, 'Baslik')}</TableHead>
                  <TableHead>{t('detail.itemType', {}, 'Tip')}</TableHead>
                  <TableHead className="text-right">{t('detail.itemQty', {}, 'Adet')}</TableHead>
                  <TableHead className="text-right">{t('detail.itemPrice', {}, 'Fiyat')}</TableHead>
                  <TableHead className="text-right">{t('detail.itemTotal', {}, 'Toplam')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                      {t('detail.noItems', {}, 'Kalem bulunamadi')}
                    </TableCell>
                  </TableRow>
                ) : null}
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.item_type}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{fmtMoney(item.price, item.currency)}</TableCell>
                    <TableCell className="text-right">
                      {fmtMoney(Number(item.price) * item.quantity, item.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payments */}
      {order.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('detail.payments', {}, 'Odemeler')}
              <Badge variant="outline" className="ml-2">{order.payments.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('detail.payAmount', {}, 'Tutar')}</TableHead>
                    <TableHead>{t('detail.payStatus', {}, 'Durum')}</TableHead>
                    <TableHead>{t('detail.payTxId', {}, 'Transaction ID')}</TableHead>
                    <TableHead>{t('detail.payDate', {}, 'Tarih')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.payments.map((pay) => (
                    <TableRow key={pay.id}>
                      <TableCell>{fmtMoney(pay.amount, pay.currency)}</TableCell>
                      <TableCell>
                        <Badge variant={pay.status === 'success' ? 'secondary' : 'destructive'}>
                          {pay.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{pay.transaction_id || '-'}</TableCell>
                      <TableCell>{fmtDate(pay.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
