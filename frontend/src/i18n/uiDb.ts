// =============================================================
// FILE: src/lib/i18n/uiDb.ts  (DYNAMIC - NO HARDCODE LOCALES)
// =============================================================
'use client';

import { useMemo } from 'react';
import { useListSiteSettingsQuery } from '@/integrations/rtk/hooks';
import { useResolvedLocale,UI_FALLBACK_EN } from '@/i18n';
import type { SiteSettingRow } from '@/integrations/shared';
import type { TranslatedLabel } from '@/integrations/shared';

/**
 * DB tarafında kullanacağın section key'leri (site_settings.key)
 */
export type UiSectionKey =
  | 'ui_header'
  | 'ui_home'
  | 'ui_footer'
  | 'ui_banner'
  | 'ui_hero'
  | 'ui_contact'
  | 'ui_about'
  | 'ui_about_stats'
  | 'ui_pricing'
  | 'ui_testimonials'
  | 'ui_faq'
  | 'ui_features'
  | 'ui_cta'
  | 'ui_blog'
  | 'ui_dashboard'
  | 'ui_auth'
  | 'ui_newsletter'
  | 'ui_library'
  | 'ui_feedback'
  | 'ui_references'
  | 'ui_news'
  | 'ui_faqs'
  | 'ui_team'
  | 'ui_coffee'
  | 'ui_tarot'
  | 'ui_synastry'
  | 'ui_dreams'
  | 'ui_numerology'
  | 'ui_zodiac'
  | 'ui_share'
  | 'ui_editor'
  | 'ui_consultantbrowse'
  | 'ui_misc'
  | 'ui_consultantpanel'
  | 'ui_settings'
  | 'ui_errors'
  | 'ui_cookie'
  | 'ui_cookie_policy'
  | 'ui_quality'
  | 'ui_mission'
  | 'ui_vision'
  | 'ui_kvkk'
  | 'ui_mission_vision'
  | 'ui_legal_notice'
  | 'ui_privacy_notice'
  | 'ui_privacy_policy'
  | 'ui_terms'
  | 'ui_common'
  | 'ui_solutions'
  | 'ui_chat'
  | 'ui_consultant'
  | 'ui_become_consultant'
  | 'ui_reviews'
  | 'ui_boost'
  | 'ui_account'
  | 'ui_daily'
  | 'ui_extra'
  | 'ui_yildizname';

export type UiSectionResult = {
  ui: (key: string, hardFallback?: string) => string;
  raw: Record<string, unknown>;
  locale: string; // ✅ dynamic
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function unwrapMaybeData(x: any): any {
  if (!x) return x;
  if (typeof x !== 'object' || Array.isArray(x)) return x;
  if ('data' in x) return (x as any).data;
  if ('value' in x) return (x as any).value;
  return x;
}

function tryParseJsonObject(input: unknown): Record<string, unknown> {
  const x = unwrapMaybeData(input);
  if (!x) return {};
  if (typeof x === 'object' && !Array.isArray(x)) return x as Record<string, unknown>;
  if (typeof x === 'string') {
    const s = x.trim();
    if (!s) return {};
    if (s.startsWith('{') && s.endsWith('}')) {
      try {
        const j = JSON.parse(s);
        if (j && typeof j === 'object' && !Array.isArray(j)) return j as Record<string, unknown>;
      } catch {
        return {};
      }
    }
  }
  return {};
}

function tryParseJson(x: unknown): unknown {
  if (typeof x !== 'string') return x;
  const s = x.trim();
  if (!s) return x;
  if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
    try {
      return JSON.parse(s);
    } catch {
      return x;
    }
  }
  return x;
}

function normShortLocale(x: unknown): string {
  return String(x || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();
}

type SettingsValueRecord = { label?: TranslatedLabel; [k: string]: unknown };

function normalizeValueToLabel(value: unknown): SettingsValueRecord {
  const v = tryParseJson(value);
  if (typeof v === 'string') return { label: { en: v } as TranslatedLabel };
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const obj = v as any;
    if (obj.label && typeof obj.label === 'object' && !Array.isArray(obj.label)) return obj;
    return { label: obj as TranslatedLabel };
  }
  return {};
}

/* ------------------------------------------------------------------ */
/*  useUiSection — TÜM ui_* key'leri TEK istek ile çeker              */
/*  RTK Query deduplication: tüm section'lar aynı cache'i paylaşır    */
/* ------------------------------------------------------------------ */

export function useUiSection(section: UiSectionKey, localeOverride?: string): UiSectionResult {
  const locale = useResolvedLocale(localeOverride);

  // ✅ TEK istek: GET /site_settings?prefix=ui_&locale=de
  // RTK Query tüm useUiSection çağrılarını deduplicate eder (aynı args).
  const { data: allUiSettings } = useListSiteSettingsQuery(
    locale ? { prefix: 'ui_', locale } : undefined,
  );

  // Hızlı lookup Map (tüm ui_* satırları)
  const allUiMap = useMemo(() => {
    const m = new Map<string, SiteSettingRow>();
    if (allUiSettings) {
      for (const row of allUiSettings) m.set(row.key, row);
    }
    return m;
  }, [allUiSettings]);

  // 1) Section bazlı JSON override (ui_header, ui_footer, ...)
  const json = useMemo<Record<string, unknown>>(() => {
    const row = allUiMap.get(section);
    return row ? tryParseJsonObject(row.value) : {};
  }, [allUiMap, section]);

  const ui = (key: string, hardFallback = ''): string => {
    const k = String(key || '').trim();
    if (!k) return '';

    // A) section JSON override
    const raw = json[k];
    if (typeof raw === 'string' && raw.trim()) return raw.trim();

    // B) tekil UI key DB. prefix=ui_ ile tüm ui_* satırları zaten allUiMap'te;
    // client bundle'da devasa SECTION_KEYS allowlist'i taşımaya gerek yok.
    const row = k.startsWith('ui_') ? allUiMap.get(k) : undefined;
    const record = row ? normalizeValueToLabel(row.value) : undefined;
    if (record) {
      const label = (record.label || {}) as TranslatedLabel;
      const l = normShortLocale(locale);
      const val =
        (l && (label as any)[l]) ||
        (label as any).en ||
        (label as any).tr ||
        (Object.values(label || {})[0] as string) ||
        '';
      const fromDb = (typeof val === 'string' ? val : '').trim();
      if (fromDb && fromDb !== k) return fromDb;
    }

    // C) param hard fallback
    const hf = String(hardFallback || '').trim();
    if (hf) return hf;

    // D) constant EN fallback
    const fromConst = (UI_FALLBACK_EN as any)[k];
    if (typeof fromConst === 'string' && fromConst.trim()) return fromConst.trim();

    // E) key
    return k;
  };

  return { ui, raw: json, locale };
}
