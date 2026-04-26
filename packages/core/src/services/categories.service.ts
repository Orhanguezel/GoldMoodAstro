import { apiFetch } from '../lib/fetch';
import { API_ENDPOINTS } from '../endpoints/api-endpoints';
import type { Category, SubCategory, CategoryListParams } from '../types/category.type';

export function getCategories(
  baseUrl: string,
  params?: CategoryListParams,
): Promise<Category[]> {
  return apiFetch<Category[]>(baseUrl, API_ENDPOINTS.PUBLIC.CATEGORIES.LIST, params as Record<string, unknown>);
}

export function getCategoryBySlug(
  baseUrl: string,
  slug: string,
  locale: string,
): Promise<Category> {
  return apiFetch<Category>(baseUrl, API_ENDPOINTS.PUBLIC.CATEGORIES.BY_SLUG(slug), { language: locale });
}

export function getSubCategories(
  baseUrl: string,
  params?: CategoryListParams & { category_id?: string },
): Promise<SubCategory[]> {
  return apiFetch<SubCategory[]>(baseUrl, API_ENDPOINTS.PUBLIC.SUB_CATEGORIES.LIST, params as Record<string, unknown>);
}
