import { DEFAULT_TOKENS } from '@/lib/tokens/defaults';
import type { DesignTokens } from '@/lib/tokens/types';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://goldmoodastro.com/api').replace(/\/$/, '');

function parseTokenValue(data: unknown): DesignTokens | null {
  const row = data as { value?: unknown; data?: { value?: unknown } };
  const raw = row?.value ?? row?.data?.value;
  if (!raw) return null;
  const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!value?.colors?.brand_primary) return null;
  return { ...DEFAULT_TOKENS, ...value };
}

function withAlpha(color: string, alpha: number): string {
  const hex = color.replace('#', '').trim();
  if (!/^[0-9a-f]{6}$/i.test(hex)) return color;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export async function getOgTheme() {
  let tokens = DEFAULT_TOKENS;
  try {
    const res = await fetch(`${API_BASE}/site_settings/design_tokens`, {
      next: { revalidate: 300 },
    });
    if (res.ok) tokens = parseTokenValue(await res.json()) ?? DEFAULT_TOKENS;
  } catch {
    tokens = DEFAULT_TOKENS;
  }

  const c = tokens.colors;
  const b = tokens.branding;
  const primary = c.brand_primary;
  const text = c.text_primary_dark || c.text_primary;
  const bgStart = c.bg_base_dark || c.bg_base;
  const bgEnd = c.bg_deep_dark || c.bg_deep;
  const accent = c.brand_accent;

  return {
    brandName: b.app_name || 'GoldMoodAstro',
    brandUpper: (b.app_name || 'GoldMoodAstro').toUpperCase(),
    domain: 'goldmoodastro.com',
    bg: `linear-gradient(135deg,${bgStart} 0%,${accent} 60%,${bgEnd} 100%)`,
    text,
    primary,
    accent,
    primarySoft: withAlpha(primary, 0.1),
    primaryBorder: withAlpha(primary, 0.3),
    primaryBorderStrong: withAlpha(primary, 0.5),
  };
}
