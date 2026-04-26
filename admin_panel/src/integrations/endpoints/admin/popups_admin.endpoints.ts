import { baseApi } from '@/integrations/baseApi';
import type {
  ApiOk,
  PopupAdminCreateBody,
  PopupAdminListQuery,
  PopupAdminUpdateBody,
  PopupAdminView,
} from '@/integrations/shared';
import {
  normalizePopupAdmin,
  normalizePopupAdminList,
  toPopupAdminCreateBody,
  toPopupAdminListQuery,
  toPopupAdminUpdateBody,
} from '@/integrations/shared';

const BASE = '/admin/popups';

export const popupsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listPopupsAdmin: b.query<PopupAdminView[], PopupAdminListQuery | void>({
      query: (q) => ({
        url: BASE,
        method: 'GET',
        params: q ? toPopupAdminListQuery(q) : undefined,
      }),
      transformResponse: (res: unknown) => normalizePopupAdminList(res),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((x) => ({ type: 'Popup' as const, id: x.id })),
              { type: 'Popups' as const, id: 'ADMIN_LIST' },
            ]
          : [{ type: 'Popups' as const, id: 'ADMIN_LIST' }],
    }),

    getPopupAdmin: b.query<PopupAdminView, { id: number | string; locale?: string; default_locale?: string }>({
      query: ({ id, locale, default_locale }) => ({
        url: `${BASE}/${encodeURIComponent(String(id))}`,
        method: 'GET',
        params: {
          ...(locale ? { locale } : {}),
          ...(default_locale ? { default_locale } : {}),
        },
      }),
      transformResponse: (res: unknown) => normalizePopupAdmin(res),
      providesTags: (_r, _e, arg) => [{ type: 'Popup' as const, id: arg.id }],
    }),

    createPopupAdmin: b.mutation<PopupAdminView, PopupAdminCreateBody>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body: toPopupAdminCreateBody(body),
      }),
      transformResponse: (res: unknown) => normalizePopupAdmin(res),
      invalidatesTags: [{ type: 'Popups' as const, id: 'ADMIN_LIST' }],
    }),

    updatePopupAdmin: b.mutation<PopupAdminView, { id: number | string; body: PopupAdminUpdateBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(String(id))}`,
        method: 'PATCH',
        body: toPopupAdminUpdateBody(body),
      }),
      transformResponse: (res: unknown) => normalizePopupAdmin(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Popup' as const, id: arg.id },
        { type: 'Popups' as const, id: 'ADMIN_LIST' },
      ],
    }),

    setPopupStatusAdmin: b.mutation<
      PopupAdminView,
      { id: number | string; is_active: boolean; locale?: string; default_locale?: string }
    >({
      query: ({ id, is_active, locale, default_locale }) => ({
        url: `${BASE}/${encodeURIComponent(String(id))}/status`,
        method: 'PATCH',
        body: { is_active },
        params: {
          ...(locale ? { locale } : {}),
          ...(default_locale ? { default_locale } : {}),
        },
      }),
      transformResponse: (res: unknown) => normalizePopupAdmin(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Popup' as const, id: arg.id },
        { type: 'Popups' as const, id: 'ADMIN_LIST' },
      ],
    }),

    reorderPopupsAdmin: b.mutation<ApiOk, { ids: number[] }>({
      query: (body) => ({
        url: `${BASE}/reorder`,
        method: 'POST',
        body,
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: 'Popups' as const, id: 'ADMIN_LIST' }],
    }),

    deletePopupAdmin: b.mutation<ApiOk, { id: number | string }>({
      query: ({ id }) => ({
        url: `${BASE}/${encodeURIComponent(String(id))}`,
        method: 'DELETE',
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Popup' as const, id: arg.id },
        { type: 'Popups' as const, id: 'ADMIN_LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListPopupsAdminQuery,
  useGetPopupAdminQuery,
  useCreatePopupAdminMutation,
  useUpdatePopupAdminMutation,
  useSetPopupStatusAdminMutation,
  useReorderPopupsAdminMutation,
  useDeletePopupAdminMutation,
} = popupsAdminApi;
