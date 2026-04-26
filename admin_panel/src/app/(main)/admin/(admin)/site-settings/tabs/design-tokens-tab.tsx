'use client';

// =============================================================
// FILE: site-settings/tabs/design-tokens-tab.tsx
// Admin Design Token Editor — GoldMoodAstro
// 2026-04-27 vizyon revize: Cream + Gold + Ink + Plum palette,
// Cinzel/Fraunces/Manrope tipografi, dark theme variantları.
// Şema: backend/src/db/sql/010_site_settings.sql design_tokens (version 2)
// Frontend tip kontratı: frontend/src/lib/tokens/types.ts
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── Token şeması (frontend tip kontratıyla 1:1) ────────────────

type TokenForm = {
  version: string;
  colors: {
    // Brand
    brand_primary: string;
    brand_primary_dark: string;
    brand_primary_light: string;
    brand_secondary: string;
    brand_secondary_dim: string;
    brand_secondary_light: string;
    brand_accent: string;             // plum
    gold_50: string;
    gold_100: string;
    gold_200: string;
    gold_300: string;
    gold_400: string;
    gold_500: string;
    gold_600: string;
    gold_700: string;
    gold_800: string;
    gold_900: string;
    sand_50: string;
    sand_100: string;
    sand_200: string;
    sand_300: string;
    sand_400: string;
    sand_500: string;
    sand_600: string;
    sand_700: string;
    sand_800: string;
    sand_900: string;
    // Background (light)
    bg_base: string;
    bg_deep: string;
    bg_surface: string;
    bg_surface_high: string;
    // Text (light)
    text_primary: string;
    text_secondary: string;
    text_muted: string;
    text_muted_soft: string;
    // Border
    border: string;
    border_soft: string;
    // Status
    success: string;
    warning: string;
    error: string;
    info: string;
    // Dark variant (opsiyonel — boş bırakılabilir)
    bg_base_dark: string;
    bg_deep_dark: string;
    bg_surface_dark: string;
    bg_surface_high_dark: string;
    text_primary_dark: string;
    text_secondary_dark: string;
    text_muted_dark: string;
  };
  typography: {
    font_display: string;
    font_serif: string;
    font_sans: string;
    font_mono: string;
    base_size: string;
  };
  radius: {
    xs: string; sm: string; md: string; lg: string; xl: string; pill: string;
  };
  shadows: {
    soft: string; card: string; glow_primary: string; glow_gold: string;
  };
  branding: {
    app_name: string;
    tagline: string;
    tagline_en: string;
    logo_url: string;
    favicon_url: string;
    theme_color: string;
    theme_color_dark: string;
    og_image_url: string;
  };
};

