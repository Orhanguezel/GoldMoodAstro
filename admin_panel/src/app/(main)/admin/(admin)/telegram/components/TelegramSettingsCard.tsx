// =============================================================
// FILE: src/app/(main)/admin/(admin)/telegram/components/TelegramSettingsCard.tsx
// Telegram Settings Card (booking events, i18n, theme tokens)
// Telegram settings
// =============================================================

'use client';

import * as React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

import { toast } from 'sonner';

import type { Dispatch, SetStateAction } from 'react';
import { useTelegramSendMutation } from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import type { TelegramSettingsModel } from './TelegramSettingsPanel';

type Props = {
  settings: TelegramSettingsModel;
  setSettings: Dispatch<SetStateAction<TelegramSettingsModel>>;
};

type TemplateVars = Record<string, string>;

const toBoolish = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase();
    return s === '1' || s === 'true' || s === 'yes' || s === 'on';
  }
  return false;
};

const boolToDb = (b: boolean): 'true' | 'false' => (b ? 'true' : 'false');

function applyTemplate(template: string, vars: TemplateVars): string {
  const tpl = String(template ?? '');
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m: string, keyRaw: string): string => {
    const key = String(keyRaw);
    return typeof vars[key] === 'string' ? vars[key] : '';
  });
}

type EventToggleDef = {
  settingsKey: keyof TelegramSettingsModel;
  i18nKey: string;
};

const EVENT_TOGGLES: EventToggleDef[] = [
  { settingsKey: 'telegram_event_new_booking_enabled', i18nKey: 'events.newBooking' },
  { settingsKey: 'telegram_event_booking_confirmed_enabled', i18nKey: 'events.bookingConfirmed' },
  { settingsKey: 'telegram_event_booking_rejected_enabled', i18nKey: 'events.bookingRejected' },
  { settingsKey: 'telegram_event_booking_cancelled_enabled', i18nKey: 'events.bookingCancelled' },
  { settingsKey: 'telegram_event_booking_status_changed_enabled', i18nKey: 'events.bookingStatusChanged' },
  { settingsKey: 'telegram_event_new_contact_enabled', i18nKey: 'events.newContact' },
];

type TemplateDef = {
  settingsKey: keyof TelegramSettingsModel;
  titleKey: string;
  varsKey: string;
};

const TEMPLATE_DEFS: TemplateDef[] = [
  {
    settingsKey: 'telegram_template_new_booking',
    titleKey: 'templates.newBooking',
    varsKey: 'templates.newBookingVars',
  },
  {
    settingsKey: 'telegram_template_booking_confirmed',
    titleKey: 'templates.bookingConfirmed',
    varsKey: 'templates.bookingConfirmedVars',
  },
  {
    settingsKey: 'telegram_template_booking_rejected',
    titleKey: 'templates.bookingRejected',
    varsKey: 'templates.bookingRejectedVars',
  },
  {
    settingsKey: 'telegram_template_booking_cancelled',
    titleKey: 'templates.bookingCancelled',
    varsKey: 'templates.bookingCancelledVars',
  },
  {
    settingsKey: 'telegram_template_booking_status_changed',
    titleKey: 'templates.bookingStatusChanged',
    varsKey: 'templates.bookingStatusChangedVars',
  },
  {
    settingsKey: 'telegram_template_new_contact',
    titleKey: 'templates.newContact',
    varsKey: 'templates.newContactVars',
  },
];

function pickErrorMessage(err: unknown): string | undefined {
  const e = err as {
    data?: { message?: unknown; error?: { message?: unknown } };
    message?: unknown;
  };
  const msg1 = e?.data?.message;
  if (typeof msg1 === 'string' && msg1.trim()) return msg1;
  const msg2 = e?.data?.error?.message;
  if (typeof msg2 === 'string' && msg2.trim()) return msg2;
  const msg3 = e?.message;
  if (typeof msg3 === 'string' && msg3.trim()) return msg3;
  return undefined;
}

