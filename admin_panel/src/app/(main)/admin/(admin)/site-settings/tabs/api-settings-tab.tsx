'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/site-settings/tabs/api-settings-tab.tsx
// API & Entegrasyon Ayarları (GLOBAL)
// - Shadcn/ui components
// - Responsive design
// - TypeScript safe
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';
import { RefreshCcw } from 'lucide-react';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
} from '@/integrations/hooks';

import type { SettingValue, SiteSetting } from '@/integrations/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type ApiSettingsTabProps = {
  locale: string;
};

const API_KEYS = [
  'google_client_id',
  'google_client_secret',
  'gtm_container_id',
  'ga4_measurement_id',
  'cookie_consent',
  'livekit_url',
  'livekit_api_key',
  'livekit_api_secret',
  'firebase_project_id',
  'firebase_client_email',
  'firebase_private_key',
  'iyzipay_api_key',
  'iyzipay_secret_key',
  'iyzipay_base_url',
] as const;

type ApiKey = (typeof API_KEYS)[number];
type ApiForm = Record<ApiKey, string>;

const EMPTY_FORM: ApiForm = {
  google_client_id: '',
  google_client_secret: '',
  gtm_container_id: '',
  ga4_measurement_id: '',
  cookie_consent: '',
  livekit_url: '',
  livekit_api_key: '',
  livekit_api_secret: '',
  firebase_project_id: '',
  firebase_client_email: '',
  firebase_private_key: '',
  iyzipay_api_key: '',
  iyzipay_secret_key: '',
  iyzipay_base_url: '',
};

function valueToString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function toMap(settings?: any) {
  const map = new Map<string, any>();
  if (settings) for (const s of settings) map.set(s.key, s);
  return map;
}

function tryParseJsonOrString(input: string): SettingValue {
  const s = String(input ?? '').trim();
  if (!s) return '' as any;
  try {
    return JSON.parse(s) as any;
  } catch {
    return s as any;
  }
}

