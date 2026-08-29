import 'server-only';

import { fetchSetting } from './server';

type UiFallbacks = Record<string, string>;

function resolveSettingValue(value: unknown, locale: string): string {
  let parsed = value;
  if (typeof parsed === 'string') {
    const raw = parsed.trim();
    if (!raw) return '';
    try {
      parsed = JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  // Admin paneli düz string'i JSON-scalar olarak kaydedebiliyor; client tarafı
  // (normalizeValueToLabel) bunu gösteriyor — server tarafı da göstermeli.
  if (typeof parsed === 'string') return parsed.trim();
  if (typeof parsed === 'number' || typeof parsed === 'boolean') return String(parsed);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return '';
  const objectValue = parsed as Record<string, unknown>;
  const labels = objectValue.label && typeof objectValue.label === 'object'
    ? objectValue.label as Record<string, unknown>
    : objectValue;
  const candidate = labels[locale] ?? labels.en ?? labels.tr;
  return typeof candidate === 'string' ? candidate.trim() : '';
}

/** Server component'ler için ui_* anahtarlarını paralel ve fallback'li okur. */
export async function fetchUiStrings(locale: string, fallbacks: UiFallbacks): Promise<UiFallbacks> {
  const entries = Object.entries(fallbacks);
  const rows = await Promise.all(entries.map(([key]) => fetchSetting(key, locale, { revalidate: 600 })));
  return Object.fromEntries(entries.map(([key, fallback], index) => [
    key,
    resolveSettingValue(rows[index]?.value, locale) || fallback,
  ]));
}
