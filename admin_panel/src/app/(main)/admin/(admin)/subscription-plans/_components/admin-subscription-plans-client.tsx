'use client';

import * as React from 'react';
import { Plus, RefreshCcw, Save, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import {
  useCreateSubscriptionPlanAdminMutation,
  useDeleteSubscriptionPlanAdminMutation,
  useListSubscriptionPlansAdminQuery,
  useUpdateSubscriptionPlanAdminMutation,
} from '@/integrations/hooks';
import type {
  SubscriptionPlanAdmin,
  SubscriptionPlanAdminPayload,
  SubscriptionPlanAdminUpdatePayload,
  SubscriptionPlanPeriod,
} from '@/integrations/shared';
import { cn } from '@/lib/utils';

type PlanFormValues = {
  code: string;
  name_tr: string;
  name_en: string;
  description_tr: string;
  description_en: string;
  currency: string;
  period: SubscriptionPlanPeriod;
  trial_days: string;
  price_minor: string;
  features: string;
  is_active: boolean;
  display_order: string;
};

const PERIODS: SubscriptionPlanPeriod[] = ['monthly', 'yearly', 'lifetime'];

function emptyForm(): PlanFormValues {
  return {
    code: '',
    name_tr: '',
    name_en: '',
    description_tr: '',
    description_en: '',
    currency: 'TRY',
    period: 'monthly',
    trial_days: '0',
    price_minor: '0',
    features: '',
    is_active: true,
    display_order: '0',
  };
}

function toPayload(v: PlanFormValues): SubscriptionPlanAdminPayload {
  return {
    code: v.code.trim(),
    name_tr: v.name_tr.trim(),
    name_en: v.name_en.trim(),
    description_tr: v.description_tr.trim() || null,
    description_en: v.description_en.trim() || null,
    currency: v.currency.trim() || 'TRY',
    period: v.period,
    trial_days: Number(v.trial_days || 0),
    price_minor: Number(v.price_minor || 0),
    features: v.features
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean),
    is_active: v.is_active ? 1 : 0,
    display_order: Number(v.display_order || 0),
  };
}

function toPatchPayload(v: PlanFormValues): SubscriptionPlanAdminUpdatePayload {
  return {
    ...toPayload(v),
    code: v.code.trim(),
  };
}

function hydrateForm(row: SubscriptionPlanAdmin): PlanFormValues {
  return {
    code: row.code,
    name_tr: row.name_tr,
    name_en: row.name_en,
    description_tr: row.description_tr || '',
    description_en: row.description_en || '',
    currency: row.currency,
    period: row.period,
    trial_days: String(row.trial_days || 0),
    price_minor: String(row.price_minor || 0),
    features: Array.isArray(row.features)
      ? row.features.join(', ')
      : typeof row.features === 'string'
        ? row.features
        : '',
    is_active: Boolean(row.is_active),
    display_order: String(row.display_order || 0),
  };
}

function formatPriceMinor(value: string) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return '-';
  return `${(n / 100).toFixed(2)} TL`;
}

