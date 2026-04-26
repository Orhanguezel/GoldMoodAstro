import { apiFetch } from '../lib/fetch';
import { API_ENDPOINTS } from '../endpoints/api-endpoints';
import type { Reference, ReferenceListParams } from '../types/reference.type';

export function getReferences(
  baseUrl: string,
  params?: ReferenceListParams,
): Promise<Reference[]> {
  return apiFetch<Reference[]>(baseUrl, API_ENDPOINTS.PUBLIC.REFERENCES.LIST, params as Record<string, unknown>);
}

export function getReferenceBySlug(
  baseUrl: string,
  slug: string,
  locale: string,
): Promise<Reference> {
  return apiFetch<Reference>(baseUrl, API_ENDPOINTS.PUBLIC.REFERENCES.BY_SLUG(slug), { language: locale });
}
