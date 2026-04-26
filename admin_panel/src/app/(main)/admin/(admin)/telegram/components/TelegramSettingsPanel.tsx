// =============================================================
// FILE: src/app/(main)/admin/(admin)/telegram/components/TelegramSettingsPanel.tsx
// Telegram Settings Panel (booking events, i18n)
// Telegram settings
// =============================================================

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import TelegramSettingsCard from './TelegramSettingsCard';

import {
  useListSiteSettingsAdminQuery,
  useBulkUpsertSiteSettingsAdminMutation,
} from '@/integrations/hooks';

import type { SiteSettingRow, UpsertSettingBody, ValueType } from '@/integrations/shared';

// --- Booking-aligned keys (matches 110.2_telegram_settings.seed.sql) ---
const TELEGRAM_KEYS = [
  'telegram_notifications_enabled',
  'telegram_webhook_enabled',

  'telegram_bot_token',
  'telegram_chat_id',
  'telegram_default_chat_id',

  'telegram_event_new_booking_enabled',
  'telegram_event_booking_confirmed_enabled',
  'telegram_event_booking_rejected_enabled',
  'telegram_event_booking_cancelled_enabled',
  'telegram_event_booking_status_changed_enabled',
  'telegram_event_new_contact_enabled',

  'telegram_template_new_booking',
  'telegram_template_booking_confirmed',
  'telegram_template_booking_rejected',
  'telegram_template_booking_cancelled',
  'telegram_template_booking_status_changed',
  'telegram_template_new_contact',
] as const;

type TelegramKey = (typeof TELEGRAM_KEYS)[number];

const TELEGRAM_BOOL_KEYS = new Set<TelegramKey>([
  'telegram_notifications_enabled',
  'telegram_webhook_enabled',
  'telegram_event_new_booking_enabled',
  'telegram_event_booking_confirmed_enabled',
  'telegram_event_booking_rejected_enabled',
  'telegram_event_booking_cancelled_enabled',
  'telegram_event_booking_status_changed_enabled',
  'telegram_event_new_contact_enabled',
]);

export type TelegramSettingsModel = Record<TelegramKey, string>;

const defaults: TelegramSettingsModel = {
  telegram_notifications_enabled: 'false',
  telegram_webhook_enabled: 'false',

  telegram_bot_token: '',
  telegram_chat_id: '',
  telegram_default_chat_id: '',

  telegram_event_new_booking_enabled: 'false',
  telegram_event_booking_confirmed_enabled: 'false',
  telegram_event_booking_rejected_enabled: 'false',
  telegram_event_booking_cancelled_enabled: 'false',
  telegram_event_booking_status_changed_enabled: 'false',
  telegram_event_new_contact_enabled: 'false',

  telegram_template_new_booking: '',
  telegram_template_booking_confirmed: '',
  telegram_template_booking_rejected: '',
  telegram_template_booking_cancelled: '',
  telegram_template_booking_status_changed: '',
  telegram_template_new_contact: '',
};

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

const toBoolish = (v: unknown): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === '1' || s === 'true' || s === 'yes' || s === 'on';
  }
  return false;
};

const boolToDb = (b: boolean): 'true' | 'false' => (b ? 'true' : 'false');

const normalizeTemplateValue = (v: unknown): string => {
  if (isObject(v) && 'template' in v) return String((v as { template?: unknown }).template ?? '');
  return v == null ? '' : String(v);
};

export default function TelegramSettingsPanel() {
  const t = useAdminT('admin.telegram');
  const { data: rows, isLoading, isFetching } = useListSiteSettingsAdminQuery(undefined);
  const [bulkUpsert, { isLoading: saving }] = useBulkUpsertSiteSettingsAdminMutation();

  const [model, setModel] = React.useState<TelegramSettingsModel>(defaults);
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    if (!rows || initialized) return;

    const m: TelegramSettingsModel = { ...defaults };

    for (const item of rows as SiteSettingRow[]) {
      const k = String(item.key ?? '') as TelegramKey;
      if (!TELEGRAM_KEYS.includes(k)) continue;

      let v: unknown = item.value;

      if (k.startsWith('telegram_template_')) v = normalizeTemplateValue(v);

      if (TELEGRAM_BOOL_KEYS.has(k)) {
        m[k] = boolToDb(toBoolish(v));
      } else {
        m[k] = v == null ? '' : String(v);
      }
    }

    setModel(m);
    setInitialized(true);
  }, [rows, initialized]);

  const initialLoading = !initialized && (isLoading || isFetching);

  const handleSave = async () => {
    try {
      const items: UpsertSettingBody[] = (
        Object.entries(model) as Array<[TelegramKey, string]>
      ).map(([key, value]) => ({
        key,
        value: TELEGRAM_BOOL_KEYS.has(key) ? (toBoolish(value) ? 'true' : 'false') : value,
        value_type: 'string' as ValueType,
        group: null,
        description: null,
      }));

      await bulkUpsert({ items }).unwrap();
      toast.success(t('settings.saved'));
    } catch (e) {
      console.error(e);
      toast.error((e as { message?: string })?.message || t('settings.saveError'));
    }
  };

  if (initialLoading) {
    return <div className="py-8 text-sm text-muted-foreground">{t('settings.loading')}</div>;
  }

  return (
    <div className="space-y-4">
      <TelegramSettingsCard settings={model} setSettings={setModel} />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? t('settings.saving') : t('settings.save')}
        </Button>
      </div>
    </div>
  );
}
