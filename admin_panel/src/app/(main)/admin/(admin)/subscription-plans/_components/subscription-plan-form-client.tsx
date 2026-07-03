'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, CheckCircle2, CreditCard, Languages, ListChecks, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateSubscriptionPlanAdminMutation,
  useGetSubscriptionPlanAdminQuery,
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
  name_de: string;
  description_tr: string;
  description_en: string;
  description_de: string;
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
    name_de: '',
    description_tr: '',
    description_en: '',
    description_de: '',
    currency: 'TRY',
    period: 'monthly',
    trial_days: '0',
    price_minor: '0',
    features: '',
    is_active: true,
    display_order: '0',
  };
}

function hydrateForm(row: SubscriptionPlanAdmin): PlanFormValues {
  return {
    code: row.code,
    name_tr: row.name_tr,
    name_en: row.name_en,
    name_de: row.name_de || '',
    description_tr: row.description_tr || '',
    description_en: row.description_en || '',
    description_de: row.description_de || '',
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

function toPayload(v: PlanFormValues): SubscriptionPlanAdminPayload {
  return {
    code: v.code.trim(),
    name_tr: v.name_tr.trim(),
    name_en: v.name_en.trim(),
    name_de: v.name_de.trim() || null,
    description_tr: v.description_tr.trim() || null,
    description_en: v.description_en.trim() || null,
    description_de: v.description_de.trim() || null,
    currency: v.currency.trim().toUpperCase() || 'TRY',
    period: v.period,
    trial_days: Number(v.trial_days || 0),
    price_minor: Number(v.price_minor || 0),
    features: v.features
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean),
    is_active: v.is_active ? 1 : 0,
    display_order: Number(v.display_order || 0),
  };
}

function toPatchPayload(v: PlanFormValues): SubscriptionPlanAdminUpdatePayload {
  return toPayload(v);
}

function periodLabel(period: SubscriptionPlanPeriod) {
  if (period === 'yearly') return 'Yıllık';
  if (period === 'lifetime') return 'Ömür Boyu';
  return 'Aylık';
}

function formatPriceMinor(value: string, currency: string) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return '-';
  return `${(n / 100).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency || 'TRY'}`;
}