export default function TelegramSettingsCard({ settings, setSettings }: Props) {
  const t = useAdminT('admin.telegram');
  const [telegramSend, { isLoading: testing }] = useTelegramSendMutation();

  const previewVars = React.useMemo<TemplateVars>(
    () => ({
      customer_name: 'Max Mustermann',
      customer_email: 'max@example.com',
      customer_phone: '+49 170 1234567',
      appointment_date: '2026-03-15',
      appointment_time: '14:30',
      service_title: 'Klassische Massage 60 Min.',
      resource_title: 'Therapeut A / Raum 1',
      customer_message: 'Bitte um Rückruf.',
      decision_note: 'Bestätigt per Admin.',
      status_before: 'new',
      status_after: 'confirmed',
      name: 'Erika Muster',
      email: 'erika@example.com',
      phone: '+49 171 9876543',
      subject: 'Terminanfrage',
      message: 'Ich hätte gerne einen Termin für nächste Woche.',
    }),
    [],
  );

  const telegramEnabled = toBoolish(settings.telegram_notifications_enabled);
  const webhookEnabled = toBoolish(settings.telegram_webhook_enabled);

  const targetChatId = (
    settings.telegram_chat_id ||
    settings.telegram_default_chat_id ||
    ''
  ).trim();
  const canTest =
    telegramEnabled && settings.telegram_bot_token.trim().length > 0 && targetChatId.length > 0;

  const setDbFlag = (key: keyof TelegramSettingsModel, v: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: boolToDb(v) }));
  };

  const setStr = (key: keyof TelegramSettingsModel, v: string) => {
    setSettings((prev) => ({ ...prev, [key]: v }));
  };

  const sendTest = async (text: string) => {
    const msg = String(text ?? '').trim();
    if (!msg) return toast.error(t('settings.testEmpty'));
    if (!canTest) return toast.error(t('settings.testRequirements'));

    try {
      const res = await telegramSend({
        title: 'Telegram Test',
        message: msg,
        type: 'test',
        chat_id: targetChatId,
        bot_token: settings.telegram_bot_token,
      }).unwrap();

      const ok =
        !!res && typeof res === 'object' && 'ok' in res && Boolean((res as { ok?: unknown }).ok);

      if (ok) toast.success(t('settings.testSent'));
      else toast.error(t('settings.testFailed'));
    } catch (err) {
      toast.error(`${t('settings.testFailed')}: ${pickErrorMessage(err) ?? ''}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.title')}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* --- Global toggles --- */}
        <div className="rounded-lg border border-border p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <Label className="text-base font-medium">{t('settings.enableNotifications')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('settings.enableNotificationsDesc')}
              </p>
            </div>
            <Switch
              checked={telegramEnabled}
              onCheckedChange={(v: boolean) => setDbFlag('telegram_notifications_enabled', v)}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <Label className="text-base font-medium">{t('settings.enableWebhook')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('settings.enableWebhookDesc')}
              </p>
            </div>
            <Switch
              checked={webhookEnabled}
              onCheckedChange={(v: boolean) => setDbFlag('telegram_webhook_enabled', v)}
            />
          </div>
        </div>

        {/* --- Bot credentials --- */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>{t('settings.botToken')}</Label>
            <Input
              type="password"
              value={settings.telegram_bot_token}
              onChange={(e) => setStr('telegram_bot_token', e.target.value)}
              placeholder="123456:ABC-DEF..."
            />
          </div>

          <div className="space-y-2">
            <Label>{t('settings.primaryChatId')}</Label>
            <Input
              value={settings.telegram_chat_id}
              onChange={(e) => setStr('telegram_chat_id', e.target.value)}
              placeholder="-1001234567890"
            />
          </div>

          <div className="space-y-2">
            <Label>{t('settings.defaultChatId')}</Label>
            <Input
              value={settings.telegram_default_chat_id}
              onChange={(e) => setStr('telegram_default_chat_id', e.target.value)}
              placeholder="-1001234567890"
            />
          </div>
        </div>

        {/* --- Event toggles --- */}
        <div className="rounded-lg border border-border p-4 space-y-4">
          <Label className="text-base font-medium">{t('settings.events.title')}</Label>

          {EVENT_TOGGLES.map((ev) => (
            <div key={ev.settingsKey} className="flex items-center justify-between gap-3">
              <Label className="text-sm font-medium">{t(`settings.${ev.i18nKey}`)}</Label>
              <Switch
                checked={toBoolish(settings[ev.settingsKey])}
                onCheckedChange={(v: boolean) => setDbFlag(ev.settingsKey, v)}
              />
            </div>
          ))}
        </div>

        {/* --- Templates --- */}
        <div className="space-y-4">
          <Label className="text-base font-medium">{t('settings.templates.title')}</Label>

          {TEMPLATE_DEFS.map((def) => {
            const tpl = settings[def.settingsKey] ?? '';
            const preview = applyTemplate(tpl, previewVars);

            return (
              <div key={def.settingsKey} className="space-y-3 rounded-lg border border-border p-4">
                <div className="space-y-1">
                  <Label className="text-base font-medium">{t(`settings.${def.titleKey}`)}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.variables')}: {t(`settings.${def.varsKey}`)}
                  </p>
                </div>

                <Textarea
                  rows={8}
                  value={tpl}
                  onChange={(e) => setStr(def.settingsKey, e.target.value)}
                />

                <div className="space-y-2">
                  <Label>{t('settings.preview')}</Label>
                  <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs text-muted-foreground">
                    {preview}
                  </pre>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    disabled={!canTest || testing}
                    onClick={() => void sendTest(preview)}
                  >
                    {testing ? t('settings.testSending') : t('settings.testSend')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
