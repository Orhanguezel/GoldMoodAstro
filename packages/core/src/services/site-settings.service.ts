import { apiFetch } from '../lib/fetch';
import { API_ENDPOINTS } from '../endpoints/api-endpoints';
import type { SiteSetting, AppLocale } from '../types/site-settings.type';

export function getSiteSetting(
  baseUrl: string,
  key: string,
  locale: string,
  options?: { revalidate?: number },
): Promise<SiteSetting | null> {
  return apiFetch<SiteSetting | null>(
    baseUrl,
    API_ENDPOINTS.PUBLIC.SITE_SETTINGS.BY_KEY(key),
    { locale },
    options,
  );
}

export function getAppLocales(baseUrl: string): Promise<AppLocale[]> {
  return apiFetch<AppLocale[]>(baseUrl, API_ENDPOINTS.PUBLIC.SITE_SETTINGS.APP_LOCALES, undefined, {
    cache: 'no-store',
  });
}

export function getDefaultLocale(baseUrl: string): Promise<{ locale: string }> {
  return apiFetch<{ locale: string }>(baseUrl, API_ENDPOINTS.PUBLIC.SITE_SETTINGS.DEFAULT_LOCALE, undefined, {
    cache: 'no-store',
  });
}