const DEFAULTS: TokenForm = {
  version: '2',
  colors: {
    brand_primary: '#C9A961',
    brand_primary_dark: '#A8884A',
    brand_primary_light: '#D4BB7A',
    brand_secondary: '#C9A961',
    brand_secondary_dim: '#B89651',
    brand_secondary_light: '#E5D0A0',
    brand_accent: '#3D2E47',
    gold_50: '#FCF8ED',
    gold_100: '#F7EFD5',
    gold_200: '#EEDDAA',
    gold_300: '#E2C877',
    gold_400: '#D4B554',
    gold_500: '#C9A961',
    gold_600: '#A8884A',
    gold_700: '#856B3A',
    gold_800: '#5F4E2F',
    gold_900: '#3F3524',
    sand_50: '#FFFCF7',
    sand_100: '#FAF6EF',
    sand_200: '#F2EBDD',
    sand_300: '#E8DDC8',
    sand_400: '#D8C7A8',
    sand_500: '#C4AF8B',
    sand_600: '#A18C6B',
    sand_700: '#78684F',
    sand_800: '#534839',
    sand_900: '#2A2620',
    bg_base: '#FAF6EF',
    bg_deep: '#F2EBDD',
    bg_surface: '#FFFFFF',
    bg_surface_high: '#F7F1E4',
    text_primary: '#2A2620',
    text_secondary: '#4A4238',
    text_muted: '#8A8276',
    text_muted_soft: '#6B6358',
    border: 'rgba(168,136,74,0.25)',
    border_soft: 'rgba(168,136,74,0.15)',
    success: '#4CAF6E',
    warning: '#F0A030',
    error: '#E55B4D',
    info: '#5B9BD5',
    bg_base_dark: '#2A2620',
    bg_deep_dark: '#1A1715',
    bg_surface_dark: '#3D362D',
    bg_surface_high_dark: '#4A4238',
    text_primary_dark: '#FAF6EF',
    text_secondary_dark: '#E5DCC8',
    text_muted_dark: '#A09888',
  },
  typography: {
    font_display: 'Cinzel, Georgia, serif',
    font_serif: 'Fraunces, Georgia, serif',
    font_sans: 'Manrope, system-ui, -apple-system, sans-serif',
    font_mono: 'JetBrains Mono, monospace',
    base_size: '16px',
  },
  radius: { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px', pill: '9999px' },
  shadows: {
    soft: '0 2px 20px rgba(45,37,32,0.06)',
    card: '0 8px 40px rgba(45,37,32,0.10)',
    glow_primary: '0 0 60px rgba(201,169,97,0.18)',
    glow_gold: '0 0 30px rgba(201,169,97,0.22)',
  },
  branding: {
    app_name: 'GoldMoodAstro',
    tagline: 'Yıldızlarla tanışan modern astroloji',
    tagline_en: 'Modern astrology meets the stars',
    logo_url: '',
    favicon_url: '',
    theme_color: '#C9A961',
    theme_color_dark: '#2A2620',
    og_image_url: '',
  },
};

// Renk gruplandırması (UX için)
const COLOR_GROUPS: Array<{
  title: string;
  description?: string;
  keys: Array<{ key: keyof TokenForm['colors']; label: string }>;
}> = [
  {
    title: 'Marka',
    description: 'Ana marka renkleri ve mistik plum aksanı',
    keys: [
      { key: 'brand_primary', label: 'Brand Primary (Gold)' },
      { key: 'brand_primary_dark', label: 'Brand Primary Dark' },
      { key: 'brand_primary_light', label: 'Brand Primary Light' },
      { key: 'brand_secondary', label: 'Brand Secondary' },
      { key: 'brand_secondary_dim', label: 'Brand Secondary Dim' },
      { key: 'brand_secondary_light', label: 'Brand Secondary Light' },
      { key: 'brand_accent', label: 'Accent Plum' },
    ],
  },
  {
    title: 'Gold Spektrumu',
    description: '50-900 ölçeği buton, vurgu ve grafik tonları için',
    keys: [
      { key: 'gold_50', label: 'Gold 50' },
      { key: 'gold_100', label: 'Gold 100' },
      { key: 'gold_200', label: 'Gold 200' },
      { key: 'gold_300', label: 'Gold 300' },
      { key: 'gold_400', label: 'Gold 400' },
      { key: 'gold_500', label: 'Gold 500' },
      { key: 'gold_600', label: 'Gold 600' },
      { key: 'gold_700', label: 'Gold 700' },
      { key: 'gold_800', label: 'Gold 800' },
      { key: 'gold_900', label: 'Gold 900' },
    ],
  },
  {
    title: 'Sand Spektrumu',
    description: 'Cream yüzeyler ve sıcak ink koyulukları için',
    keys: [
      { key: 'sand_50', label: 'Sand 50' },
      { key: 'sand_100', label: 'Sand 100' },
      { key: 'sand_200', label: 'Sand 200' },
      { key: 'sand_300', label: 'Sand 300' },
      { key: 'sand_400', label: 'Sand 400' },
      { key: 'sand_500', label: 'Sand 500' },
      { key: 'sand_600', label: 'Sand 600' },
      { key: 'sand_700', label: 'Sand 700' },
      { key: 'sand_800', label: 'Sand 800' },
      { key: 'sand_900', label: 'Sand 900' },
    ],
  },
  {
    title: 'Arkaplan (Cream — light)',
    keys: [
      { key: 'bg_base', label: 'BG Base (cream)' },
      { key: 'bg_deep', label: 'BG Deep' },
      { key: 'bg_surface', label: 'Surface (white)' },
      { key: 'bg_surface_high', label: 'Surface High' },
    ],
  },
  {
    title: 'Metin (Ink)',
    keys: [
      { key: 'text_primary', label: 'Text Primary (warm ink)' },
      { key: 'text_secondary', label: 'Text Secondary' },
      { key: 'text_muted', label: 'Text Muted' },
      { key: 'text_muted_soft', label: 'Text Muted Soft' },
    ],
  },
  {
    title: 'Sınır',
    description: 'rgba() değerleri kullanılabilir (transparency)',
    keys: [
      { key: 'border', label: 'Border' },
      { key: 'border_soft', label: 'Border Soft' },
    ],
  },
  {
    title: 'Durum',
    keys: [
      { key: 'success', label: 'Success' },
      { key: 'warning', label: 'Warning' },
      { key: 'error', label: 'Error' },
      { key: 'info', label: 'Info' },
    ],
  },
  {
    title: 'Dark Theme Variant (opsiyonel)',
    description: 'Boş bırakılırsa light variant kullanılır',
    keys: [
      { key: 'bg_base_dark', label: 'BG Base (dark)' },
      { key: 'bg_deep_dark', label: 'BG Deep (dark)' },
      { key: 'bg_surface_dark', label: 'Surface (dark)' },
      { key: 'bg_surface_high_dark', label: 'Surface High (dark)' },
      { key: 'text_primary_dark', label: 'Text Primary (dark)' },
      { key: 'text_secondary_dark', label: 'Text Secondary (dark)' },
      { key: 'text_muted_dark', label: 'Text Muted (dark)' },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────

function parseTokens(raw: unknown): TokenForm {
  if (!raw) return structuredClone(DEFAULTS);
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : (raw as Record<string, unknown>);
    const c = (obj?.colors as Record<string, string>) || {};
    const t = (obj?.typography as Record<string, string>) || {};
    const r = (obj?.radius as Record<string, string>) || {};
    const s = (obj?.shadows as Record<string, string>) || {};
    const b = (obj?.branding as Record<string, string>) || {};
    const merged = structuredClone(DEFAULTS);
    merged.version = String(obj?.version || merged.version);
    Object.keys(merged.colors).forEach((k) => {
      const key = k as keyof TokenForm['colors'];
      if (c[key]) merged.colors[key] = c[key];
    });
    Object.keys(merged.typography).forEach((k) => {
      const key = k as keyof TokenForm['typography'];
      if (t[key]) merged.typography[key] = t[key];
    });
    Object.keys(merged.radius).forEach((k) => {
      const key = k as keyof TokenForm['radius'];
      if (r[key]) merged.radius[key] = r[key];
    });
    Object.keys(merged.shadows).forEach((k) => {
      const key = k as keyof TokenForm['shadows'];
      if (s[key]) merged.shadows[key] = s[key];
    });
    Object.keys(merged.branding).forEach((k) => {
      const key = k as keyof TokenForm['branding'];
      if (b[key] !== undefined) merged.branding[key] = b[key];
    });
    return merged;
  } catch {
    return structuredClone(DEFAULTS);
  }
}

// Color picker'da rgba() kabul etmediği için hex dönüştür/kabul et
function isHexColor(v: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v.trim());
}

const FONT_OPTIONS = [
  'Cinzel, Georgia, serif',
  'Fraunces, Georgia, serif',
  'Manrope, system-ui, -apple-system, sans-serif',
  'Inter, system-ui, -apple-system, sans-serif',
  'InterTight, system-ui, sans-serif',
  'Georgia, serif',
  'JetBrains Mono, monospace',
] as const;

// ── ColorRow ───────────────────────────────────────────────────

function ColorRow({
  label, value, onChange, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  const showPicker = isHexColor(value);
  return (
    <div className="flex items-center gap-3">
      {showPicker ? (
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-9 w-12 cursor-pointer rounded border border-input bg-background p-0.5 disabled:opacity-50"
        />
      ) : (
        <div
          className="h-9 w-12 shrink-0 rounded border border-input"
          style={{ backgroundColor: value }}
          title={value}
        />
      )}
      <div className="flex-1 space-y-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-8 font-mono text-xs"
          placeholder="#000000 veya rgba(...)"
        />
      </div>
      <div
        className="h-9 w-9 shrink-0 rounded-md border border-border"
        style={{ backgroundColor: value }}
      />
    </div>
  );
}

// ── Preview Card ───────────────────────────────────────────────

function PreviewCard({ form }: { form: TokenForm }) {
  const c = form.colors;
  const fontSerif = form.typography.font_serif;
  const fontDisplay = form.typography.font_display;
  const fontSans = form.typography.font_sans;
  return (
    <div
      className="space-y-4 border p-5 text-sm"
      style={{
        backgroundColor: c.bg_base,
        borderColor: c.border,
        borderRadius: form.radius.lg,
        boxShadow: form.shadows.card,
      }}
    >
      <div
        className="text-[11px] font-semibold uppercase tracking-[0.22em]"
        style={{ color: c.brand_primary, fontFamily: fontSans }}
      >
        Section Label
      </div>
      <div style={{ color: c.text_primary, fontFamily: fontDisplay, fontSize: '1.45rem' }}>
        {form.branding.app_name}
      </div>
      <p style={{ color: c.text_secondary, fontFamily: fontSerif, lineHeight: 1.6 }}>
        {form.branding.tagline}
      </p>
      <div className="flex flex-wrap gap-2">
        <span
          className="px-3 py-1 text-xs font-medium"
          style={{ backgroundColor: c.gold_500, color: c.sand_900, borderRadius: form.radius.pill }}
        >
          Gold 500
        </span>
        <span
          className="px-3 py-1 text-xs font-medium"
          style={{ backgroundColor: c.brand_accent, color: '#FAF6EF', borderRadius: form.radius.pill }}
        >
          Plum
        </span>
        <span
          className="px-3 py-1 text-xs font-medium border"
          style={{ borderColor: c.border, color: c.text_muted, borderRadius: form.radius.pill, backgroundColor: c.bg_surface }}
        >
          Yüzey
        </span>
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          className="px-4 py-2 text-xs font-semibold"
          style={{
            backgroundColor: c.brand_primary,
            color: c.sand_900,
            borderRadius: form.radius.pill,
            boxShadow: form.shadows.glow_gold,
            fontFamily: fontSans,
          }}
        >
          btn-premium
        </button>
        <button
          type="button"
          className="border px-4 py-2 text-xs font-semibold"
          style={{
            borderColor: c.brand_primary,
            color: c.text_primary,
            backgroundColor: c.bg_surface,
            borderRadius: form.radius.pill,
            fontFamily: fontSans,
          }}
        >
          btn-outline-premium
        </button>
      </div>
      <div className="text-xs" style={{ color: c.text_muted, fontFamily: fontSerif }}>
        {form.branding.tagline_en}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────

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

  const setColor = (key: keyof TokenForm['colors'], value: string) =>
    setForm((p) => ({ ...p, colors: { ...p.colors, [key]: value } }));

  const setTypo = (key: keyof TokenForm['typography'], value: string) =>
    setForm((p) => ({ ...p, typography: { ...p.typography, [key]: value } }));

  const setRadius = (key: keyof TokenForm['radius'], value: string) =>
    setForm((p) => ({ ...p, radius: { ...p.radius, [key]: value } }));

  const setShadow = (key: keyof TokenForm['shadows'], value: string) =>
    setForm((p) => ({ ...p, shadows: { ...p.shadows, [key]: value } }));

  const setBrand = (key: keyof TokenForm['branding'], value: string) =>
    setForm((p) => ({ ...p, branding: { ...p.branding, [key]: value } }));

  const handleSave = async () => {
    try {
      await updateSetting({
        key: 'design_tokens',
        value: form,                    // form = backend ile aynı şema
        locale: '*',
      }).unwrap();
      toast.success('Design tokenlar kaydedildi. 5 dakika içinde frontend\'e yansır.');
    } catch (err) {
      const e = err as { data?: { error?: { message?: string } | string } };
      const msg = (typeof e?.data?.error === 'object' ? e.data.error.message : e?.data?.error) || 'Kaydetme hatası.';
      toast.error(String(msg));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold flex items-center gap-2">
            <Palette className="size-4" />
            Design Token Editörü
          </h3>
          <p className="text-sm text-muted-foreground">
            Renk, tipografi, radius, shadow ve branding değerleri backend&apos;de saklanır,
            frontend 5 dk cacheden okur. Şu an v{form.version}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Badge variant="outline">Yükleniyor...</Badge>}
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
          {/* Color groups */}
          {COLOR_GROUPS.map((group) => (
            <Card key={group.title}>
              <CardHeader>
                <CardTitle className="text-base">{group.title}</CardTitle>
                {group.description && <CardDescription>{group.description}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-4">
                {group.keys.map(({ key, label }) => (
                  <ColorRow
                    key={key}
                    label={label}
                    value={form.colors[key]}
                    onChange={(v) => setColor(key, v)}
                    disabled={busy}
                  />
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tipografi</CardTitle>
              <CardDescription>Font ailesi tanımları (CSS font-family değerleri)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {([
                { k: 'font_display', l: 'Display (başlıklar)' },
                { k: 'font_serif', l: 'Serif (gövde — editorial)' },
                { k: 'font_sans', l: 'Sans (UI)' },
              ] as const).map(({ k, l }) => (
                <div key={k} className="space-y-1.5">
                  <Label>{l}</Label>
                  <Select
                    value={form.typography[k]}
                    onValueChange={(value) => setTypo(k, value)}
                    disabled={busy}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Font seç" />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              {([
                { k: 'font_mono', l: 'Mono (kod)' },
                { k: 'base_size', l: 'Base Size' },
              ] as const).map(({ k, l }) => (
                <div key={k} className="space-y-1.5">
                  <Label>{l}</Label>
                  <Input
                    value={form.typography[k]}
                    onChange={(e) => setTypo(k, e.target.value)}
                    disabled={busy}
                    className="font-mono text-sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Radius */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Radius</CardTitle>
              <CardDescription>Köşe yuvarlaması (px / rem / %)</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              {(['xs', 'sm', 'md', 'lg', 'xl', 'pill'] as const).map((k) => (
                <div key={k} className="space-y-1.5">
                  <Label>{k.toUpperCase()}</Label>
                  <Input
                    value={form.radius[k]}
                    onChange={(e) => setRadius(k, e.target.value)}
                    disabled={busy}
                    className="font-mono text-sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shadows */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gölgeler</CardTitle>
              <CardDescription>CSS box-shadow değerleri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {([
                { k: 'soft', l: 'Soft' },
                { k: 'card', l: 'Card' },
                { k: 'glow_primary', l: 'Glow Primary' },
                { k: 'glow_gold', l: 'Glow Gold' },
              ] as const).map(({ k, l }) => (
                <div key={k} className="space-y-1.5">
                  <Label>{l}</Label>
                  <Input
                    value={form.shadows[k]}
                    onChange={(e) => setShadow(k, e.target.value)}
                    disabled={busy}
                    className="font-mono text-xs"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Marka & Branding</CardTitle>
              <CardDescription>Uygulama adı, slogan, logo URL, theme color</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {([
                { k: 'app_name', l: 'Uygulama Adı' },
                { k: 'tagline', l: 'Slogan (TR)' },
                { k: 'tagline_en', l: 'Slogan (EN)' },
                { k: 'logo_url', l: 'Logo URL' },
                { k: 'favicon_url', l: 'Favicon URL' },
                { k: 'og_image_url', l: 'OG Image URL' },
              ] as const).map(({ k, l }) => (
                <div key={k} className="space-y-1.5">
                  <Label>{l}</Label>
                  <Input
                    value={form.branding[k]}
                    onChange={(e) => setBrand(k, e.target.value)}
                    disabled={busy}
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Theme Color (light)</Label>
                  <Input
                    value={form.branding.theme_color}
                    onChange={(e) => setBrand('theme_color', e.target.value)}
                    disabled={busy}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Theme Color (dark)</Label>
                  <Input
                    value={form.branding.theme_color_dark}
                    onChange={(e) => setBrand('theme_color_dark', e.target.value)}
                    disabled={busy}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-base">Canlı Önizleme</CardTitle>
              <CardDescription>Değişiklikler anlık yansır</CardDescription>
            </CardHeader>
            <CardContent>
              <PreviewCard form={form} />
              <Separator className="my-4" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Şema versiyonu: <code className="bg-muted px-1 rounded">v{form.version}</code></p>
                <p>Frontend revalidate: <code className="bg-muted px-1 rounded">300s</code></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
