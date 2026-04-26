import { apiFetch } from '../lib/fetch';
import { API_ENDPOINTS } from '../endpoints/api-endpoints';
import type { Service, ServiceListParams } from '../types/service.type';

export function getServices(
  baseUrl: string,
  params?: ServiceListParams,
): Promise<Service[]> {
  return apiFetch<Service[]>(baseUrl, API_ENDPOINTS.PUBLIC.SERVICES.LIST, params as Record<string, unknown>);
}

export function getServiceBySlug(
  baseUrl: string,
  slug: string,
  locale: string,
): Promise<Service> {
  return apiFetch<Service>(baseUrl, API_ENDPOINTS.PUBLIC.SERVICES.BY_SLUG(slug), { language: locale });
}
