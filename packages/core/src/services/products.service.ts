import { apiFetch } from '../lib/fetch';
import { API_ENDPOINTS } from '../endpoints/api-endpoints';
import type { Product, ProductListParams, ProductListResponse } from '../types/product.type';

export function getProducts(
  baseUrl: string,
  params?: ProductListParams,
): Promise<ProductListResponse> {
  return apiFetch<ProductListResponse>(baseUrl, API_ENDPOINTS.PUBLIC.PRODUCTS.LIST, params as Record<string, unknown>);
}

export function getProductBySlug(
  baseUrl: string,
  slug: string,
  locale: string,
  item_type?: 'product' | 'sparepart',
): Promise<Product> {
  return apiFetch<Product>(baseUrl, API_ENDPOINTS.PUBLIC.PRODUCTS.BY_SLUG(slug), {
    locale,
    ...(item_type ? { item_type } : {}),
  });
}

export function getProductById(
  baseUrl: string,
  id: string,
  locale: string,
): Promise<Product> {
  return apiFetch<Product>(baseUrl, API_ENDPOINTS.PUBLIC.PRODUCTS.BY_ID(id), { language: locale });
}

export function getFeaturedProducts(
  baseUrl: string,
  locale: string,
  limit = 10,
): Promise<Product[]> {
  return apiFetch<Product[]>(baseUrl, API_ENDPOINTS.PUBLIC.PRODUCTS.LIST, {
    is_featured: true,
    language: locale,
    limit,
  });
}
