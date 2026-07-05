import { baseApi } from '../../baseApi';
import type {
  HoroscopeAdminDto,
  HoroscopeGeneratePayload,
  HoroscopeGenerateResult,
  HoroscopeListParams,
  HoroscopeListResponse,
  HoroscopeUpdatePayload,
} from '@/integrations/shared';

type ListEnvelope = {
  data?: HoroscopeAdminDto[];
  meta?: { total?: number };
};

const cleanParams = (params?: HoroscopeListParams) => {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== '' && value !== 'all'),
  );
};

const horoscopesAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listAdminHoroscopes: build.query<HoroscopeListResponse, HoroscopeListParams | void>({
      query: (params) => ({ url: '/admin/horoscopes', params: cleanParams(params ?? undefined) }),
      transformResponse: (response: ListEnvelope): HoroscopeListResponse => ({
        items: response.data ?? [],
        total: response.meta?.total ?? response.data?.length ?? 0,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Horoscopes' as const, id })),
              { type: 'Horoscopes', id: 'LIST' },
            ]
          : [{ type: 'Horoscopes', id: 'LIST' }],
    }),
    updateAdminHoroscope: build.mutation<
      HoroscopeAdminDto,
      { id: string; body: HoroscopeUpdatePayload }
    >({
      query: ({ id, body }) => ({
        url: `/admin/horoscopes/${encodeURIComponent(id)}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: { data: HoroscopeAdminDto }) => response.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Horoscopes', id },
        { type: 'Horoscopes', id: 'LIST' },
      ],
    }),
    generateAdminHoroscope: build.mutation<HoroscopeGenerateResult, HoroscopeGeneratePayload>({
      query: (body) => ({
        url: '/admin/horoscopes/generate',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: HoroscopeGenerateResult }) => response.data,
      invalidatesTags: [{ type: 'Horoscopes', id: 'LIST' }],
    }),
  }),
});

export const {
  useListAdminHoroscopesQuery,
  useUpdateAdminHoroscopeMutation,
  useGenerateAdminHoroscopeMutation,
} = horoscopesAdminApi;
