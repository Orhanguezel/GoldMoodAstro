// =============================================================
// FILE: src/integrations/rtk/endpoints/services.public.endpoints.ts
// konigsmassage – Public Services (Hizmetler) RTK Endpoints (NO CATEGORY)
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  ApiServicePublic,
  ApiServiceImage,
  ServiceDto,
  ServiceImageDto,
  ServiceListPublicQueryParams,
  ServiceListResult,
} from '@/integrations/shared';

import { normalizeService, normalizeServiceImage } from '@/integrations/shared';

export const servicesPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /* ---------------------------------------------------------
     * GET /services
     * Public liste – x-total-count header'ı ile toplam
     * --------------------------------------------------------- */
    listServicesPublic: build.query<ServiceListResult, ServiceListPublicQueryParams | void>({
      query: (params?: ServiceListPublicQueryParams) => ({
        url: '/services',
        method: 'GET',
        params: params ?? {},
      }),
      transformResponse: (response: ApiServicePublic[], meta) => {
        const items = Array.isArray(response) ? response.map(normalizeService) : [];

        const totalHeader = meta?.response?.headers.get('x-total-count');
        const totalFromHeader = totalHeader ? Number(totalHeader) : Number.NaN;
        const total = Number.isFinite(totalFromHeader) ? totalFromHeader : items.length;

        return { items, total };
      },
    }),

    /* ---------------------------------------------------------
     * GET /services/:id
     * --------------------------------------------------------- */
    getServiceByIdPublic: build.query<
      ServiceDto,
      { id: string; locale?: string; default_locale?: string }
    >({
      query: ({ id, locale, default_locale }) => ({
        url: `/services/${encodeURIComponent(id)}`,
        method: 'GET',
        params: { locale, default_locale },
      }),
      transformResponse: (resp: ApiServicePublic) => normalizeService(resp),
    }),

    /* ---------------------------------------------------------
     * GET /services/by-slug/:slug
     * --------------------------------------------------------- */
    getServiceBySlugPublic: build.query<
      ServiceDto,
      { slug: string; locale?: string; default_locale?: string }
    >({
      query: ({ slug, locale, default_locale }) => ({
        url: `/services/by-slug/${encodeURIComponent(slug)}`,
        method: 'GET',
        params: { locale, default_locale },
      }),
      transformResponse: (resp: ApiServicePublic) => normalizeService(resp),
    }),

    /* ---------------------------------------------------------
     * GET /services/:id/images
     * --------------------------------------------------------- */
    listServiceImagesPublic: build.query<
      ServiceImageDto[],
      { serviceId: string; locale?: string; default_locale?: string }
    >({
      query: ({ serviceId, locale, default_locale }) => ({
        url: `/services/${encodeURIComponent(serviceId)}/images`,
        method: 'GET',
        params: { locale, default_locale },
      }),
      transformResponse: (response: ApiServiceImage[]) =>
        Array.isArray(response) ? response.map(normalizeServiceImage) : [],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListServicesPublicQuery,
  useGetServiceByIdPublicQuery,
  useGetServiceBySlugPublicQuery,
  useListServiceImagesPublicQuery,
} = servicesPublicApi;
