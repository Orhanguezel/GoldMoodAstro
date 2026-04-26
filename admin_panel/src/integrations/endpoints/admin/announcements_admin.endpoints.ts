import { baseApi } from '../../baseApi';
import type { AnnouncementView, CreateAnnouncementBody } from '../../shared/announcements';

export const announcementsAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAnnouncementsAdmin: builder.query<AnnouncementView[], void>({
      query: () => '/admin/announcements',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Announcement' as const, id })),
              { type: 'Announcement', id: 'LIST' },
            ]
          : [{ type: 'Announcement', id: 'LIST' }],
    }),
    getAnnouncementAdmin: builder.query<AnnouncementView, string>({
      query: (id) => `/admin/announcements/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Announcement', id }],
    }),
    createAnnouncementAdmin: builder.mutation<AnnouncementView, CreateAnnouncementBody>({
      query: (body) => ({
        url: '/admin/announcements',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Announcement', id: 'LIST' }],
    }),
    updateAnnouncementAdmin: builder.mutation<AnnouncementView, { id: string; patch: Partial<CreateAnnouncementBody> }>({
      query: ({ id, patch }) => ({
        url: `/admin/announcements/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Announcement', id },
        { type: 'Announcement', id: 'LIST' },
      ],
    }),
    deleteAnnouncementAdmin: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/announcements/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Announcement', id: 'LIST' }],
    }),
  }),
});

export const {
  useListAnnouncementsAdminQuery,
  useGetAnnouncementAdminQuery,
  useCreateAnnouncementAdminMutation,
  useUpdateAnnouncementAdminMutation,
  useDeleteAnnouncementAdminMutation,
} = announcementsAdminApi;
