import { apiFetch } from '../lib/fetch';
import { API_ENDPOINTS } from '../endpoints/api-endpoints';
import type { Slider } from '../types/slider.type';

export function getSliders(
  baseUrl: string,
  locale: string,
): Promise<Slider[]> {
  return apiFetch<Slider[]>(baseUrl, API_ENDPOINTS.PUBLIC.SLIDERS.LIST, { language: locale });
}
