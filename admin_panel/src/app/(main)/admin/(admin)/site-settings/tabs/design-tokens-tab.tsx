'use client';

// =============================================================
// FILE: site-settings/tabs/design-tokens-tab.tsx
// Admin Design Token Editor — GoldMoodAstro
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';
import { RefreshCcw, Save, Palette } from 'lucide-react';

import {
  useGetSiteSettingAdminByKeyQuery,
  useUpdateSiteSettingAdminMutation,
} from '@/integrations/hooks';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// ── Types ──────────────────────────────────────────────────────

type ColorKeys =
  | 'brand_primary' | 'brand_primary_dark' | 'brand_secondary'
  | 'bg' | 'surface' | 'text' | 'text_muted' | 'border' | 'error' | 'success';

type TokenForm = {
  colors: Record<ColorKeys, string>;
  font_heading: string;
  font_body: string;
  radius_sm: string;
  radius_md: string;
  radius_lg: string;
  app_name: string;
  tagline_tr: string;
  tagline_en: string;
};

const DEFAULTS: TokenForm = {
  colors: {
    brand_primary: '#7B5EA7',
    brand_primary_dark: '#5C4480',
    brand_secondary: '#D4AF37',
    bg: '#0D0B1E',
    surface: '#1A1730',
    text: '#F0EBF8',
    text_muted: '#9F8EB8',
    border: '#2E2948',
    error: '#E84040',
    success: '#4CAF50',
  },
  font_heading: 'Playfair Display',
  font_body: 'Inter',
  radius_sm: '0.25rem',
  radius_md: '0.5rem',
  radius_lg: '1rem',
  app_name: 'GoldMoodAstro',
  tagline_tr: 'Evreni okuyun, hayati anlayin',
  tagline_en: 'Read the cosmos, understand life',
};

const COLOR_LABELS: Record<ColorKeys, string> = {
  brand_primary: 'Marka Rengi (Primary)',
  brand_primary_dark: 'Marka Rengi (Dark)',
  brand_secondary: 'Altın / Vurgu',
  bg: 'Arkaplan',
  surface: 'Yüzey',
  text: 'Metin',
  text_muted: 'İkincil Metin',
  border: 'Kenarlık',
  error: 'Hata Rengi',
  success: 'Başarı Rengi',
};

// ── Helpers ────────────────────────────────────────────────────

