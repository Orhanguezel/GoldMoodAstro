import { apiFetch } from '../lib/fetch';
import { API_ENDPOINTS } from '../endpoints/api-endpoints';
import type { LibraryItem, LibraryImage, LibraryFile, LibraryListParams } from '../types/library.type';

export function getLibraryItems(
  baseUrl: string,
  params?: LibraryListParams,
): Promise<LibraryItem[]> {
  return apiFetch<LibraryItem[]>(
    baseUrl,
    API_ENDPOINTS.PUBLIC.LIBRARY.LIST,
    params as Record<string, unknown>,
  );
}

export function getLibraryItemBySlug(
  baseUrl: string,
  slug: string,
  locale: string,
): Promise<LibraryItem> {
  return apiFetch<LibraryItem>(
    baseUrl,
    API_ENDPOINTS.PUBLIC.LIBRARY.BY_SLUG(slug),
    { locale },
  );
}

export function getLibraryImages(
  baseUrl: string,
  id: string,
  locale: string,
): Promise<LibraryImage[]> {
  return apiFetch<LibraryImage[]>(
    baseUrl,
    API_ENDPOINTS.PUBLIC.LIBRARY.IMAGES(id),
    { locale },
  );
}

export function getLibraryFiles(
  baseUrl: string,
  id: string,
): Promise<LibraryFile[]> {
  return apiFetch<LibraryFile[]>(
    baseUrl,
    API_ENDPOINTS.PUBLIC.LIBRARY.FILES(id),
  );
}
