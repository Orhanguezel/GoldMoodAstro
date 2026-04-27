// =============================================================
// FILE: src/integrations/endpoints/admin/campaigns_admin.endpoints.ts
// FINAL — admin campaigns endpoints
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  CampaignRow,
  AdminCampaignsListParams,
  CampaignCreatePayload,
  CampaignUpdatePayload,
} from '@/integrations/shared/campaigns';
import {
  buildAdminCampaignsListParams,
  normalizeCampaignRow,
} from '@/integrations/shared/campaigns';

const ADMIN_BASE = '/admin/campaigns';

const extendedApi = baseApi.enhanceEndpoints({ addTagTypes: ['Campaigns'] as const });

export const campaignsAdminApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    listCampaignsAdmin: b.query<CampaignRow[], AdminCampaignsListParams | undefined>({
      query: (params) => {
        const q = buildAdminCampaignsListParams(params);
        return { url: ADMIN_BASE, params: q };
      },
      transformResponse: (res: unknown): CampaignRow[] =>
        Array.isArray(res) ? res.map(normalizeCampaignRow) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((s) => ({ type: 'Campaigns' as const, id: s.id })),
              { type: 'Campaigns' as const, id: 'LIST' },
            ]
          : [{ type: 'Campaigns' as const, id: 'LIST' }],
    }),

    getCampaignAdmin: b.query<CampaignRow | null, string>({
      query: (id) => ({ url: `${ADMIN_BASE}/${id}` }),
      transformResponse: (res: unknown): CampaignRow | null =>
        res ? normalizeCampaignRow(res) : null,
      providesTags: (_r, _e, id) => [{ type: 'Campaigns', id }],
    }),

    createCampaignAdmin: b.mutation<CampaignRow, CampaignCreatePayload>({
      query: (body) => ({
        url: ADMIN_BASE,
        method: 'POST',
        body,
      }),
      transformResponse: (res: unknown): CampaignRow => normalizeCampaignRow(res),
      invalidatesTags: [{ type: 'Campaigns', id: 'LIST' }],
    }),

    updateCampaignAdmin: b.mutation<CampaignRow, { id: string; body: CampaignUpdatePayload }>({
      query: ({ id, body }) => ({
        url: `${ADMIN_BASE}/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: unknown): CampaignRow => normalizeCampaignRow(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Campaigns', id },
        { type: 'Campaigns', id: 'LIST' },
      ],
    }),

    deleteCampaignAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({
        url: `${ADMIN_BASE}/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Campaigns', id },
        { type: 'Campaigns', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListCampaignsAdminQuery,
  useGetCampaignAdminQuery,
  useCreateCampaignAdminMutation,
  useUpdateCampaignAdminMutation,
  useDeleteCampaignAdminMutation,
} = campaignsAdminApi;
