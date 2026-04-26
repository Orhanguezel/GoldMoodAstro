import { apiPost } from '../lib/fetch';
import { API_ENDPOINTS } from '../endpoints/api-endpoints';

export interface CreateOfferRequest {
  customer_name: string;
  company_name?: string;
  email: string;
  phone?: string;
  subject?: string;
  message?: string;
  locale?: string;
  product_id?: string;
  service_id?: string;
  consent_terms: boolean;
  consent_marketing?: boolean;
  form_data?: Record<string, unknown>;
}

export function createOffer(
  baseUrl: string,
  data: CreateOfferRequest,
): Promise<{ id: string; offer_no?: string }> {
  return apiPost<{ id: string; offer_no?: string }>(baseUrl, API_ENDPOINTS.PUBLIC.OFFERS, data);
}
