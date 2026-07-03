'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import {
  useDeleteSubscriptionPlanAdminMutation,
  useListSubscriptionPlansAdminQuery,
} from '@/integrations/hooks';
import type { SubscriptionPlanAdmin, SubscriptionPlanPeriod } from '@/integrations/shared';
import { cn } from '@/lib/utils';

type ContentLocale = 'tr' | 'en' | 'de';

function planName(plan: SubscriptionPlanAdmin, locale: ContentLocale) {
  if (locale === 'de') return plan.name_de || plan.name_en || plan.name_tr || plan.code;
  if (locale === 'en') return plan.name_en || plan.name_tr || plan.name_de || plan.code;
  return plan.name_tr || plan.name_en || plan.name_de || plan.code;
}

function planDescription(plan: SubscriptionPlanAdmin, locale: ContentLocale) {
  if (locale === 'de') return plan.description_de || plan.description_en || plan.description_tr || '';
  if (locale === 'en') return plan.description_en || plan.description_tr || plan.description_de || '';
  return plan.description_tr || plan.description_en || plan.description_de || '';
}

function periodLabel(period: SubscriptionPlanPeriod) {
  if (period === 'yearly') return 'Yıllık';
  if (period === 'lifetime') return 'Ömür Boyu';
  return 'Aylık';
}

function formatPrice(value: number, currency: string) {
  return `${(Number(value || 0) / 100).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency || 'TRY'}`;
}