function parseTokens(raw: unknown): TokenForm {
  if (!raw) return { ...DEFAULTS };
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const c = obj?.colors || {};
    return {
      colors: {
        brand_primary: c.brand_primary || DEFAULTS.colors.brand_primary,
        brand_primary_dark: c.brand_primary_dark || DEFAULTS.colors.brand_primary_dark,
        brand_secondary: c.brand_secondary || DEFAULTS.colors.brand_secondary,
        bg: c.bg || DEFAULTS.colors.bg,
        surface: c.surface || DEFAULTS.colors.surface,
        text: c.text || DEFAULTS.colors.text,
        text_muted: c.text_muted || DEFAULTS.colors.text_muted,
        border: c.border || DEFAULTS.colors.border,
        error: c.error || DEFAULTS.colors.error,
        success: c.success || DEFAULTS.colors.success,
      },
      font_heading: obj?.typography?.font_heading || DEFAULTS.font_heading,
      font_body: obj?.typography?.font_body || DEFAULTS.font_body,
      radius_sm: obj?.radius?.sm || DEFAULTS.radius_sm,
      radius_md: obj?.radius?.md || DEFAULTS.radius_md,
      radius_lg: obj?.radius?.lg || DEFAULTS.radius_lg,
      app_name: obj?.branding?.app_name || DEFAULTS.app_name,
      tagline_tr: obj?.branding?.tagline_tr || DEFAULTS.tagline_tr,
      tagline_en: obj?.branding?.tagline_en || DEFAULTS.tagline_en,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function formToPayload(f: TokenForm) {
  return {
    version: '1',
    colors: { ...f.colors },
    typography: {
      font_heading: f.font_heading,
      font_body: f.font_body,
      font_mono: 'JetBrains Mono',
      scale: '1',
    },
    radius: {
      sm: f.radius_sm,
      md: f.radius_md,
      lg: f.radius_lg,
      full: '9999px',
    },
    branding: {
      app_name: f.app_name,
      tagline_tr: f.tagline_tr,
      tagline_en: f.tagline_en,
    },
  };
}

// ── Color Picker Row ───────────────────────────────────────────

function ColorRow({
  label, value, onChange, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-9 w-12 cursor-pointer rounded border border-input bg-background p-0.5 disabled:opacity-50"
      />
      <div className="flex-1 space-y-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-8 font-mono text-xs"
          placeholder="#000000"
        />
      </div>
      <div
        className="h-9 w-9 flex-shrink-0 rounded-md border border-border"
        style={{ backgroundColor: value }}
      />
    </div>
  );
}

// ── Preview Card ───────────────────────────────────────────────

function PreviewCard({ form }: { form: TokenForm }) {
  const c = form.colors;
  return (
    <div
      className="rounded-xl p-5 space-y-3 border text-sm"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
    >
      <div style={{ color: c.brand_primary, fontFamily: form.font_heading, fontSize: '1.1rem' }}>
        {form.app_name}
      </div>
      <p style={{ color: c.text, fontFamily: form.font_body }}>
        {form.tagline_tr}
      </p>
      <div className="flex gap-2 flex-wrap">
        <span
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: c.brand_primary, color: c.text, borderRadius: form.radius_lg }}
        >
          Birincil
        </span>
        <span
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: c.brand_secondary, color: c.bg, borderRadius: form.radius_lg }}
        >
          Altin
        </span>
        <span
          className="px-3 py-1 rounded-full text-xs font-medium border"
          style={{ borderColor: c.border, color: c.text_muted, borderRadius: form.radius_lg, backgroundColor: c.surface }}
        >
          Yuzey
        </span>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export const DesignTokensTab: React.FC = () => {
  const { data: settingRow, isLoading, isFetching, refetch } =
    useGetSiteSettingAdminByKeyQuery('design_tokens');

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();

  const [form, setForm] = React.useState<TokenForm>(DEFAULTS);

  React.useEffect(() => {
    if (settingRow?.value !== undefined) {
      setForm(parseTokens(settingRow.value));
    }
  }, [settingRow?.value]);

  const loading = isLoading || isFetching;
  const busy = loading || isSaving;

  const setColor = (key: ColorKeys, value: string) =>
    setForm((p) => ({ ...p, colors: { ...p.colors, [key]: value } }));

  const handleSave = async () => {
    try {
      await updateSetting({
        key: 'design_tokens',
        value: formToPayload(form),
        locale: '*',
      }).unwrap();
      toast.success('Design token\'lar kaydedildi. 5 dakika içinde frontend\'e yansır.');
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.data?.error || 'Kaydetme hatası.';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold flex items-center gap-2">
            <Palette className="size-4" />
            Design Token Editoru
          </h3>
          <p className="text-sm text-muted-foreground">
            Renk, yazi tipi ve radius degerleri backend&apos;de saklanir, frontend 5 dk cacheden okur.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Badge variant="outline">Yukleniyor...</Badge>}
          <Button type="button" variant="ghost" size="icon" onClick={() => refetch()} disabled={busy}>
            <RefreshCcw className="size-4" />
          </Button>
          <Button type="button" onClick={handleSave} disabled={busy} className="gap-2">
            <Save className="size-4" />
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="xl:col-span-2 space-y-6">
          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Renkler</CardTitle>
              <CardDescription>Marka ve UI renk paleti</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(Object.keys(COLOR_LABELS) as ColorKeys[]).map((key) => (
                <ColorRow
                  key={key}
                  label={COLOR_LABELS[key]}
                  value={form.colors[key]}
                  onChange={(v) => setColor(key, v)}
                  disabled={busy}
                />
              ))}
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Yazi Tipleri</CardTitle>
              <CardDescription>Baslik ve govde font aileleri (Google Fonts isimleri)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Baslik Fontu</Label>
                <Input
                  value={form.font_heading}
                  onChange={(e) => setForm((p) => ({ ...p, font_heading: e.target.value }))}
                  disabled={busy}
                  placeholder="Playfair Display"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Govde Fontu</Label>
                <Input
                  value={form.font_body}
                  onChange={(e) => setForm((p) => ({ ...p, font_body: e.target.value }))}
                  disabled={busy}
                  placeholder="Inter"
                />
              </div>
            </CardContent>
          </Card>

          {/* Radius */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kenar Yuvarlama (Radius)</CardTitle>
              <CardDescription>CSS rem degerleri (orn: 0.5rem, 1rem)</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              {(['radius_sm', 'radius_md', 'radius_lg'] as const).map((k) => (
                <div key={k} className="space-y-1.5">
                  <Label>{k.replace('radius_', '').toUpperCase()}</Label>
                  <Input
                    value={form[k]}
                    onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                    disabled={busy}
                    placeholder="0.5rem"
                    className="font-mono text-sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Marka Metinleri</CardTitle>
              <CardDescription>Uygulama adi ve sloganlar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Uygulama Adi</Label>
                <Input
                  value={form.app_name}
                  onChange={(e) => setForm((p) => ({ ...p, app_name: e.target.value }))}
                  disabled={busy}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Slogan (TR)</Label>
                <Input
                  value={form.tagline_tr}
                  onChange={(e) => setForm((p) => ({ ...p, tagline_tr: e.target.value }))}
                  disabled={busy}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Slogan (EN)</Label>
                <Input
                  value={form.tagline_en}
                  onChange={(e) => setForm((p) => ({ ...p, tagline_en: e.target.value }))}
                  disabled={busy}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-base">Canli Onizleme</CardTitle>
              <CardDescription>Degisiklikler anlık yansır</CardDescription>
            </CardHeader>
            <CardContent>
              <PreviewCard form={form} />
              <Separator className="my-4" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Kaydedilen tokenlar <code className="text-xs bg-muted px-1 rounded">design_tokens</code> anahtariyla saklanir.</p>
                <p>Frontend bu ayarlari 5 dakikada bir yeniler (<code className="text-xs bg-muted px-1 rounded">revalidate: 300</code>).</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
