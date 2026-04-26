import { apiFetch } from '../lib/fetch';
import { API_ENDPOINTS } from '../endpoints/api-endpoints';
import type { MenuItem, MenuListParams } from '../types/menu.type';

export function getMenuItems(
  baseUrl: string,
  params?: MenuListParams,
): Promise<MenuItem[]> {
  return apiFetch<MenuItem[]>(baseUrl, API_ENDPOINTS.PUBLIC.MENU_ITEMS.LIST, params as Record<string, unknown>);
}