export default function AdminSubscriptionPlansClient() {
  const t = useAdminT('admin.subscriptions');
  const [locale, setLocale] = React.useState<ContentLocale>('tr');
  const [search, setSearch] = React.useState('');

  const list = useListSubscriptionPlansAdminQuery({
    q: search.trim() || undefined,
    limit: 200,
  });
  const [deletePlan, deleteState] = useDeleteSubscriptionPlanAdminMutation();

  const plans = list.data?.data ?? [];
  const activeCount = plans.filter((plan) => Number(plan.is_active) === 1).length;
  const inactiveCount = plans.length - activeCount;

  async function removePlan(plan: SubscriptionPlanAdmin) {
    if (!window.confirm(`${plan.code} planı silinsin mi?`)) return;
    try {
      await deletePlan({ id: plan.id }).unwrap();
      toast.success(t('plans.toasts.deleted', null, 'Plan silindi.'));
    } catch (err: any) {
      toast.error(err?.data?.error?.message || t('plans.toasts.deleteFailed', null, 'Plan silinemedi.'));
    }
  }

  const busy = list.isFetching || deleteState.isLoading;

  return (
    <div className="animate-in space-y-10 pb-12 duration-700 fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">
              {t('plans.eyebrow', null, 'Abonelikler')}
            </span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">
            {t('plans.title', null, 'Abonelik Planları')}
          </h1>
          <p className="max-w-3xl font-serif text-sm italic leading-relaxed text-gm-muted opacity-75">
            Planları listeleyin, yeni plan oluşturun veya mevcut planları ayrı düzenleme sayfasında güncelleyin.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={locale}
            onChange={(event) => setLocale(event.target.value as ContentLocale)}
            aria-label="Önizleme dili"
            className="h-12 rounded-full border border-gm-border-soft bg-gm-surface/50 px-5 text-[11px] font-bold uppercase tracking-widest text-gm-text"
          >
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => list.refetch()}
            disabled={busy}
            className="h-12 rounded-full border-gm-border-soft bg-gm-surface/50 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface/80"
          >
            <RefreshCcw className={cn('mr-2 size-4 text-gm-gold', list.isFetching && 'animate-spin')} />
            {t('actions.refresh', null, 'Yenile')}
          </Button>
          <Button
            size="sm"
            asChild
            className="h-12 rounded-full border border-transparent bg-gm-gold px-8 text-[10px] font-bold uppercase tracking-widest text-gm-bg shadow-lg shadow-gm-gold/10 hover:bg-gm-gold/80"
          >
            <Link href="/admin/subscription-plans/new">
              <Plus className="mr-2 size-4" />
              Yeni Plan
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard icon={CreditCard} label="Toplam Plan" value={plans.length} />
        <MetricCard icon={CheckCircle2} label="Aktif" value={activeCount} tone="success" />
        <MetricCard icon={XCircle} label="Pasif" value={inactiveCount} tone="danger" />
      </div>

      <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col gap-4 border-b border-gm-border-soft bg-gm-surface/40 p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-serif text-2xl text-gm-text">Plan Listesi</h2>
            <p className="mt-1 text-sm text-gm-muted">Seçili dil: {locale.toUpperCase()}</p>
          </div>
          <div className="group relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gm-muted/50 group-focus-within:text-gm-gold" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Kod veya plan adı ara"
              className="h-12 rounded-2xl border-gm-border-soft bg-gm-bg-deep/40 pl-12 text-sm text-gm-text focus:border-gm-gold/50 focus-visible:ring-gm-gold/30"
            />
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gm-surface/30">
              <TableRow className="border-gm-border-soft hover:bg-transparent">
                <TableHead className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Kod</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Plan</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Periyot</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Ücret</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">Durum</TableHead>
                <TableHead className="px-8 py-6 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading ? (
                <TableRow className="border-gm-border-soft">
                  <TableCell colSpan={6} className="py-20 text-center font-serif text-sm italic text-gm-muted">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : plans.length === 0 ? (
                <TableRow className="border-gm-border-soft">
                  <TableCell colSpan={6} className="py-20 text-center font-serif text-sm italic text-gm-muted">
                    Henüz plan bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow key={plan.id} className="border-gm-border-soft transition-colors hover:bg-gm-surface/40">
                    <TableCell className="px-8 py-5">
                      <code className="rounded border border-gm-border-soft/60 bg-gm-bg-deep px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-gm-gold">
                        {plan.code}
                      </code>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="font-serif text-lg text-gm-text">{planName(plan, locale)}</div>
                      <div className="mt-1 max-w-md truncate text-xs text-gm-muted/80">
                        {planDescription(plan, locale) || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <Badge variant="outline" className="rounded-full border-gm-border-soft bg-gm-bg-deep text-[10px] uppercase tracking-widest text-gm-text-dim">
                        {periodLabel(plan.period)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5 font-bold text-gm-text">
                      {formatPrice(plan.price_minor, plan.currency)}
                    </TableCell>
                    <TableCell className="py-5">
                      <Badge
                        className={cn(
                          'rounded-full border-none px-3 py-1 text-[9px] font-bold uppercase tracking-widest',
                          plan.is_active ? 'bg-gm-success/10 text-gm-success' : 'bg-gm-muted/10 text-gm-muted',
                        )}
                      >
                        {plan.is_active ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild size="icon" variant="ghost" className="h-9 w-9 rounded-full text-gm-muted hover:bg-gm-primary/10 hover:text-gm-primary">
                          <Link href={`/admin/subscription-plans/${plan.id}`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removePlan(plan)}
                          disabled={deleteState.isLoading}
                          className="h-9 w-9 rounded-full text-gm-error hover:bg-gm-error/10 hover:text-gm-error"
                        >
                          <Trash2 className="size-4" />
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
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: 'neutral' | 'success' | 'danger';
}) {
  return (
    <Card className="relative overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-bg-deep/40 p-8 shadow-xl backdrop-blur-md">
      <Icon
        className={cn(
          'absolute -right-4 -top-4 size-24 opacity-5',
          tone === 'success' && 'text-gm-success',
          tone === 'danger' && 'text-gm-error',
          tone === 'neutral' && 'text-gm-gold',
        )}
      />
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-muted">{label}</p>
      <div
        className={cn(
          'mt-4 font-serif text-5xl text-gm-text',
          tone === 'success' && 'text-gm-success',
          tone === 'danger' && 'text-gm-error',
        )}
      >
        {value}
      </div>
    </Card>
  );
}