export default function SubscriptionPlanFormClient({ mode, id = '' }: { mode: 'create' | 'edit'; id?: string }) {
  const router = useRouter();
  const isEdit = mode === 'edit';

  const { data: existing, isLoading: isFetching } = useGetSubscriptionPlanAdminQuery(
    { id },
    { skip: !isEdit || !id },
  );
  const [createPlan, createState] = useCreateSubscriptionPlanAdminMutation();
  const [updatePlan, updateState] = useUpdateSubscriptionPlanAdminMutation();
  const [form, setForm] = React.useState<PlanFormValues>(() => emptyForm());

  React.useEffect(() => {
    if (existing) setForm(hydrateForm(existing));
  }, [existing]);

  function setField<K extends keyof PlanFormValues>(key: K, value: PlanFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.code.trim() || !form.name_tr.trim() || !form.name_en.trim()) {
      toast.error('Kod, Türkçe ad ve İngilizce ad zorunlu.');
      return;
    }

    try {
      if (isEdit) {
        await updatePlan({ id, body: toPatchPayload(form) }).unwrap();
        toast.success('Plan güncellendi.');
      } else {
        await createPlan(toPayload(form)).unwrap();
        toast.success('Plan oluşturuldu.');
      }
      router.push('/admin/subscription-plans');
    } catch (err: any) {
      toast.error(err?.data?.error?.message || 'Plan kaydedilemedi.');
    }
  }

  const busy = isFetching || createState.isLoading || updateState.isLoading;

  if (isEdit && isFetching) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gm-gold" />
      </div>
    );
  }

  return (
    <div className="animate-in mx-auto max-w-6xl space-y-10 pb-12 duration-700 fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">
              Abonelik Planı
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/admin/subscription-plans')}
              className="h-10 w-10 rounded-full border-gm-border-soft bg-gm-surface/50 text-gm-gold hover:bg-gm-gold/10"
            >
              <ArrowLeft className="size-5" />
            </Button>
            <h1 className="font-serif text-4xl text-gm-text">
              {isEdit ? 'Planı Düzenle' : 'Yeni Plan'}
            </h1>
          </div>
          <p className="max-w-3xl font-serif text-sm italic leading-relaxed text-gm-muted opacity-75">
            Plan adını ve açıklamasını Türkçe, İngilizce ve Almanca olarak yönetin.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-gm-border-soft/50 px-8 pb-6 pt-8">
              <CardTitle className="flex items-center gap-3 font-serif text-xl text-gm-text">
                <Languages className="size-5 text-gm-gold" />
                Dil İçerikleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              <LocaleFields
                locale="tr"
                title="Türkçe"
                name={form.name_tr}
                description={form.description_tr}
                onName={(value) => setField('name_tr', value)}
                onDescription={(value) => setField('description_tr', value)}
                required
              />
              <LocaleFields
                locale="en"
                title="English"
                name={form.name_en}
                description={form.description_en}
                onName={(value) => setField('name_en', value)}
                onDescription={(value) => setField('description_en', value)}
                required
              />
              <LocaleFields
                locale="de"
                title="Deutsch"
                name={form.name_de}
                description={form.description_de}
                onName={(value) => setField('name_de', value)}
                onDescription={(value) => setField('description_de', value)}
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-gm-border-soft/50 px-8 pb-6 pt-8">
              <CardTitle className="flex items-center gap-3 font-serif text-xl text-gm-text">
                <ListChecks className="size-5 text-gm-gold" />
                Özellikler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-8">
              <Label htmlFor="features" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">
                Özellikler
              </Label>
              <Input
                id="features"
                value={form.features}
                onChange={(event) => setField('features', event.target.value)}
                placeholder="daily_reading_premium, ad_free, priority_support"
                className="h-12 rounded-2xl border-gm-border-soft bg-gm-bg-deep/30 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus-visible:ring-gm-gold/30"
              />
              <p className="pl-1 text-[11px] italic text-gm-muted/80">
                Virgülle ayrılmış özellik anahtarları. Uygulama tarafında bu anahtarlar özellik rozetlerine bağlanır.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-gm-border-soft/50 px-8 pb-6 pt-8">
              <CardTitle className="flex items-center gap-3 font-serif text-xl text-gm-text">
                <CreditCard className="size-5 text-gm-gold" />
                Plan Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <Field label="Kod" required>
                <Input
                  value={form.code}
                  onChange={(event) => setField('code', event.target.value)}
                  placeholder="monthly"
                  disabled={busy}
                  className={inputClass('font-bold')}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Para Birimi">
                  <Input
                    value={form.currency}
                    onChange={(event) => setField('currency', event.target.value.toUpperCase())}
                    disabled={busy}
                    className={inputClass('text-center font-semibold')}
                  />
                </Field>
                <Field label="Periyot">
                  <select
                    value={form.period}
                    onChange={(event) => setField('period', event.target.value as SubscriptionPlanPeriod)}
                    disabled={busy}
                    className="h-12 w-full rounded-2xl border border-gm-border-soft bg-gm-bg-deep/30 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:outline-none"
                  >
                    {PERIODS.map((period) => (
                      <option key={period} value={period} className="bg-gm-surface text-gm-text">
                        {periodLabel(period)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Ücret">
                  <Input
                    type="number"
                    value={form.price_minor}
                    onChange={(event) => setField('price_minor', event.target.value)}
                    disabled={busy}
                    className={inputClass()}
                  />
                  <p className="pl-1 pt-1 text-[10px] italic text-gm-muted/80">
                    {formatPriceMinor(form.price_minor, form.currency)}
                  </p>
                </Field>
                <Field label="Deneme Günü">
                  <Input
                    type="number"
                    value={form.trial_days}
                    onChange={(event) => setField('trial_days', event.target.value)}
                    disabled={busy}
                    className={inputClass('text-center')}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Sıralama">
                  <Input
                    type="number"
                    value={form.display_order}
                    onChange={(event) => setField('display_order', event.target.value)}
                    disabled={busy}
                    className={inputClass('text-center')}
                  />
                </Field>
                <div className="flex items-end">
                  <div className="flex h-12 w-full items-center justify-between rounded-2xl border border-gm-border-soft bg-gm-bg-deep/30 px-5">
                    <Label htmlFor="is_active" className="text-sm font-semibold text-gm-text">
                      Aktif
                    </Label>
                    <Switch
                      id="is_active"
                      checked={form.is_active}
                      onCheckedChange={(value) => setField('is_active', Boolean(value))}
                      disabled={busy}
                      className="data-[state=checked]:bg-gm-gold"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-[32px] border border-gm-gold/20 bg-gm-gold/5 p-8">
            <div className="mb-3 flex items-center gap-3">
              <CalendarDays className="size-5 text-gm-gold" />
              <h3 className="font-serif text-lg text-gm-gold">Yayın Notu</h3>
            </div>
            <p className="text-sm leading-relaxed text-gm-muted">
              Aktif planlar public fiyatlandırma alanlarında görünebilir. Mevcut aboneleri olan planları silmeden önce etkisini kontrol edin.
            </p>
          </div>

          <Button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-full border-transparent bg-gm-gold text-xs font-bold uppercase tracking-widest text-gm-bg shadow-lg shadow-gm-gold/10 hover:bg-gm-gold/80"
          >
            <Save className="mr-2 size-5" />
            {isEdit ? 'Güncelle' : 'Oluştur'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/admin/subscription-plans')}
            className="h-11 w-full rounded-full text-gm-muted hover:bg-gm-surface/20"
          >
            Vazgeç
          </Button>
        </div>
      </form>
    </div>
  );
}

function LocaleFields({
  locale,
  title,
  name,
  description,
  onName,
  onDescription,
  required = false,
}: {
  locale: string;
  title: string;
  name: string;
  description: string;
  onName: (value: string) => void;
  onDescription: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="rounded-[28px] border border-gm-border-soft bg-gm-bg-deep/30 p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="rounded-full border border-gm-gold/20 bg-gm-gold/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-gm-gold">
          {locale}
        </span>
        <h3 className="font-serif text-xl text-gm-text">{title}</h3>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Plan Adı" required={required}>
          <Input
            value={name}
            onChange={(event) => onName(event.target.value)}
            className={inputClass()}
          />
        </Field>
        <Field label="Açıklama">
          <Textarea
            rows={3}
            value={description}
            onChange={(event) => onDescription(event.target.value)}
            className="min-h-[104px] rounded-2xl border-gm-border-soft bg-gm-surface/10 p-4 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus-visible:ring-gm-gold/30"
          />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">
        {label}
        {required ? <span className="ml-1 text-gm-gold">*</span> : null}
      </Label>
      {children}
    </div>
  );
}

function inputClass(extra?: string) {
  return cn(
    'h-12 rounded-2xl border-gm-border-soft bg-gm-surface/10 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus-visible:ring-gm-gold/30',
    extra,
  );
}
