import 'server-only';

import { DEFAULT_TOKENS } from './defaults';
import type { DesignTokens } from './types';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8094/api').replace(/\/$/, '');

function isDesignTokens(value: unknown): value is DesignTokens {
  if (!value || typeof value !== 'object') return false;
  const tokens = value as Partial<DesignTokens>;
  return Boolean(tokens.colors?.brand_primary && tokens.radius && tokens.shadows && tokens.branding);
}

function mergeTokens(value: DesignTokens): DesignTokens {
  return {
    ...DEFAULT_TOKENS,
    ...value,
    colors: { ...DEFAULT_TOKENS.colors, ...value.colors },
    typography: { ...DEFAULT_TOKENS.typography, ...value.typography },
    radius: { ...DEFAULT_TOKENS.radius, ...value.radius },
    shadows: { ...DEFAULT_TOKENS.shadows, ...value.shadows },
    branding: { ...DEFAULT_TOKENS.branding, ...value.branding },
  };
}

export async function fetchDesignTokens(): Promise<DesignTokens> {
  try {
    const response = await fetch(`${API_BASE}/site_settings/design_tokens`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) return DEFAULT_TOKENS;

    const data = await response.json();
    const rawValue = typeof data?.value === 'string' ? JSON.parse(data.value) : data?.value;

    if (!isDesignTokens(rawValue)) return DEFAULT_TOKENS;
    return mergeTokens(rawValue);
  } catch {
    return DEFAULT_TOKENS;
  }
}

export async function fetchCustomCss(): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/site_settings/custom_css`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) return '';

    const data = await response.json();
    return typeof data?.value === 'string' ? data.value : '';
  } catch {
    return '';
  }
}
