import { apiPost } from '../lib/fetch';
import { API_ENDPOINTS } from '../endpoints/api-endpoints';

export interface CreateCatalogRequest {
  customer_name: string;
  company_name?: string | null;
  email: string;
  phone?: string | null;
  message?: string | null;
  locale?: string;
  country_code?: string;
  consent_terms: boolean;
  consent_marketing?: boolean;
}

export function createCatalogRequest(
  baseUrl: string,
  data: CreateCatalogRequest,
): Promise<{ id: string }> {
  return apiPost<{ id: string }>(baseUrl, API_ENDPOINTS.PUBLIC.CATALOG_REQUESTS, data);
}
