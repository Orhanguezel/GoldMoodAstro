'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Check,
  Eye,
  RefreshCcw,
  X,
  ShieldCheck,
  Users,
  FileText,
  Send,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  type ConsultantApplicationAdmin,
  useApproveConsultantAdminMutation,
  useApproveConsultantApplicationAdminMutation,
  useListConsultantApplicationsAdminQuery,
  useListConsultantsAdminQuery,
  useRejectConsultantAdminMutation,
  useRejectConsultantApplicationAdminMutation,
} from '@/integrations/hooks';

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('tr-TR');
}

function Chips({ items }: { items?: string[] | null }) {
  if (!items?.length) return <span className="text-gm-muted">-</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge
          key={item}
          variant="outline"
          className="rounded-full border-gm-border-soft bg-gm-surface text-[9px] uppercase tracking-widest text-gm-muted"
        >
          {item}
        </Badge>
      ))}
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-gm-muted">{label}</div>
      <div className="min-h-10 rounded-2xl border border-gm-border-soft bg-gm-surface/40 px-4 py-3 text-sm text-gm-text">
        {value || <span className="text-gm-muted">-</span>}
      </div>
    </div>
  );
}

export default function ConsultantsClient() {
  const t = useAdminT('admin.consultants');

  const [status, setStatus] = React.useState<string | undefined>();
  const isPending = status === 'pending';

  // Diğer tablar consultants tablosunu okur; "Bekleyenler" başvuru tablosunu (consultant_applications) okur.
  const consultantsQuery = useListConsultantsAdminQuery(
    status && !isPending ? { approval_status: status } : undefined,
    { skip: isPending },
  );
  // Başvuru sayacı rozeti için her zaman aktif (hafif liste).
  const appsQuery = useListConsultantApplicationsAdminQuery({ status: 'pending' });

  const [approve, approveState] = useApproveConsultantAdminMutation();
  const [reject, rejectState] = useRejectConsultantAdminMutation();
  const [approveApp, approveAppState] = useApproveConsultantApplicationAdminMutation();
  const [rejectApp, rejectAppState] = useRejectConsultantApplicationAdminMutation();

  const [selected, setSelected] = React.useState<ConsultantApplicationAdmin | null>(null);
  const [rejectTarget, setRejectTarget] = React.useState<ConsultantApplicationAdmin | null>(null);
  const [reason, setReason] = React.useState('');

  const pendingCount = appsQuery.data?.length ?? 0;

  const FILTERS = [
    { label: t('filters.all'), value: undefined as string | undefined, badge: 0 },
    { label: t('filters.pending'), value: 'pending', badge: pendingCount },
    { label: t('filters.approved'), value: 'approved', badge: 0 },
    { label: t('filters.rejected'), value: 'rejected', badge: 0 },
  ];

  function refetchActive() {
    if (isPending) appsQuery.refetch();
    else consultantsQuery.refetch();
  }

  async function approveConsultant(id: string) {
    try {
      await approve(id).unwrap();
      toast.success(t('actions.approve_success'));
      consultantsQuery.refetch();
    } catch {
      toast.error(t('actions.approve_failed'));
    }
  }

  async function rejectConsultant(id: string) {
    const r = window.prompt(t('actions.rejection_reason_prompt'));
    if (!r?.trim()) return;
    try {
      await reject({ id, rejection_reason: r.trim() }).unwrap();
      toast.success(t('actions.reject_success'));
      consultantsQuery.refetch();
    } catch {
      toast.error(t('actions.reject_failed'));
    }
  }

  async function handleApproveApp(item: ConsultantApplicationAdmin) {
    try {
      const updated = await approveApp(item.id).unwrap();
      toast.success('Başvuru onaylandı');
      setSelected(updated);
      appsQuery.refetch();
    } catch (error) {
      const message =
        (error as { data?: { error?: string } })?.data?.error === 'user_required_for_approval'
          ? 'Bu başvuruyu onaylamak için aynı e-postayla kayıtlı bir kullanıcı gerekiyor.'
          : 'Başvuru onaylanamadı';
      toast.error(message);
    }
  }

  async function handleRejectApp() {
    if (!rejectTarget) return;
    if (reason.trim().length < 10) {
      toast.error('Red sebebi en az 10 karakter olmalı');
      return;
    }
    try {
      const updated = await rejectApp({ id: rejectTarget.id, rejection_reason: reason.trim() }).unwrap();
      toast.success('Başvuru reddedildi');
      setSelected(updated);
      setRejectTarget(null);
      setReason('');
      appsQuery.refetch();
    } catch {
      toast.error('Başvuru reddedilemedi');
    }
  }

  const busy =
    consultantsQuery.isFetching ||
    appsQuery.isFetching ||
    approveState.isLoading ||
    rejectState.isLoading ||
    approveAppState.isLoading ||
    rejectAppState.isLoading;

  const isLoading = isPending ? appsQuery.isLoading : consultantsQuery.isLoading;
  const isEmpty = isPending
    ? (appsQuery.data?.length ?? 0) === 0
    : (consultantsQuery.data?.length ?? 0) === 0;

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-px bg-gm-gold" />
            <span className="text-gm-gold font-bold text-[10px] tracking-[0.2em] uppercase">
              {t('header.badge')}
            </span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">{t('header.title')}</h1>
          <p className="text-gm-muted text-sm font-serif italic opacity-70">
            {t('header.description')}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={refetchActive}
          disabled={busy}
          className="rounded-full border-gm-border-soft bg-gm-surface/50 px-8 h-12 text-[10px] font-bold tracking-widest uppercase transition-all hover:bg-gm-primary/5 shadow-lg backdrop-blur-sm"
        >
          <RefreshCcw className={cn('mr-2 size-4', busy && 'animate-spin')} />
          {t('admin.common.refresh', null, 'Yenile')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-gm-surface/20 rounded-full border border-gm-border-soft w-fit backdrop-blur-md shadow-inner">
        {FILTERS.map((item) => (
          <button
            key={item.label}
            onClick={() => setStatus(item.value)}
            className={cn(
              'px-8 py-2.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 inline-flex items-center gap-2',
              status === item.value
                ? 'bg-gm-gold text-gm-bg shadow-lg shadow-gm-gold/20 scale-105'
                : 'text-gm-muted hover:text-gm-text hover:bg-gm-surface/40',
            )}
          >
            {item.label}
            {item.value === 'pending' && item.badge > 0 && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[9px] leading-none',
                  status === item.value ? 'bg-gm-bg/20 text-gm-bg' : 'bg-gm-gold/15 text-gm-gold',
                )}
              >
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gm-surface/40">
              <TableRow className="border-gm-border-soft hover:bg-transparent">
                <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                  {isPending ? 'Aday' : t('table.consultant')}
                </TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.expertise')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                  {isPending ? 'Tarih' : t('table.price')}
                </TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.status')}</TableHead>
                <TableHead className="py-6 px-8 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-gm-border-soft">
                    <TableCell className="py-6 px-8"><Skeleton className="h-12 w-48 rounded-full bg-gm-surface/20" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-6 w-32 bg-gm-surface/20 rounded-full" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-8 w-20 bg-gm-surface/20 rounded-lg" /></TableCell>
                    <TableCell className="py-6"><Skeleton className="h-8 w-24 bg-gm-surface/20 rounded-full" /></TableCell>
                    <TableCell className="py-6 px-8"><Skeleton className="h-10 w-24 ml-auto bg-gm-surface/20 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : isEmpty ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-30">
                      <Users className="w-20 h-20 text-gm-gold/50" />
                      <span className="font-serif italic text-xl text-gm-muted">
                        {isPending ? 'Bekleyen başvuru yok.' : t('table.empty')}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isPending ? (
                appsQuery.data?.map((item) => (
                  <TableRow key={item.id} className="border-gm-border-soft hover:bg-gm-primary/[0.03] transition-colors group">
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gm-surface border border-gm-border-soft flex items-center justify-center text-gm-gold font-serif text-2xl shadow-inner">
                          {item.full_name?.[0] || 'D'}
                        </div>
                        <div>
                          <div className="font-serif text-xl text-gm-text">{item.full_name}</div>
                          <div className="text-[10px] text-gm-muted font-mono opacity-50 tracking-tighter leading-none mt-1">{item.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6"><Chips items={item.expertise} /></TableCell>
                    <TableCell className="py-6 text-sm text-gm-muted">{formatDate(item.created_at)}</TableCell>
                    <TableCell className="py-6">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] border bg-gm-gold/5 border-gm-gold/20 text-gm-gold">
                        <div className="w-1.5 h-1.5 rounded-full bg-gm-gold animate-pulse" />
                        Bekliyor
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <div className="flex justify-end gap-3 opacity-30 group-hover:opacity-100 transition-all duration-300">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full hover:bg-gm-gold/10 hover:text-gm-gold transition-colors"
                          onClick={() => setSelected(item)}
                        >
                          <Eye className="size-5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full hover:bg-gm-success/10 text-gm-success/40 hover:text-gm-success transition-all disabled:opacity-10"
                          disabled={busy || item.status === 'approved'}
                          onClick={() => handleApproveApp(item)}
                        >
                          <Check className="size-5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full hover:bg-gm-error/10 text-gm-error/40 hover:text-gm-error transition-all disabled:opacity-10"
                          disabled={busy || item.status === 'rejected'}
                          onClick={() => {
                            setRejectTarget(item);
                            setReason('');
                          }}
                        >
                          <X className="size-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                consultantsQuery.data?.map((item) => (
                  <TableRow key={item.id} className="border-gm-border-soft hover:bg-gm-primary/[0.03] transition-colors group">
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gm-surface border border-gm-border-soft flex items-center justify-center text-gm-gold font-serif text-2xl shadow-inner group-hover:border-gm-gold/50 transition-all duration-500">
                          {item.full_name?.[0] || 'D'}
                        </div>
                        <div>
                          <div className="font-serif text-xl text-gm-text flex items-center gap-2 group-hover:text-gm-primary transition-colors">
                            {item.full_name}
                            {item.approval_status === 'approved' && <ShieldCheck className="w-4 h-4 text-gm-gold" />}
                          </div>
                          <div className="text-[10px] text-gm-muted font-mono opacity-50 tracking-tighter leading-none mt-1">{item.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex flex-wrap gap-2">
                        {item.expertise?.slice(0, 3).map(e => (
                          <Badge key={e} variant="outline" className="text-[9px] font-bold px-3 py-1 rounded-full bg-gm-surface border-gm-border-soft text-gm-muted uppercase tracking-widest">
                            {e}
                          </Badge>
                        ))}
                        {(item.expertise?.length || 0) > 3 && (
                          <span className="text-[9px] text-gm-gold font-bold ml-1 opacity-60">
                            +{(item.expertise?.length || 0) - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex flex-col">
                        <span className="font-serif text-2xl text-gm-gold font-bold">₺{Math.round(Number(item.session_price))}</span>
                        <span className="text-[9px] text-gm-muted font-bold tracking-[0.2em] uppercase mt-1 opacity-60">
                          {t('table.sessionMinutes', { minutes: item.session_duration })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className={cn(
                        'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] border transition-all',
                        item.approval_status === 'approved' ? 'bg-gm-success/5 border-gm-success/20 text-gm-success' :
                        item.approval_status === 'rejected' ? 'bg-gm-error/5 border-gm-error/20 text-gm-error' :
                        'bg-gm-gold/5 border-gm-gold/20 text-gm-gold'
                      )}>
                        <div className={cn(
                          'w-1.5 h-1.5 rounded-full animate-pulse',
                          item.approval_status === 'approved' ? 'bg-gm-success' :
                          item.approval_status === 'rejected' ? 'bg-gm-error' :
                          'bg-gm-gold'
                        )} />
                        {t(`status.${item.approval_status || 'pending'}`)}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <div className="flex justify-end gap-3 opacity-20 group-hover:opacity-100 transition-all duration-300">
                        <Button asChild size="icon" variant="ghost" className="rounded-full hover:bg-gm-gold/10 hover:text-gm-gold transition-colors">
                          <Link href={`/admin/consultants/${item.id}`}>
                            <Eye className="size-5" />
                          </Link>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full hover:bg-gm-success/10 text-gm-success/40 hover:text-gm-success transition-all disabled:opacity-10"
                          disabled={approveState.isLoading || item.approval_status === 'approved'}
                          onClick={() => approveConsultant(item.id)}
                        >
                          <Check className="size-5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full hover:bg-gm-error/10 text-gm-error/40 hover:text-gm-error transition-all disabled:opacity-10"
                          disabled={rejectState.isLoading || item.approval_status === 'rejected'}
                          onClick={() => rejectConsultant(item.id)}
                        >
                          <X className="size-5" />
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

      {/* Başvuru detay modalı */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[86vh] max-w-3xl overflow-y-auto border-gm-border-soft bg-gm-bg-deep text-gm-text">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Başvuru Detayı</DialogTitle>
            <DialogDescription className="text-gm-muted">Form alanları salt okunur görüntülenir.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <DetailBlock label="Ad Soyad" value={selected.full_name} />
                <DetailBlock label="E-posta" value={selected.email} />
                <DetailBlock label="Telefon" value={selected.phone} />
                <DetailBlock
                  label="Deneyim"
                  value={selected.experience_years != null ? `${selected.experience_years} yıl` : undefined}
                />
                <DetailBlock label="Uzmanlık" value={<Chips items={selected.expertise} />} />
                <DetailBlock label="Diller" value={<Chips items={selected.languages} />} />
              </div>
              <DetailBlock label="Biyografi" value={selected.bio} />
              <DetailBlock label="Sertifikalar" value={selected.certifications} />
              <div className="grid gap-4 md:grid-cols-2">
                <DetailBlock
                  label="CV"
                  value={
                    selected.cv_url ? (
                      <a className="text-gm-gold underline" href={selected.cv_url} target="_blank" rel="noreferrer">
                        Dosyayı aç
                      </a>
                    ) : undefined
                  }
                />
                <DetailBlock
                  label="Örnek Harita"
                  value={
                    selected.sample_chart_url ? (
                      <a className="text-gm-gold underline" href={selected.sample_chart_url} target="_blank" rel="noreferrer">
                        Dosyayı aç
                      </a>
                    ) : undefined
                  }
                />
              </div>
              {selected.rejection_reason && <DetailBlock label="Red Sebebi" value={selected.rejection_reason} />}
              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  variant="outline"
                  className="rounded-full border-gm-success/30 text-gm-success"
                  disabled={busy || selected.status === 'approved'}
                  onClick={() => handleApproveApp(selected)}
                >
                  <UserCheck className="mr-2 size-4" /> Onayla
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-gm-error/30 text-gm-error"
                  disabled={busy || selected.status === 'rejected'}
                  onClick={() => {
                    setRejectTarget(selected);
                    setReason('');
                  }}
                >
                  <FileText className="mr-2 size-4" /> Reddet
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Red sebebi modalı */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="border-gm-border-soft bg-gm-bg-deep text-gm-text">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Başvuruyu Reddet</DialogTitle>
            <DialogDescription className="text-gm-muted">Adaya gönderilecek red sebebini yazın.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            minLength={10}
            rows={5}
            className="border-gm-border-soft bg-gm-surface/40"
            placeholder="En az 10 karakter..."
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>
              Vazgeç
            </Button>
            <Button onClick={handleRejectApp} disabled={rejectAppState.isLoading || reason.trim().length < 10}>
              <Send className="mr-2 size-4" /> Reddet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
