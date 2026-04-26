// Shared locale settings utility — used by all Ensotek frontends
// Fetches active locales and default locale from the backend dynamically.
// No hardcoded locales — fully configurable from admin panel.

export interface LocaleSettings {
  activeLocales: string[];
  defaultLocale: string;
}

interface BackendLocale {
  code?: string;
  is_active?: boolean;
}

function normalizeLocale(value: unknown): string {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().toLowerCase().replace('_', '-');
  if (!normalized) return '';
  return normalized.split('-')[0] ?? '';
}

function parseActiveLocales(payload: unknown, availableLocales: string[]): string[] {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown[] })?.data)
      ? (payload as { data: unknown[] }).data
      : [];

  const locales = list
    .filter((item) => (item as BackendLocale)?.is_active !== false)
    .map((item: unknown) => normalizeLocale((item as BackendLocale)?.code))
    .filter((code) => availableLocales.includes(code));

  return [...new Set(locales)];
}

function parseDefaultLocale(payload: unknown): string {
  if (typeof payload === 'string') return normalizeLocale(payload);
  if (typeof payload === 'object' && payload !== null) {
    return normalizeLocale((payload as { locale?: string }).locale);
  }
  return '';
}

/**
 * Fetches runtime locale settings from the backend.
 *
 * @param apiBaseUrl  - The base API URL (e.g. "http://127.0.0.1:8086/api")
 * @param availableLocales - Locales that have JSON translation files in this frontend
 * @param fallbackLocale   - Locale to use if backend is unavailable
 */
export async function getRuntimeLocaleSettings(
  apiBaseUrl: string,
  availableLocales: string[],
  fallbackLocale: string,
): Promise<LocaleSettings> {
  const fallback: LocaleSettings = {
    activeLocales: availableLocales,
    defaultLocale: fallbackLocale,
  };

  try {
    const base = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`;

    const [localesRes, defaultRes] = await Promise.all([
      fetch(`${base}/site_settings/app-locales`, { cache: 'no-store' }),
      fetch(`${base}/site_settings/default-locale`, { cache: 'no-store' }),
    ]);

    const localesPayload = localesRes.ok ? await localesRes.json() : [];
    const defaultPayload = defaultRes.ok ? await defaultRes.json() : {};

    const activeLocales = parseActiveLocales(localesPayload, availableLocales);
    const scopedLocales = activeLocales.length > 0 ? activeLocales : availableLocales;

    const candidateDefault = parseDefaultLocale(defaultPayload);
    const defaultLocale = scopedLocales.includes(candidateDefault)
      ? candidateDefault
      : (scopedLocales[0] ?? fallbackLocale);

    return { activeLocales: scopedLocales, defaultLocale };
  } catch {
    return fallback;
  }
}
