import { apiFetch } from '../lib/fetch';
import { API_ENDPOINTS } from '../endpoints/api-endpoints';
import type { CustomPage, CustomPageListParams } from '../types/custom-page.type';

export function getCustomPages(
  baseUrl: string,
  params?: CustomPageListParams,
): Promise<CustomPage[]> {
  return apiFetch<CustomPage[]>(
    baseUrl,
    API_ENDPOINTS.PUBLIC.CUSTOM_PAGES.LIST,
    params as Record<string, unknown>,
  );
}

export function getCustomPageBySlug(
  baseUrl: string,
  slug: string,
  locale: string,
): Promise<CustomPage> {
  return apiFetch<CustomPage>(
    baseUrl,
    API_ENDPOINTS.PUBLIC.CUSTOM_PAGES.BY_SLUG(slug),
    { language: locale },
  );
}

/** Parse the `content` field which may be JSON {"html":"..."} or plain HTML */
export function parseCustomPageContent(content: string | null): string {
  if (!content) return '';
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed?.html === 'string') return parsed.html;
    if (typeof parsed === 'string') return parsed;
  } catch {
    // not JSON — plain HTML
  }
  return content;
}