export default function AdminSubscriptionPlansClient() {
  const t = useAdminT('admin.subscriptions');
  const list = useListSubscriptionPlansAdminQuery({ limit: 200 });
  const [createPlan] = useCreateSubscriptionPlanAdminMutation();
  const [updatePlan] = useUpdateSubscriptionPlanAdminMutation();
  const [deletePlan] = useDeleteSubscriptionPlanAdminMutation();

  const [form, setForm] = React.useState<PlanFormValues>(emptyForm);
  const [editingId, setEditingId] = React.useState<string>('');

  const plans = list.data?.data ?? [];

  function setField<K extends keyof PlanFormValues>(key: K, value: PlanFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startEdit(row: SubscriptionPlanAdmin) {
    setEditingId(row.id);
    setForm(hydrateForm(row));
  }

  function resetForm() {
    setEditingId('');
    setForm(emptyForm());
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      if (!form.code.trim() || !form.name_tr.trim() || !form.name_en.trim()) {
        toast.error(t('plans.toasts.validation'));
        return;
      }
      if (!editingId) {
        await createPlan(toPayload(form)).unwrap();
        toast.success(t('plans.toasts.created'));
      } else {
        await updatePlan({ id: editingId, body: toPatchPayload(form) }).unwrap();
        toast.success(t('plans.toasts.updated'));
      }
      resetForm();
    } catch (err) {
      toast.error(t('plans.toasts.saveFailed'));
      console.error(err);
    }
  }

  async function removePlan(id: string) {
    if (!window.confirm(t('plans.confirmDelete'))) return;
    try {
      await deletePlan({ id }).unwrap();
      toast.success(t('plans.toasts.deleted'));
      if (editingId === id) resetForm();
    } catch {
      toast.error(t('plans.toasts.deleteFailed'));
    }
  }

  const busy = list.isFetching;

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Outside Page Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">{t('plans.eyebrow')}</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">{t('plans.title')}</h1>
          <p className="text-sm italic text-gm-muted">{t('plans.description')}</p>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => list.refetch()}
            disabled={busy}
            className="h-12 rounded-full border-gm-border-soft bg-gm-surface/50 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface/80"
          >
            <RefreshCcw className={cn("mr-2 size-4 text-gm-gold", list.isFetching && "animate-spin")} />
            {t('actions.refresh')}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        {/* Plan Form Card */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-gm-border-soft/50 pb-6 px-8 pt-8">
              <CardTitle className="font-serif text-xl text-gm-text">
                {editingId ? t('plans.form.editTitle') : t('plans.form.createTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form className="space-y-5" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-gold">{t('plans.form.code')}</Label>
                  <Input
                    value={form.code}
                    onChange={(e) => setField('code', e.target.value)}
                    placeholder={t('plans.form.codePlaceholder')}
                    className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/30 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('plans.form.nameTr')}</Label>
                  <Input
                    value={form.name_tr}
                    onChange={(e) => setField('name_tr', e.target.value)}
                    placeholder={t('plans.form.nameTrPlaceholder')}
                    className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('plans.form.nameEn')}</Label>
                  <Input
                    value={form.name_en}
                    onChange={(e) => setField('name_en', e.target.value)}
                    placeholder={t('plans.form.nameEnPlaceholder')}
                    className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('plans.form.descriptionTr')}</Label>
                  <Textarea 
                    rows={2} 
                    value={form.description_tr} 
                    onChange={(e) => setField('description_tr', e.target.value)} 
                    className="rounded-2xl border-gm-border-soft bg-gm-surface/10 p-4 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('plans.form.descriptionEn')}</Label>
                  <Textarea 
                    rows={2} 
                    value={form.description_en} 
                    onChange={(e) => setField('description_en', e.target.value)} 
                    className="rounded-2xl border-gm-border-soft bg-gm-surface/10 p-4 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('plans.form.currency')}</Label>
                    <Input 
                      value={form.currency} 
                      onChange={(e) => setField('currency', e.target.value.toUpperCase())} 
                      className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-center font-semibold"
                    />
                  </div>
                  <div className="space-y-2 flex flex-col justify-end">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted mb-2">{t('plans.form.period')}</Label>
                    <select
                      value={form.period}
                      onChange={(e) => setField('period', e.target.value as SubscriptionPlanPeriod)}
                      className="h-11 w-full rounded-full border border-gm-border-soft bg-gm-bg-deep/30 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus:outline-none"
                    >
                      {PERIODS.map((p) => (
                        <option key={p} value={p} className="bg-gm-surface text-gm-text">
                          {t(`plans.periods.${p}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('plans.form.priceMinor')}</Label>
                    <Input
                      type="number"
                      value={form.price_minor}
                      onChange={(e) => setField('price_minor', e.target.value)}
                      placeholder="1999"
                      className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <p className="text-[10px] text-gm-muted/80 italic pl-2">{formatPriceMinor(form.price_minor)}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('plans.form.trialDays')}</Label>
                    <Input
                      type="number"
                      value={form.trial_days}
                      onChange={(e) => setField('trial_days', e.target.value)}
                      className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('plans.form.displayOrder')}</Label>
                    <Input
                      type="number"
                      value={form.display_order}
                      onChange={(e) => setField('display_order', e.target.value)}
                      className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-center"
                    />
                  </div>
                  <div className="flex items-center gap-2.5 pl-2 pt-6">
                    <Checkbox
                      id="is_active"
                      checked={form.is_active}
                      onCheckedChange={(value) => setField('is_active', Boolean(value))}
                      className="data-[state=checked]:bg-gm-gold rounded"
                    />
                    <Label htmlFor="is_active" className="text-sm font-semibold text-gm-text cursor-pointer">{t('plans.form.isActive')}</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('plans.form.features')}</Label>
                  <Input
                    value={form.features}
                    onChange={(e) => setField('features', e.target.value)}
                    placeholder={t('plans.form.featuresPlaceholder')}
                    className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                <div className="flex flex-col gap-2.5 pt-4">
                  <Button type="submit" className="w-full bg-gm-gold hover:bg-gm-gold/80 text-gm-bg h-12 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-gm-gold/10 border-transparent">
                    <Save className="mr-2 size-5" />
                    {editingId ? t('plans.form.submitUpdate') : t('plans.form.submitCreate')}
                  </Button>

                  {editingId ? (
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={resetForm}
                      className="w-full h-11 rounded-full text-gm-muted hover:bg-gm-surface/20"
                    >
                      {t('plans.form.newPlan')}
                    </Button>
                  ) : null}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Plan List Card */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-gm-border-soft/50 pb-6 px-8 pt-8 flex flex-row items-center justify-between">
              <CardTitle className="font-serif text-xl text-gm-text flex items-center gap-3">
                {t('plans.listTitle')}
                <Badge variant="outline" className="rounded-full border-gm-gold/30 text-gm-gold bg-gm-gold/5 text-[11px] font-mono px-2.5 py-0.5">
                  {plans.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="overflow-x-auto rounded-2xl border border-gm-border-soft/60 bg-gm-surface/10">
                <Table>
                  <TableHeader className="bg-gm-surface/40">
                    <TableRow className="border-gm-border-soft hover:bg-transparent">
                      <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('plans.table.code')}</TableHead>
                      <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('plans.table.name')}</TableHead>
                      <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('plans.table.period')}</TableHead>
                      <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('plans.table.price')}</TableHead>
                      <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('plans.table.status')}</TableHead>
                      <TableHead className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('plans.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.length === 0 ? (
                      <TableRow className="border-gm-border-soft">
                        <TableCell colSpan={6} className="py-16 text-center text-sm text-gm-muted italic font-serif">
                          {t('plans.table.noRecords')}
                        </TableCell>
                      </TableRow>
                    ) : null}

                    {plans.map((plan) => (
                      <TableRow key={plan.id} className="border-gm-border-soft hover:bg-gm-surface/40 transition-colors">
                        <TableCell className="px-6 py-4">
                          <code className="bg-gm-bg-deep px-2 py-0.5 rounded text-gm-gold border border-gm-border-soft/60 text-xs font-bold uppercase tracking-wider">{plan.code}</code>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="font-bold text-gm-text">{plan.name_tr}</div>
                          <div className="text-[11px] text-gm-muted/80 mt-1 font-light">{plan.name_en}</div>
                        </TableCell>
                        <TableCell className="py-4 text-xs font-semibold text-gm-text-dim uppercase tracking-wider">{plan.period}</TableCell>
                        <TableCell className="py-4 font-bold text-gm-text">
                          {(Number(plan.price_minor || 0) / 100).toFixed(2)} {plan.currency}
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant={plan.is_active ? 'default' : 'secondary'} className="rounded-full text-[9px] uppercase tracking-widest px-2.5 py-0.5">
                            {plan.is_active ? t('plans.statuses.active') : t('plans.statuses.inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => startEdit(plan)}
                              className="h-9 w-9 rounded-full hover:bg-gm-primary/10 hover:text-gm-primary text-gm-muted"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => removePlan(plan.id)}
                              className="h-9 w-9 rounded-full text-gm-error hover:bg-gm-error/10 hover:text-gm-error"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

