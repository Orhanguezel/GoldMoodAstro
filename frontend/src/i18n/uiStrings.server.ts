import 'server-only';

import { getServerApiBase } from './apiBase.server';
import { resolveUiRows, type UiStringsSnapshot } from './uiStringsResolve';

/**
 * Tüm ui_* metinlerini SSR sırasında locale'e çözümlenmiş halde getirir.
 *
 * Neden: useUiSection eskiden metinleri yalnız istemcide (RTK) çekiyordu. SSR
 * HTML'ine koddaki İngilizce yedekler basılıyor, Google /tr sayfalarında
 * "Featured Consultants", "Contact Us", "Free/Monthly" görüyordu
 * (SEO katalog 2026-10-03). Bu snapshot layout'tan UiStringsProvider'a geçer.
 */
export async function fetchUiStringsSnapshot(locale: string): Promise<UiStringsSnapshot | null> {
  const api = getServerApiBase();
  if (!api) return null;
  try {
    const url = `${api.replace(/\/+$/, '')}/site_settings?prefix=ui_&locale=${encodeURIComponent(locale)}`;
    const res = await fetch(url, { next: { revalidate: 600, tags: ['site-settings'] } });
    if (!res.ok) return null;
    const json = await res.json();
    const rows = Array.isArray(json) ? json : (json?.data ?? json?.items ?? []);
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return resolveUiRows(rows, locale);
  } catch {
    return null;
  }
}
