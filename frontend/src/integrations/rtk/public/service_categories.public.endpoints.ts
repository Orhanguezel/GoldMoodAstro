import { baseApi } from '@/integrations/rtk/baseApi';

export interface ServiceCategoryPublic {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: number | boolean;
}

type Envelope<T> = { data: T };

const serviceCategoriesPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listServiceCategoriesPublic: build.query<ServiceCategoryPublic[], { locale?: string } | void>({
      query: (params) => ({ url: '/service-categories', params: params ?? undefined }),
      transformResponse: (res: Envelope<ServiceCategoryPublic[]> | ServiceCategoryPublic[]) =>
        Array.isArray(res) ? res : (res.data ?? []),
    }),
  }),
  overrideExisting: false,
});

export const { useListServiceCategoriesPublicQuery } = serviceCategoriesPublicApi;
