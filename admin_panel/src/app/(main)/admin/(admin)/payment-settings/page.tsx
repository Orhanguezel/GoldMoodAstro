'use client';
// =============================================================
// FILE: src/app/(main)/admin/(admin)/payment-settings/page.tsx
// Ödeme Ayarları — ODAKLI Iyzipay sayfası.
// Mantık tekrarı YOK: site-settings ile AYNI RTK endpoint'leri
// (useListSiteSettingsAdminQuery / useUpdateSiteSettingAdminMutation),
// yalnız iyzipay_* anahtarlarına kapsanmış (her settings ekranının
// standart deseni — kendi anahtar alt-kümesini yönetir).
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';
import { RefreshCcw, CreditCard } from 'lucide-react';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
} from '@/integrations/hooks';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const IYZIPAY_KEYS = ['iyzipay_api_key', 'iyzipay_secret_key', 'iyzipay_base_url'] as const;
type IyziKey = (typeof IYZIPAY_KEYS)[number];
type IyziForm = Record<IyziKey, string>;
const EMPTY_FORM: IyziForm = { iyzipay_api_key: '', iyzipay_secret_key: '', iyzipay_base_url: '' };

function valueToString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  try { return JSON.stringify(v); } catch { return String(v); }
}
function toMap(settings?: any) {
  const map = new Map<string, any>();
  if (settings) for (const s of settings) map.set(s.key, s);
  return map;
}

export default function PaymentSettingsPage() {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const { data: settings, isLoading, isFetching, refetch } = useListSiteSettingsAdminQuery({
    keys: IYZIPAY_KEYS as unknown as string[],
    locale: '*', // GLOBAL
  } as any);
  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();

  const [form, setForm] = React.useState<IyziForm>(EMPTY_FORM);

  React.useEffect(() => {
    const map = toMap(settings);
    const next: IyziForm = { ...EMPTY_FORM };
    IYZIPAY_KEYS.forEach((k) => { next[k] = valueToString(map.get(k)?.value); });
    setForm(next);
  }, [settings]);

  const busy = isLoading || isFetching || isSaving;
  const set = (k: IyziKey, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    try {
      for (const key of IYZIPAY_KEYS) {
        await updateSetting({ key, value: form[key].trim(), locale: '*' }).unwrap();
      }
      toast.success(t('admin.siteSettings.api.saved', null, 'Kaydedildi'));
      await refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || t('admin.siteSettings.api.saveError', null, 'Kaydedilemedi'));
    }
  };

  const inputCls =
    'h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-mono text-gm-text transition-all';
  const labelCls = 'text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block';

  return (
    <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
      <CardHeader className="bg-gm-surface/40 p-8 border-b border-gm-border-soft gap-4">
        <div className="flex items-start justify-between gap-6">
          <div>
            <CardTitle className="font-serif text-2xl text-gm-text flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-gm-gold" />
              {t('admin.siteSettings.api.iyzipaySection', null, 'Ödeme Ayarları (Iyzipay)')}
            </CardTitle>
            <CardDescription className="text-gm-muted font-serif italic opacity-80">
              {t(
                'admin.siteSettings.api.iyzipayDesc',
                null,
                'Iyzipay ödeme entegrasyonu — global ayardır (locale=*). Sandbox/prod URL’ye dikkat.',
              )}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={busy}
            className="shrink-0 rounded-2xl border-gm-border-soft text-gm-muted hover:text-gm-text"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            {t('admin.common.refresh', null, 'Yenile')}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="iyzipay_api_key" className={labelCls}>
              {t('admin.siteSettings.api.iyzipayApiKey', null, 'Iyzipay API Key')}
            </Label>
            <Input
              id="iyzipay_api_key"
              value={form.iyzipay_api_key}
              onChange={(e) => set('iyzipay_api_key', e.target.value)}
              placeholder="API Key"
              disabled={busy}
              className={inputCls}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="iyzipay_secret_key" className={labelCls}>
              {t('admin.siteSettings.api.iyzipaySecretKey', null, 'Iyzipay Secret Key')}
            </Label>
            <Input
              id="iyzipay_secret_key"
              type="password"
              value={form.iyzipay_secret_key}
              onChange={(e) => set('iyzipay_secret_key', e.target.value)}
              placeholder="Secret Key"
              disabled={busy}
              className={inputCls}
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="iyzipay_base_url" className={labelCls}>
              {t('admin.siteSettings.api.iyzipayBaseUrl', null, 'Iyzipay Base URL')}
            </Label>
            <Input
              id="iyzipay_base_url"
              value={form.iyzipay_base_url}
              onChange={(e) => set('iyzipay_base_url', e.target.value)}
              placeholder="https://sandbox-api.iyzipay.com"
              disabled={busy}
              className={inputCls}
            />
            <p className="text-[11px] text-gm-muted ml-1">
              {t(
                'admin.siteSettings.api.iyzipayBaseUrlHint',
                null,
                'Test: https://sandbox-api.iyzipay.com · Canlı: https://api.iyzipay.com',
              )}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className="rounded-2xl bg-gm-gold text-gm-bg-deep hover:bg-gm-gold/90 px-8 h-12 font-bold"
          >
            {isSaving ? t('admin.common.saving', null, 'Kaydediliyor…') : t('admin.common.save', null, 'Kaydet')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
