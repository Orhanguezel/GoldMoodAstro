'use client';

import React from 'react';
import { toast } from 'sonner';
import {
  useListSiteSettingsAdminQuery,
  useBulkUpsertSiteSettingsAdminMutation,
} from '@/integrations/hooks';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

// Site settings keys managed here (all global — locale: '*')
const AGORA_KEYS = ['agora.app_id', 'agora.enabled'] as const;
const IYZIPAY_KEYS = ['iyzipay.base_url', 'iyzipay.enabled'] as const;
const ALL_KEYS = [...AGORA_KEYS, ...IYZIPAY_KEYS];

type Form = {
  'agora.app_id': string;
  'agora.enabled': boolean;
  'iyzipay.base_url': string;
  'iyzipay.enabled': boolean;
};

const EMPTY: Form = {
  'agora.app_id': '',
  'agora.enabled': true,
  'iyzipay.base_url': 'https://sandbox-api.iyzipay.com',
  'iyzipay.enabled': true,
};

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === '1' || s === 'true' || s === 'yes';
  }
  return false;
}

function toMap(settings?: any[]) {
  const map = new Map<string, any>();
  if (settings) for (const s of settings) map.set(s.key, s);
  return map;
}

export const PaymentAgoraTab: React.FC = () => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const { data: settings, isLoading, isFetching, refetch } = useListSiteSettingsAdminQuery({
    keys: ALL_KEYS as unknown as string[],
  });

  const [bulkUpsert, { isLoading: isSaving }] = useBulkUpsertSiteSettingsAdminMutation();
  const [form, setForm] = React.useState<Form>(EMPTY);

  React.useEffect(() => {
    const map = toMap(settings);
    setForm({
      'agora.app_id': String(map.get('agora.app_id')?.value ?? ''),
      'agora.enabled': toBool(map.get('agora.enabled')?.value ?? true),
      'iyzipay.base_url': String(map.get('iyzipay.base_url')?.value ?? 'https://sandbox-api.iyzipay.com'),
      'iyzipay.enabled': toBool(map.get('iyzipay.enabled')?.value ?? true),
    });
  }, [settings]);

  const busy = isLoading || isFetching || isSaving;

  const handleSave = async () => {
    try {
      await bulkUpsert({
        items: [
          { key: 'agora.app_id', value: form['agora.app_id'].trim() },
          { key: 'agora.enabled', value: form['agora.enabled'] ? '1' : '0' },
          { key: 'iyzipay.base_url', value: form['iyzipay.base_url'].trim() },
          { key: 'iyzipay.enabled', value: form['iyzipay.enabled'] ? '1' : '0' },
        ],
      }).unwrap();
      toast.success(t('admin.common.saved'));
      await refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || t('admin.common.error'));
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Agora SDK ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agora SDK — Sesli Görüşme</CardTitle>
          <CardDescription>
            Uygulama içi sesli görüşme ayarları. App Certificate ve token üretimi backend
            .env dosyasında yönetilir.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="agora-enabled"
              checked={form['agora.enabled']}
              onCheckedChange={(v) => setForm((p) => ({ ...p, 'agora.enabled': v }))}
              disabled={busy}
            />
            <Label htmlFor="agora-enabled" className="text-sm">
              Agora entegrasyonu aktif
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agora-app-id" className="text-sm">
              Agora App ID
              <Badge variant="secondary" className="ml-2 text-xs">Non-secret</Badge>
            </Label>
            <Input
              id="agora-app-id"
              value={form['agora.app_id']}
              onChange={(e) => setForm((p) => ({ ...p, 'agora.app_id': e.target.value }))}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">
              Agora Console → Project Management → App ID. Non-secret, mobil uygulamaya iletilir.
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* ── Iyzipay ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Iyzipay — Ödeme Sistemi</CardTitle>
          <CardDescription>
            API Key ve Secret Key backend .env dosyasında yönetilir. Burada yalnızca ortam
            seçimi yapılır.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="iyzipay-enabled"
              checked={form['iyzipay.enabled']}
              onCheckedChange={(v) => setForm((p) => ({ ...p, 'iyzipay.enabled': v }))}
              disabled={busy}
            />
            <Label htmlFor="iyzipay-enabled" className="text-sm">
              Iyzipay entegrasyonu aktif
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="iyzipay-base-url" className="text-sm">
              API Base URL
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={form['iyzipay.base_url'] === 'https://sandbox-api.iyzipay.com' ? 'default' : 'outline'}
                size="sm"
                disabled={busy}
                onClick={() => setForm((p) => ({ ...p, 'iyzipay.base_url': 'https://sandbox-api.iyzipay.com' }))}
              >
                Sandbox
              </Button>
              <Button
                type="button"
                variant={form['iyzipay.base_url'] === 'https://api.iyzipay.com' ? 'default' : 'outline'}
                size="sm"
                disabled={busy}
                onClick={() => setForm((p) => ({ ...p, 'iyzipay.base_url': 'https://api.iyzipay.com' }))}
              >
                Production
              </Button>
            </div>
            <Input
              id="iyzipay-base-url"
              value={form['iyzipay.base_url']}
              onChange={(e) => setForm((p) => ({ ...p, 'iyzipay.base_url': e.target.value }))}
              placeholder="https://sandbox-api.iyzipay.com"
              disabled={busy}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => void refetch()} disabled={busy}>
            {t('admin.common.refresh')}
          </Button>
          <Button type="button" onClick={handleSave} disabled={busy}>
            {isSaving ? t('admin.common.saving') : t('admin.common.save')}
          </Button>
        </div>
      </div>
    </div>
  );
};
