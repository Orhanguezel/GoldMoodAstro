// =============================================================
// FILE: src/app/(main)/admin/(admin)/chat/components/ChatSettingsPanel.tsx
// Chat & AI Support Settings Panel
// Chat settings
// =============================================================

'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import {
  useListSiteSettingsAdminQuery,
  useBulkUpsertSiteSettingsAdminMutation,
  useUpdateSiteSettingAdminMutation,
} from '@/integrations/hooks';
import type { SiteSettingRow, UpsertSettingBody, ValueType } from '@/integrations/shared';

// ─── Setting keys ────────────────────────────────────────────

const CHAT_KEYS = [
  'chat_ai_enabled',
  'chat_widget_enabled',
  'chat_ai_default_provider',
  'chat_ai_provider_order',
  'chat_ai_system_prompt',
  'chat_ai_offer_url',
  // Groq
  'chat_ai_groq_api_key',
  'chat_ai_groq_model',
  'chat_ai_groq_api_base',
  // xAI / Grok
  'chat_ai_xai_api_key',
  'chat_ai_xai_model',
  'chat_ai_xai_api_base',
  // OpenAI
  'chat_ai_openai_api_key',
  'chat_ai_openai_model',
  'chat_ai_openai_api_base',
  // Anthropic
  'chat_ai_anthropic_api_key',
  'chat_ai_anthropic_model',
] as const;

type ChatKey = (typeof CHAT_KEYS)[number];

const CHAT_BOOL_KEYS = new Set<ChatKey>([
  'chat_ai_enabled',
  'chat_widget_enabled',
]);

type ChatSettingsModel = Record<ChatKey, string>;

const defaults: ChatSettingsModel = {
  chat_ai_enabled: 'true',
  chat_widget_enabled: 'true',
  chat_ai_default_provider: 'auto',
  chat_ai_provider_order: 'grok,openai,anthropic',
  chat_ai_system_prompt: '',
  chat_ai_offer_url: '',
  // Groq
  chat_ai_groq_api_key: '',
  chat_ai_groq_model: 'llama-3.3-70b-versatile',
  chat_ai_groq_api_base: 'https://api.groq.com/openai/v1',
  // xAI / Grok
  chat_ai_xai_api_key: '',
  chat_ai_xai_model: 'grok-2-latest',
  chat_ai_xai_api_base: 'https://api.x.ai/v1',
  // OpenAI
  chat_ai_openai_api_key: '',
  chat_ai_openai_model: 'gpt-4o-mini',
  chat_ai_openai_api_base: 'https://api.openai.com/v1',
  // Anthropic
  chat_ai_anthropic_api_key: '',
  chat_ai_anthropic_model: 'claude-3-5-haiku-latest',
};

// ─── Helpers ─────────────────────────────────────────────────

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

// ─── API Key Input (mask/unmask) ─────────────────────────────

function ApiKeyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10 font-mono text-xs"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────

