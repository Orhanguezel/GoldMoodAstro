import { baseApi } from '../baseApi';

export interface Language {
  id: string;
  slug: string;
  name_tr: string;
  name_en: string;
  name_de: string;
  sort_order: number;
  is_active: number;
}

export const languagesPublicApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listLanguagesPublic: builder.query<Language[], void>({
      query: () => '/languages',
      providesTags: ['Languages'],
      transformResponse: (response: { data: Language[] }) => {
        // Handle standard envelope or direct array
        if (response && Array.isArray(response)) {
          return response;
        }
        return response?.data || [];
      },
    }),
  }),
  overrideExisting: false,
});

export const { useListLanguagesPublicQuery } = languagesPublicApi;
