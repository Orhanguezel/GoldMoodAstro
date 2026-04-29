'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  RotateCcw, 
  Save, 
  Receipt, 
  User, 
  Calendar, 
  CreditCard, 
  Activity, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  Package,
  History
} from 'lucide-react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { cn } from '@/lib/utils';
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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import type { OrderStatus, PaymentStatus } from '@/integrations/shared';
import { useGetOrderAdminQuery, useUpdateOrderAdminMutation, useRefundOrderAdminMutation } from '@/integrations/hooks';

function fmtMoney(v: string | number, currency: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return `${v} ${currency}`;
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency || 'TRY',
    minimumFractionDigits: 2,
  }).format(n);
}

function fmtDate(v: string | null | undefined) {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString('tr-TR');
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

  const { data: order, isLoading, isError, refetch } = useGetOrderAdminQuery({ id: orderId }, { skip: !orderId });
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
      toast.info(t('messages.noChanges'));
      return;
    }

    try {
      await updateOrder({ id: orderId, body: body as any }).unwrap();
      toast.success(t('messages.updated'));
      setDirty(false);
      refetch();
    } catch (e) {
      toast.error(errMsg(e, t('messages.updateFailed')));
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <Skeleton className="h-20 w-full rounded-[24px] bg-gm-surface/20" />
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-[32px] bg-gm-surface/20" />
          <Skeleton className="h-64 rounded-[32px] bg-gm-surface/20" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Button variant="ghost" onClick={() => router.push('/admin/orders')} className="rounded-full hover:bg-gm-surface transition-all">
          <ArrowLeft className="mr-2 size-4" />
          {t('admin.common.back', null, 'Geri')}
        </Button>
        <Card className="bg-gm-error/5 border-gm-error/20 rounded-[32px] p-12 text-center">
          <AlertCircle className="size-12 text-gm-error mx-auto mb-4 opacity-50" />
          <h2 className="font-serif text-2xl text-gm-error mb-2">{t('detail.notFound')}</h2>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/admin/orders')} 
              className="rounded-full -ml-3 hover:bg-gm-surface group transition-all"
            >
              <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            </Button>
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">
              {t('detail.title')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-4xl text-gm-text">
              {order.order_number}
            </h1>
            <Badge className={cn(
              "rounded-full px-4 py-1 text-[10px] font-bold tracking-widest uppercase border",
              order.status === 'completed' ? "bg-gm-success/10 text-gm-success border-gm-success/20" : "bg-gm-warning/10 text-gm-warning border-gm-warning/20"
            )}>
              {order.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-gm-muted text-sm font-serif italic opacity-70">
            {order.user_name || order.user_email || order.user_id}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {order.payment_status === 'paid' && order.status !== 'refunded' && (
            <Button
              variant="outline"
              disabled={refundState.isLoading}
              onClick={async () => {
                const reason = window.prompt(t('detail.refundReason')) || undefined;
                try {
                  await refundOrder({ id: orderId, body: reason ? { reason } : {} }).unwrap();
                  toast.success(t('messages.refunded'));
                  refetch();
                } catch (e) {
                  toast.error(errMsg(e, t('messages.refundFailed')));
                }
              }}
              className="rounded-full border-gm-error/20 text-gm-error hover:bg-gm-error hover:text-white px-8 h-12 font-bold tracking-widest uppercase text-[10px] transition-all"
            >
              <RotateCcw className="mr-2 size-4" />
              {t('admin.common.refund', null, 'İade Et')}
            </Button>
          )}
          <Button 
            onClick={onSave} 
            disabled={!dirty || updateState.isLoading}
            className="rounded-full bg-gm-gold text-gm-bg hover:bg-gm-gold-dim px-10 h-12 font-bold tracking-widest uppercase text-[10px] shadow-lg shadow-gm-gold/20 transition-all active:scale-95"
          >
            <Save className="mr-2 size-4" />
            {updateState.isLoading ? t('admin.common.saving') : t('admin.common.save')}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Order Details Info */}
        <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
          <CardHeader className="p-8 pb-4 bg-gm-surface/40 border-b border-gm-border-soft">
            <CardTitle className="font-serif text-2xl flex items-center gap-3">
              <Receipt className="h-5 w-5 text-gm-gold" /> {t('detail.info')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gm-border-soft">
              <span className="text-[10px] font-bold text-gm-muted tracking-[0.1em] uppercase">{t('detail.orderNumber')}</span>
              <span className="font-mono text-gm-gold font-bold">{order.order_number}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gm-border-soft">
              <span className="text-[10px] font-bold text-gm-muted tracking-[0.1em] uppercase">{t('detail.total')}</span>
              <span className="font-serif text-xl text-gm-text font-bold">{fmtMoney(order.total_amount, order.currency)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gm-border-soft">
              <span className="text-[10px] font-bold text-gm-muted tracking-[0.1em] uppercase">{t('detail.txId')}</span>
              <span className="font-mono text-xs text-gm-muted truncate max-w-[200px]">{order.transaction_id || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gm-border-soft">
              <span className="text-[10px] font-bold text-gm-muted tracking-[0.1em] uppercase">{t('detail.createdAt')}</span>
              <div className="flex items-center gap-2 font-serif text-sm text-gm-text">
                <Calendar className="size-3 text-gm-gold opacity-60" />
                {fmtDate(order.created_at)}
              </div>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-[10px] font-bold text-gm-muted tracking-[0.1em] uppercase">{t('detail.updatedAt')}</span>
              <div className="flex items-center gap-2 font-serif text-sm text-gm-text">
                <History className="size-3 text-gm-gold opacity-60" />
                {fmtDate(order.updated_at)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Management */}
        <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
          <CardHeader className="p-8 pb-4 bg-gm-surface/40 border-b border-gm-border-soft">
            <CardTitle className="font-serif text-2xl flex items-center gap-3">
              <Activity className="h-5 w-5 text-gm-gold" /> {t('detail.statusUpdate')}
            </CardTitle>
            <CardDescription className="font-serif italic text-gm-muted opacity-70">
              {t('detail.statusDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('detail.orderStatus')}</Label>
                <Select
                  value={editStatus}
                  onValueChange={(v) => { setEditStatus(v as OrderStatus); setDirty(true); }}
                >
                  <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl">
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('detail.paymentStatus')}</Label>
                <Select
                  value={editPayment}
                  onValueChange={(v) => { setEditPayment(v as PaymentStatus); setDirty(true); }}
                >
                  <SelectTrigger className="bg-gm-surface/40 border-gm-border-soft rounded-2xl h-12 focus:ring-gm-gold/50 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gm-bg-deep border-gm-border-soft rounded-2xl">
                    {PAYMENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">{t('detail.adminNote')}</Label>
              <Textarea
                value={editNote}
                onChange={(e) => { setEditNote(e.target.value); setDirty(true); }}
                rows={4}
                placeholder={t('detail.adminNotePh')}
                className="bg-gm-surface/40 border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 text-sm font-serif italic"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items Table */}
      <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
        <CardHeader className="p-8 pb-4 bg-gm-surface/40 border-b border-gm-border-soft">
          <CardTitle className="font-serif text-2xl flex items-center gap-3">
            <Package className="h-5 w-5 text-gm-gold" /> {t('detail.items')}
            <Badge variant="outline" className="ml-2 rounded-full border-gm-gold/30 text-gm-gold bg-gm-gold/5">{order.items.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gm-surface/40">
              <TableRow className="border-gm-border-soft hover:bg-transparent">
                <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('detail.itemTitle')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('detail.itemType')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-center text-gm-muted">{t('detail.itemQty')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-right text-gm-muted">{t('detail.itemPrice')}</TableHead>
                <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('detail.itemTotal')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-gm-muted font-serif italic opacity-50">
                    {t('detail.noItems')}
                  </TableCell>
                </TableRow>
              ) : (
                order.items.map((item) => (
                  <TableRow key={item.id} className="border-gm-border-soft hover:bg-gm-primary/[0.03] transition-colors group">
                    <TableCell className="py-6 px-8 font-serif text-lg text-gm-text">{item.title}</TableCell>
                    <TableCell className="py-6">
                      <Badge variant="outline" className="rounded-full text-[9px] font-bold tracking-widest uppercase border-gm-border-soft text-gm-muted">
                        {item.item_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6 text-center font-mono text-sm">{item.quantity}</TableCell>
                    <TableCell className="py-6 text-right font-mono text-sm">{fmtMoney(item.price, item.currency)}</TableCell>
                    <TableCell className="py-6 px-8 text-right font-serif text-lg text-gm-gold font-bold">
                      {fmtMoney(Number(item.price) * item.quantity, item.currency)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transaction History / Payments */}
      {order.payments.length > 0 && (
        <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
          <CardHeader className="p-8 pb-4 bg-gm-surface/40 border-b border-gm-border-soft">
            <CardTitle className="font-serif text-2xl flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-gm-gold" /> {t('detail.payments')}
              <Badge variant="outline" className="ml-2 rounded-full border-gm-gold/30 text-gm-gold bg-gm-gold/5">{order.payments.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gm-surface/40">
                <TableRow className="border-gm-border-soft hover:bg-transparent">
                  <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('detail.payAmount')}</TableHead>
                  <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('detail.payStatus')}</TableHead>
                  <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('detail.payTxId')}</TableHead>
                  <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('detail.payDate')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.payments.map((pay) => (
                  <TableRow key={pay.id} className="border-gm-border-soft hover:bg-gm-primary/[0.03] transition-colors group">
                    <TableCell className="py-6 px-8 font-serif text-lg text-gm-text font-bold">{fmtMoney(pay.amount, pay.currency)}</TableCell>
                    <TableCell className="py-6">
                      <Badge className={cn(
                        "rounded-full text-[9px] font-bold tracking-widest uppercase border",
                        pay.status === 'success' ? "bg-gm-success/10 text-gm-success border-gm-success/20" : "bg-gm-error/10 text-gm-error border-gm-error/20"
                      )}>
                        {pay.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6 font-mono text-xs text-gm-muted/60">{pay.transaction_id || '-'}</TableCell>
                    <TableCell className="py-6 px-8 text-right text-[10px] text-gm-muted font-mono">{fmtDate(pay.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
