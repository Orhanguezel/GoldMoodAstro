import { apiFetch } from '../lib/fetch';
import { API_ENDPOINTS } from '../endpoints/api-endpoints';
import type { FooterSection, FooterListParams } from '../types/footer.type';

export function getFooterSections(
  baseUrl: string,
  params?: FooterListParams,
): Promise<FooterSection[]> {
  return apiFetch<FooterSection[]>(baseUrl, API_ENDPOINTS.PUBLIC.FOOTER_SECTIONS.LIST, params as Record<string, unknown>);
}
