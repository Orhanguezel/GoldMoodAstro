import { apiFetch } from '../lib/fetch';
import { API_ENDPOINTS } from '../endpoints/api-endpoints';
import type { Faq, FaqListParams } from '../types/faq.type';

export function getFaqs(
  baseUrl: string,
  params?: FaqListParams,
): Promise<Faq[]> {
  return apiFetch<Faq[]>(baseUrl, API_ENDPOINTS.PUBLIC.FAQS.LIST, params as Record<string, unknown>);
}