export default function ChatSettingsPanel() {
  const t = useAdminT('admin.chat');
  const { localeOptions, defaultLocaleFromDb, coerceLocale } = useAdminLocales();
  const { data: rows, isLoading, isFetching } = useListSiteSettingsAdminQuery(undefined);
  const [bulkUpsert, { isLoading: saving }] = useBulkUpsertSiteSettingsAdminMutation();
  const [updateSetting, updateState] = useUpdateSiteSettingAdminMutation();

  const [model, setModel] = React.useState<ChatSettingsModel>(defaults);
  const [welcomeByLocale, setWelcomeByLocale] = React.useState<Record<string, string>>({});
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    if (!rows || initialized) return;

    const m: ChatSettingsModel = { ...defaults };

    for (const item of rows as SiteSettingRow[]) {
      const rawKey = String(item.key ?? '').trim();
      if (rawKey === 'chat_ai_welcome_message') continue;
      const k = rawKey as ChatKey;
      if (!CHAT_KEYS.includes(k)) continue;

      const v: unknown = item.value;

      if (CHAT_BOOL_KEYS.has(k)) {
        m[k] = boolToDb(toBoolish(v));
      } else {
        m[k] = v == null ? '' : String(v);
      }
    }

    const localeMap: Record<string, string> = {};
    for (const item of rows as SiteSettingRow[]) {
      if (String(item.key ?? '') !== 'chat_ai_welcome_message') continue;
      const locale = coerceLocale(item.locale, defaultLocaleFromDb);
      if (!locale) continue;
      localeMap[locale] = item.value == null ? '' : String(item.value);
    }

    setModel(m);
    setWelcomeByLocale(localeMap);
    setInitialized(true);
  }, [rows, initialized, coerceLocale, defaultLocaleFromDb]);

  const initialLoading = !initialized && (isLoading || isFetching);

  const setDbFlag = (key: ChatKey, v: boolean) => {
    setModel((prev) => ({ ...prev, [key]: boolToDb(v) }));
  };

  const setStr = (key: ChatKey, v: string) => {
    setModel((prev) => ({ ...prev, [key]: v }));
  };

  const handleSave = async () => {
    try {
      const items: UpsertSettingBody[] = (
        Object.entries(model) as Array<[ChatKey, string]>
      ).map(([key, value]) => ({
        key,
        value: CHAT_BOOL_KEYS.has(key) ? (toBoolish(value) ? 'true' : 'false') : value,
        value_type: 'string' as ValueType,
        group: null,
        description: null,
      }));

      await bulkUpsert({ items }).unwrap();
      const localesToSave = localeOptions.length
        ? localeOptions.map((opt) => opt.value)
        : [coerceLocale('', defaultLocaleFromDb)].filter(Boolean);

      await Promise.all(
        localesToSave.map((locale) =>
          updateSetting({
            key: 'chat_ai_welcome_message',
            locale,
            value: String(welcomeByLocale[locale] ?? '').trim(),
          }).unwrap(),
        ),
      );
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
      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('settings.generalTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label className="text-sm font-medium">{t('settings.aiEnabled')}</Label>
              <p className="text-xs text-muted-foreground">{t('settings.aiEnabledDesc')}</p>
            </div>
            <Switch
              checked={toBoolish(model.chat_ai_enabled)}
              onCheckedChange={(v: boolean) => setDbFlag('chat_ai_enabled', v)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label className="text-sm font-medium">{t('settings.widgetEnabled')}</Label>
              <p className="text-xs text-muted-foreground">{t('settings.widgetEnabledDesc')}</p>
            </div>
            <Switch
              checked={toBoolish(model.chat_widget_enabled)}
              onCheckedChange={(v: boolean) => setDbFlag('chat_widget_enabled', v)}
            />
          </div>

          <div className="space-y-1">
            <Label>{t('settings.defaultProvider')}</Label>
            <Select
              value={model.chat_ai_default_provider}
              onValueChange={(v) => setStr('chat_ai_default_provider', v)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="grok">Grok / Groq</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>{t('settings.providerOrder')}</Label>
            <Input
              value={model.chat_ai_provider_order}
              onChange={(e) => setStr('chat_ai_provider_order', e.target.value)}
              placeholder="grok,openai,anthropic"
            />
            <p className="text-xs text-muted-foreground">{t('settings.providerOrderDesc')}</p>
          </div>

          <div className="space-y-1">
            <Label>{t('settings.offerUrl')}</Label>
            <Input
              value={model.chat_ai_offer_url}
              onChange={(e) => setStr('chat_ai_offer_url', e.target.value)}
              placeholder="https://example.com/{locale}/offer"
            />
            <p className="text-xs text-muted-foreground">{t('settings.offerUrlDesc')}</p>
          </div>
        </CardContent>
      </Card>

      {/* AI Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('settings.providersTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Groq */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <Label className="text-sm font-semibold">Groq (Llama)</Label>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">API Key</Label>
              <ApiKeyInput
                value={model.chat_ai_groq_api_key}
                onChange={(v) => setStr('chat_ai_groq_api_key', v)}
                placeholder="gsk_..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Model</Label>
                <Input
                  value={model.chat_ai_groq_model}
                  onChange={(e) => setStr('chat_ai_groq_model', e.target.value)}
                  placeholder="llama-3.3-70b-versatile"
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">API Base</Label>
                <Input
                  value={model.chat_ai_groq_api_base}
                  onChange={(e) => setStr('chat_ai_groq_api_base', e.target.value)}
                  placeholder="https://api.groq.com/openai/v1"
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* xAI / Grok */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <Label className="text-sm font-semibold">xAI / Grok</Label>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">API Key</Label>
              <ApiKeyInput
                value={model.chat_ai_xai_api_key}
                onChange={(v) => setStr('chat_ai_xai_api_key', v)}
                placeholder="xai-..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Model</Label>
                <Input
                  value={model.chat_ai_xai_model}
                  onChange={(e) => setStr('chat_ai_xai_model', e.target.value)}
                  placeholder="grok-2-latest"
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">API Base</Label>
                <Input
                  value={model.chat_ai_xai_api_base}
                  onChange={(e) => setStr('chat_ai_xai_api_base', e.target.value)}
                  placeholder="https://api.x.ai/v1"
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* OpenAI */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <Label className="text-sm font-semibold">OpenAI</Label>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">API Key</Label>
              <ApiKeyInput
                value={model.chat_ai_openai_api_key}
                onChange={(v) => setStr('chat_ai_openai_api_key', v)}
                placeholder="sk-..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Model</Label>
                <Input
                  value={model.chat_ai_openai_model}
                  onChange={(e) => setStr('chat_ai_openai_model', e.target.value)}
                  placeholder="gpt-4o-mini"
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">API Base</Label>
                <Input
                  value={model.chat_ai_openai_api_base}
                  onChange={(e) => setStr('chat_ai_openai_api_base', e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Anthropic */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <Label className="text-sm font-semibold">Anthropic</Label>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">API Key</Label>
              <ApiKeyInput
                value={model.chat_ai_anthropic_api_key}
                onChange={(v) => setStr('chat_ai_anthropic_api_key', v)}
                placeholder="sk-ant-..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Model</Label>
              <Input
                value={model.chat_ai_anthropic_model}
                onChange={(e) => setStr('chat_ai_anthropic_model', e.target.value)}
                placeholder="claude-3-5-haiku-latest"
                className="font-mono text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('settings.systemPromptTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <Textarea
            rows={5}
            value={model.chat_ai_system_prompt}
            onChange={(e) => setStr('chat_ai_system_prompt', e.target.value)}
            placeholder={t('settings.systemPromptPlaceholder')}
          />
          <p className="text-xs text-muted-foreground">{t('settings.systemPromptDesc')}</p>
        </CardContent>
      </Card>

      {/* Welcome Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('settings.welcomeTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(localeOptions.length ? localeOptions : [{ value: coerceLocale('', defaultLocaleFromDb), label: 'Default' }])
            .filter((opt) => !!opt.value)
            .map((opt) => (
              <div className="space-y-1" key={opt.value}>
                <Label>{opt.label || opt.value.toUpperCase()}</Label>
                <Textarea
                  rows={2}
                  value={welcomeByLocale[opt.value] ?? ''}
                  onChange={(e) =>
                    setWelcomeByLocale((prev) => ({
                      ...prev,
                      [opt.value]: e.target.value,
                    }))
                  }
                  placeholder={t('settings.welcomePlaceholder')}
                />
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || updateState.isLoading} className="gap-2">
          <Save className="h-4 w-4" />
          {saving || updateState.isLoading ? t('settings.saving') : t('settings.save')}
        </Button>
      </div>
    </div>
  );
}
