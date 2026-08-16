'use client';

import * as React from 'react';
import {
  BadgeCheck,
  Banknote,
  Building2,
  Clock,
  FileText,
  Landmark,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Star,
  TrendingUp,
  User as UserIcon,
  Wallet,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { normalizeStorageUrl } from '@/integrations/shared/storage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  ConsultantOverview,
  ConsultantWithdrawalRow,
} from '@/integrations/endpoints/admin/consultant_overview_admin.endpoints';

function money(value: number | null | undefined, currency = 'EUR'): string {
  const n = Number(value ?? 0);
  try {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${n.toLocaleString('tr-TR')} ${currency}`;
  }
}

function fmtDate(value: string | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const KYC_META: Record<string, { label: string; cls: string }> = {
  approved: { label: 'Onaylı', cls: 'bg-gm-success/10 text-gm-success border-gm-success/20' },
  pending: { label: 'İnceleniyor', cls: 'bg-gm-gold/10 text-gm-gold border-gm-gold/20' },
  rejected: { label: 'Reddedildi', cls: 'bg-gm-error/10 text-gm-error border-gm-error/20' },
  none: { label: 'Başvuru yok', cls: 'bg-gm-muted/10 text-gm-muted border-gm-border-soft' },
};

const WD_META: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Bekliyor', cls: 'bg-gm-gold/10 text-gm-gold' },
  approved: { label: 'Onaylandı', cls: 'bg-blue-500/10 text-blue-400' },
  paid: { label: 'Ödendi', cls: 'bg-gm-success/10 text-gm-success' },
  rejected: { label: 'Reddedildi', cls: 'bg-gm-error/10 text-gm-error' },
  cancelled: { label: 'İptal', cls: 'bg-gm-muted/10 text-gm-muted' },
};

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gm-border-soft last:border-0">
      <span className="text-[10px] font-bold text-gm-muted tracking-[0.12em] uppercase shrink-0 pt-0.5">{label}</span>
      <span className={cn('text-sm text-gm-text text-right break-words', mono && 'font-mono text-[12px]')}>{value || '-'}</span>
    </div>
  );
}

function TabSkeleton() {
  return <Skeleton className="h-64 w-full rounded-[32px] bg-gm-surface/20" />;
}

/* ───────────────────────── KYC ───────────────────────── */
export function ConsultantKycTab({
  data,
  isLoading,
  onApprove,
  onReject,
  busy,
}: {
  data?: ConsultantOverview;
  isLoading: boolean;
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  if (isLoading || !data) return <TabSkeleton />;
  const k = data.kyc;
  const meta = KYC_META[k.kyc_status] ?? KYC_META.none;
  const isCompany = k.account_type === 'company';

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <Card className="lg:col-span-2 bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden shadow-xl">
        <CardHeader className="p-8 pb-4 bg-gm-surface/40 border-b border-gm-border-soft flex flex-row items-center justify-between">
          <CardTitle className="font-serif text-2xl flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-gm-gold" /> Kimlik & Fatura (KYC)
          </CardTitle>
          <Badge className={cn('rounded-full px-4 py-1 text-[10px] font-bold tracking-widest uppercase border', meta.cls)}>
            {meta.label}
          </Badge>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1 flex items-center gap-2">
                {isCompany ? <Building2 className="size-3" /> : <UserIcon className="size-3" />} Hesap tipi
              </Label>
              <p className="mt-2 text-sm text-gm-text">
                {k.account_type === 'company' ? 'Kurumsal (şirket)' : k.account_type === 'individual' ? 'Bireysel' : '-'}
              </p>
            </div>
            <div>
              <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1">Başvuru / inceleme</Label>
              <p className="mt-2 text-sm text-gm-text">
                {fmtDate(k.kyc_submitted_at)} <span className="text-gm-muted">→</span> {fmtDate(k.kyc_reviewed_at)}
              </p>
            </div>
          </div>

          <Separator className="bg-gm-border-soft" />

          <div className="rounded-2xl border border-gm-border-soft bg-gm-surface/30 p-5">
            <InfoRow label="TC Kimlik No" value={k.identity_number} mono />
            {isCompany && <InfoRow label="Şirket" value={k.company_name} />}
            {isCompany && <InfoRow label="Vergi No" value={k.tax_number} mono />}
            {isCompany && <InfoRow label="Vergi Dairesi" value={k.tax_office} />}
            <InfoRow label="Fatura Adresi" value={k.billing_address} />
          </div>

          <div className="rounded-2xl border border-gm-border-soft bg-gm-surface/30 p-5">
            <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
              <Landmark className="size-3" /> Banka
            </Label>
            <InfoRow label="Banka" value={k.bank_name} />
            <InfoRow label="IBAN" value={k.bank_iban} mono />
            <InfoRow label="Hesap Sahibi" value={k.bank_account_holder} />
          </div>

          {k.kyc_documents.length > 0 && (
            <div>
              <Label className="text-[10px] font-bold text-gm-muted tracking-[0.2em] uppercase ml-1 mb-2 block">Belgeler</Label>
              <div className="flex flex-wrap gap-3">
                {k.kyc_documents.map((doc, i) => {
                  const url = normalizeStorageUrl(String(doc.url ?? '')) || String(doc.url ?? '');
                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-gm-border-soft bg-gm-surface/40 px-4 py-2 text-xs text-gm-gold hover:bg-gm-surface transition-colors"
                    >
                      <FileText className="size-4" />
                      {String(doc.type ?? `Belge ${i + 1}`)}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {k.kyc_status === 'rejected' && k.kyc_rejection_reason && (
            <div className="rounded-2xl border border-gm-error/20 bg-gm-error/5 p-4 text-sm text-gm-error/80">
              <span className="font-bold">Red sebebi:</span> {k.kyc_rejection_reason}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden shadow-xl h-fit">
        <CardHeader className="p-8 pb-4 bg-gm-surface/40 border-b border-gm-border-soft">
          <CardTitle className="font-serif text-2xl flex items-center gap-3">
            <BadgeCheck className="h-5 w-5 text-gm-gold" /> İşlem
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-4">
          <p className="text-sm text-gm-muted">
            KYC durumu: <span className="font-bold text-gm-text">{meta.label}</span>
          </p>
          <Button
            onClick={onApprove}
            disabled={busy || k.kyc_status === 'approved'}
            className="w-full rounded-full bg-gm-gold text-gm-bg hover:bg-gm-gold-dim h-12 font-bold tracking-widest uppercase text-[10px]"
          >
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <BadgeCheck className="mr-2 size-4" />}
            KYC Onayla
          </Button>
          <Button
            variant="outline"
            onClick={onReject}
            disabled={busy || k.kyc_status === 'rejected'}
            className="w-full rounded-full border-gm-error/20 text-gm-error hover:bg-gm-error hover:text-white h-12 font-bold tracking-widest uppercase text-[10px]"
          >
            <X className="mr-2 size-4" /> KYC Reddet
          </Button>
          {k.kyc_status === 'none' && (
            <p className="text-[11px] text-gm-muted italic">Danışman henüz KYC belgesi göndermedi.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ───────────────────────── Ödemeler ───────────────────────── */
function StatBox({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-gm-border-soft bg-gm-surface/30 p-5 space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase">
        {icon} {label}
      </div>
      <div className={cn('font-serif text-2xl font-bold', accent ?? 'text-gm-text')}>{value}</div>
    </div>
  );
}

export function ConsultantPaymentsTab({
  data,
  isLoading,
  onApproveWithdrawal,
  onRejectWithdrawal,
  onMarkPaid,
  busyId,
}: {
  data?: ConsultantOverview;
  isLoading: boolean;
  onApproveWithdrawal: (w: ConsultantWithdrawalRow) => void;
  onRejectWithdrawal: (w: ConsultantWithdrawalRow) => void;
  onMarkPaid: (w: ConsultantWithdrawalRow) => void;
  busyId: string | null;
}) {
  if (isLoading || !data) return <TabSkeleton />;
  const cur = data.wallet?.currency ?? 'EUR';

  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox icon={<Wallet className="size-3" />} label="Cüzdan bakiyesi" value={money(data.wallet?.balance ?? 0, cur)} accent="text-gm-gold" />
        <StatBox icon={<Clock className="size-3" />} label="Bekleyen bakiye" value={money(data.wallet?.pending_balance ?? 0, cur)} />
        <StatBox icon={<Banknote className="size-3" />} label="Ödenen (toplam)" value={money(data.withdrawal_summary.total_paid, cur)} accent="text-gm-success" />
        <StatBox icon={<ReceiptText className="size-3" />} label="Bekleyen çekim" value={money(data.withdrawal_summary.pending_amount, cur)} />
      </div>

      <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden shadow-xl">
        <CardHeader className="p-8 pb-4 bg-gm-surface/40 border-b border-gm-border-soft">
          <CardTitle className="font-serif text-2xl flex items-center gap-3">
            <Banknote className="h-5 w-5 text-gm-gold" /> Para Çekme Talepleri
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {data.withdrawals.length === 0 ? (
            <p className="text-sm text-gm-muted italic">Bu danışmanın para çekme talebi yok.</p>
          ) : (
            <div className="space-y-3">
              {data.withdrawals.map((w) => {
                const meta = WD_META[w.status] ?? WD_META.pending;
                const isBusy = busyId === w.id;
                return (
                  <div key={w.id} className="flex flex-col gap-3 rounded-2xl border border-gm-border-soft bg-gm-surface/30 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-lg text-gm-text">{money(w.amount, w.currency || cur)}</span>
                        <Badge className={cn('rounded-full px-3 py-0.5 text-[10px] font-bold uppercase', meta.cls)}>{meta.label}</Badge>
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-gm-muted truncate">
                        {fmtDate(w.requested_at)} · {w.bank_iban || w.bank_name || '-'}
                        {w.transfer_reference ? ` · ref: ${w.transfer_reference}` : ''}
                      </p>
                      {w.status === 'rejected' && w.rejection_reason && (
                        <p className="mt-1 text-[11px] text-gm-error/70">Red: {w.rejection_reason}</p>
                      )}
                    </div>
                    {(w.status === 'pending' || w.status === 'approved') && (
                      <div className="flex flex-wrap items-center gap-2">
                        {w.status === 'pending' && (
                          <Button
                            variant="outline"
                            onClick={() => onApproveWithdrawal(w)}
                            disabled={isBusy}
                            className="h-9 rounded-full border-blue-500/30 text-blue-400 text-[10px] uppercase tracking-widest"
                          >
                            {isBusy ? <Loader2 className="size-3 animate-spin" /> : 'Onayla'}
                          </Button>
                        )}
                        <Button
                          onClick={() => onMarkPaid(w)}
                          disabled={isBusy}
                          className="h-9 rounded-full bg-gm-success/90 text-white hover:bg-gm-success text-[10px] uppercase tracking-widest"
                        >
                          Ödendi işaretle
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => onRejectWithdrawal(w)}
                          disabled={isBusy}
                          className="h-9 rounded-full border-gm-error/20 text-gm-error hover:bg-gm-error hover:text-white text-[10px] uppercase tracking-widest"
                        >
                          Reddet
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ───────────────────────── İstatistik ───────────────────────── */
export function ConsultantStatsTab({ data, isLoading }: { data?: ConsultantOverview; isLoading: boolean }) {
  if (isLoading || !data) return <TabSkeleton />;
  const s = data.stats;
  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox icon={<TrendingUp className="size-3" />} label="Bu ay kazanç" value={money(s.month_earnings)} accent="text-gm-gold" />
        <StatBox icon={<Banknote className="size-3" />} label="Toplam kazanç" value={money(s.lifetime_earnings)} accent="text-gm-success" />
        <StatBox icon={<ReceiptText className="size-3" />} label="Bu ay seans" value={String(s.month_sessions)} />
        <StatBox icon={<Clock className="size-3" />} label="Bekleyen randevu" value={String(s.pending_count)} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox icon={<ReceiptText className="size-3" />} label="Toplam randevu" value={String(s.total_bookings)} />
        <StatBox icon={<BadgeCheck className="size-3" />} label="Tamamlanan" value={String(s.completed_count)} />
        <StatBox icon={<Star className="size-3" />} label="Puan" value={`${Number(s.rating_avg).toFixed(1)} (${s.rating_count})`} accent="text-gm-gold" />
        <StatBox icon={<Star className="size-3" />} label="Favori" value={String(s.favorite_count)} />
      </div>
    </div>
  );
}
