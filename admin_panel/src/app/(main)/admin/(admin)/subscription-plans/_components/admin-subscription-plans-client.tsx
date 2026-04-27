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
        toast.error('Code and names are required.');
        return;
      }
      if (!editingId) {
        await createPlan(toPayload(form)).unwrap();
        toast.success('Plan created.');
      } else {
        await updatePlan({ id: editingId, body: toPatchPayload(form) }).unwrap();
        toast.success('Plan updated.');
      }
      resetForm();
    } catch (err) {
      toast.error('Failed to save plan.');
      console.error(err);
    }
  }

  async function removePlan(id: string) {
    if (!window.confirm('Delete this plan? This action cannot be undone.')) return;
    try {
      await deletePlan({ id }).unwrap();
      toast.success('Plan deleted.');
      if (editingId === id) resetForm();
    } catch {
      toast.error('Could not delete plan. It may be in use.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Subscription Plans</h1>
          <p className="text-sm text-muted-foreground">Add, update and archive plans.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => list.refetch()} disabled={list.isFetching}>
          <RefreshCcw className={`mr-2 size-4 ${list.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit plan' : 'New plan'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-3" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setField('code', e.target.value)} placeholder="gold_monthly" />
            </div>
            <div className="space-y-2">
              <Label>Name (TR)</Label>
              <Input value={form.name_tr} onChange={(e) => setField('name_tr', e.target.value)} placeholder="Aylik Abonelik" />
            </div>
            <div className="space-y-2">
              <Label>Name (EN)</Label>
              <Input value={form.name_en} onChange={(e) => setField('name_en', e.target.value)} placeholder="Monthly Plan" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description (TR)</Label>
              <Textarea rows={2} value={form.description_tr} onChange={(e) => setField('description_tr', e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label>Description (EN)</Label>
              <Textarea rows={2} value={form.description_en} onChange={(e) => setField('description_en', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Input value={form.currency} onChange={(e) => setField('currency', e.target.value.toUpperCase())} />
            </div>

            <div className="space-y-2">
              <Label>Period</Label>
              <select
                value={form.period}
                onChange={(e) => setField('period', e.target.value as SubscriptionPlanPeriod)}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              >
                {PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Price (minor)</Label>
              <Input
                type="number"
                value={form.price_minor}
                onChange={(e) => setField('price_minor', e.target.value)}
                placeholder="1999"
              />
              <p className="text-xs text-muted-foreground">Shown as: {formatPriceMinor(form.price_minor)}</p>
            </div>

            <div className="space-y-2">
              <Label>Trial days</Label>
              <Input
                type="number"
                value={form.trial_days}
                onChange={(e) => setField('trial_days', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Display order</Label>
              <Input
                type="number"
                value={form.display_order}
                onChange={(e) => setField('display_order', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Features (comma separated)</Label>
              <Input
                value={form.features}
                onChange={(e) => setField('features', e.target.value)}
                placeholder="chat, voice, ai"
              />
            </div>

            <div className="flex items-center gap-2 pt-7">
              <Checkbox
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(value) => setField('is_active', Boolean(value))}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="col-span-3 flex flex-wrap gap-2">
              <Button type="submit">
                <Save className="mr-2 size-4" />
                {editingId ? 'Update plan' : 'Create plan'}
              </Button>

              {editingId ? (
                <Button variant="outline" type="button" onClick={resetForm}>
                  <Plus className="mr-2 size-4" />
                  New
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Plan List</span>
            <Badge variant="outline">{plans.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No plans found.
                    </TableCell>
                  </TableRow>
                ) : null}

                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-mono text-sm">{plan.code}</TableCell>
                    <TableCell>
                      <p className="font-medium">{plan.name_tr}</p>
                      <p className="text-xs text-muted-foreground">{plan.name_en}</p>
                    </TableCell>
                    <TableCell>{plan.period}</TableCell>
                    <TableCell>
                      {(Number(plan.price_minor || 0) / 100).toFixed(2)} {plan.currency}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? 'default' : 'secondary'}>{plan.is_active ? 'active' : 'inactive'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="outline" onClick={() => startEdit(plan)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button size="icon" variant="outline" onClick={() => removePlan(plan.id)}>
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
  );
}

