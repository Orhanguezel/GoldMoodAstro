import { apiPost } from '../lib/fetch';
import { API_ENDPOINTS } from '../endpoints/api-endpoints';

export interface NewsletterSubscribeRequest {
  email: string;
  locale?: string;
}

export function subscribeNewsletter(
  baseUrl: string,
  data: NewsletterSubscribeRequest,
): Promise<{ message: string }> {
  return apiPost<{ message: string }>(baseUrl, API_ENDPOINTS.PUBLIC.NEWSLETTER.SUBSCRIBE, data);
}
