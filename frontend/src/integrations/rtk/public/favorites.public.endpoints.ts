import { baseApi } from '@/integrations/rtk/baseApi';
import type { ConsultantPublic } from './consultants.public.endpoints';

export type FavoriteConsultant = ConsultantPublic & {
  favorite_count: number;
  is_online?: boolean;
  favorited_at?: string;
};

export type FavoriteToggleResponse = {
  consultant_id: string;
  is_favorited: boolean;
};

const favoritesPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listFavorites: build.query<FavoriteConsultant[], void>({
      query: () => ({ url: '/me/favorites' }),
      transformResponse: (res: { data: FavoriteConsultant[] } | FavoriteConsultant[]) =>
        Array.isArray(res) ? res : ((res as any)?.data ?? []),
      providesTags: ['Favorites'],
    }),
    listFavoriteIds: build.query<string[], void>({
      query: () => ({ url: '/me/favorites/ids' }),
      transformResponse: (res: { data: string[] } | string[]) =>
        Array.isArray(res) ? res : ((res as any)?.data ?? []),
      providesTags: ['Favorites'],
    }),
    addFavorite: build.mutation<FavoriteToggleResponse, string>({
      query: (consultantId) => ({
        url: `/me/favorites/${encodeURIComponent(consultantId)}`,
        method: 'POST',
      }),
      transformResponse: (res: { data: FavoriteToggleResponse } | FavoriteToggleResponse) =>
        (res as any)?.data ?? res,
      invalidatesTags: (_r, _e, consultantId) => [
        'Favorites',
        'Consultants',
        { type: 'Consultant', id: consultantId },
      ],
    }),
    removeFavorite: build.mutation<FavoriteToggleResponse, string>({
      query: (consultantId) => ({
        url: `/me/favorites/${encodeURIComponent(consultantId)}`,
        method: 'DELETE',
      }),
      transformResponse: (res: { data: FavoriteToggleResponse } | FavoriteToggleResponse) =>
        (res as any)?.data ?? res,
      invalidatesTags: (_r, _e, consultantId) => [
        'Favorites',
        'Consultants',
        { type: 'Consultant', id: consultantId },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListFavoritesQuery,
  useListFavoriteIdsQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} = favoritesPublicApi;