export const ApiSettingsTab: React.FC<ApiSettingsTabProps> = ({ locale }) => {
  const {
    data: settings,
    isLoading,
    isFetching,
    refetch,
  } = useListSiteSettingsAdminQuery({
    keys: API_KEYS as unknown as string[],
    locale: '*', // ✅ Global settings
  } as any);

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();

  const [form, setForm] = React.useState<ApiForm>(EMPTY_FORM);

  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  React.useEffect(() => {
    const map = toMap(settings);
    const next: ApiForm = { ...EMPTY_FORM };
    API_KEYS.forEach((k) => {
      next[k] = valueToString(map.get(k)?.value);
    });
    setForm(next);
  }, [settings]);

  const loading = isLoading || isFetching;
  const busy = loading || isSaving;

  const handleChange = (field: ApiKey, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSave = async () => {
    try {
      for (const key of API_KEYS) {
        let value: SettingValue = form[key].trim();
        if (key === 'cookie_consent') {
          value = tryParseJsonOrString(form.cookie_consent);
        }
        await updateSetting({ key, value, locale: '*' }).unwrap();
      }

      toast.success(t('admin.siteSettings.api.saved'));
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message || err?.message || t('admin.siteSettings.api.saveError');
      toast.error(msg);
    }
  };

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{t('admin.siteSettings.api.title')}</CardTitle>
            <CardDescription>
              {t('admin.siteSettings.api.description')}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{t('admin.siteSettings.api.badge')}</Badge>
            {locale && <Badge variant="outline">{t('admin.siteSettings.api.uiBadge', { locale })}</Badge>}
            {busy && <Badge variant="outline">{t('admin.siteSettings.messages.loading')}</Badge>}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={busy}
              title={t('admin.siteSettings.actions.refresh')}
            >
              <RefreshCcw className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Google Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Google OAuth & Analytics</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="google_client_id">{t('admin.siteSettings.api.googleClientId')}</Label>
              <Input
                id="google_client_id"
                value={form.google_client_id}
                onChange={(e) => handleChange('google_client_id', e.target.value)}
                placeholder="Google OAuth Client ID"
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="google_client_secret">{t('admin.siteSettings.api.googleClientSecret')}</Label>
              <Input
                id="google_client_secret"
                type="password"
                value={form.google_client_secret}
                onChange={(e) => handleChange('google_client_secret', e.target.value)}
                placeholder="Google OAuth Client Secret"
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gtm_container_id">{t('admin.siteSettings.api.gtmContainerId')}</Label>
              <Input
                id="gtm_container_id"
                value={form.gtm_container_id}
                onChange={(e) => handleChange('gtm_container_id', e.target.value)}
                placeholder="GTM-XXXXXXX"
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ga4_measurement_id">{t('admin.siteSettings.api.ga4MeasurementId')}</Label>
              <Input
                id="ga4_measurement_id"
                value={form.ga4_measurement_id}
                onChange={(e) => handleChange('ga4_measurement_id', e.target.value)}
                placeholder="G-XXXXXXXXXX"
                disabled={busy}
              />
            </div>
          </div>
        </div>

        {/* LiveKit Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">LiveKit (Sesli / Görüntülü Görüşme)</h3>
          <p className="text-xs text-muted-foreground">
            Sunucu tarafı .env dosyasından okunur — bu alanlar referans amaçlı kayıt
            tutar, backend ayarını .env'den alır.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="livekit_url">{t('admin.siteSettings.api.livekitUrl', {}, 'LiveKit URL')}</Label>
              <Input
                id="livekit_url"
                value={form.livekit_url}
                onChange={(e) => handleChange('livekit_url', e.target.value)}
                placeholder="wss://your-project.livekit.cloud"
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="livekit_api_key">{t('admin.siteSettings.api.livekitApiKey', {}, 'LiveKit API Key')}</Label>
              <Input
                id="livekit_api_key"
                value={form.livekit_api_key}
                onChange={(e) => handleChange('livekit_api_key', e.target.value)}
                placeholder="API Key"
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="livekit_api_secret">{t('admin.siteSettings.api.livekitApiSecret', {}, 'LiveKit API Secret')}</Label>
              <Input
                id="livekit_api_secret"
                type="password"
                value={form.livekit_api_secret}
                onChange={(e) => handleChange('livekit_api_secret', e.target.value)}
                placeholder="API Secret"
                disabled={busy}
              />
            </div>
          </div>
        </div>

        {/* Firebase Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Firebase (Push Bildirim)</h3>
          <p className="text-xs text-muted-foreground">
            Service account credentials .env dosyasından okunur. Bu alanlar referans
            içindir — gerçek değerler sunucudaki .env içinde tutulur.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firebase_project_id">{t('admin.siteSettings.api.firebaseProjectId', {}, 'Firebase Project ID')}</Label>
              <Input
                id="firebase_project_id"
                value={form.firebase_project_id}
                onChange={(e) => handleChange('firebase_project_id', e.target.value)}
                placeholder="Project ID"
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firebase_client_email">{t('admin.siteSettings.api.firebaseClientEmail', {}, 'Firebase Client Email')}</Label>
              <Input
                id="firebase_client_email"
                value={form.firebase_client_email}
                onChange={(e) => handleChange('firebase_client_email', e.target.value)}
                placeholder="client@project.iam.gserviceaccount.com"
                disabled={busy}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="firebase_private_key">{t('admin.siteSettings.api.firebasePrivateKey', {}, 'Firebase Private Key')}</Label>
              <Textarea
                id="firebase_private_key"
                rows={4}
                value={form.firebase_private_key}
                onChange={(e) => handleChange('firebase_private_key', e.target.value)}
                placeholder="-----BEGIN PRIVATE KEY-----\n..."
                disabled={busy}
                className="font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Iyzipay Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Iyzipay (Ödeme)</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="iyzipay_api_key">{t('admin.siteSettings.api.iyzipayApiKey', {}, 'Iyzipay API Key')}</Label>
              <Input
                id="iyzipay_api_key"
                value={form.iyzipay_api_key}
                onChange={(e) => handleChange('iyzipay_api_key', e.target.value)}
                placeholder="API Key"
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iyzipay_secret_key">{t('admin.siteSettings.api.iyzipaySecretKey', {}, 'Iyzipay Secret Key')}</Label>
              <Input
                id="iyzipay_secret_key"
                type="password"
                value={form.iyzipay_secret_key}
                onChange={(e) => handleChange('iyzipay_secret_key', e.target.value)}
                placeholder="Secret Key"
                disabled={busy}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="iyzipay_base_url">{t('admin.siteSettings.api.iyzipayBaseUrl', {}, 'Iyzipay Base URL')}</Label>
              <Input
                id="iyzipay_base_url"
                value={form.iyzipay_base_url}
                onChange={(e) => handleChange('iyzipay_base_url', e.target.value)}
                placeholder="https://sandbox-api.iyzipay.com"
                disabled={busy}
              />
            </div>
          </div>
        </div>

        {/* Cookie Consent */}
        <div className="space-y-2 pt-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Diğer</h3>
          <Label htmlFor="cookie_consent">
            {t('admin.siteSettings.api.cookieConsent')}
            <code className="ml-2 text-xs text-muted-foreground">(cookie_consent)</code>
          </Label>
          <Textarea
            id="cookie_consent"
            rows={6}
            value={form.cookie_consent}
            onChange={(e) => handleChange('cookie_consent', e.target.value)}
            placeholder={t('admin.siteSettings.api.cookieConsentPlaceholder')}
            disabled={busy}
            className="font-mono text-xs"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button type="button" onClick={handleSave} disabled={busy} size="lg" className="w-full md:w-auto">
            {isSaving ? t('admin.siteSettings.actions.saving') : t('admin.siteSettings.actions.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
