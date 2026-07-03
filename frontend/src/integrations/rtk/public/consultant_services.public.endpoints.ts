// =============================================================
// FILE: src/integrations/rtk/public/consultant_services.public.endpoints.ts
// T29-1: Danışmanın hizmet paket listesi (public).
// =============================================================
import { baseApi } from '@/integrations/rtk/baseApi';

export interface ConsultantServicePublic {
  id: string;
  consultant_id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  price: string; // DECIMAL string: "0.00", "750.00"
  currency: string;
  media_type: 'audio' | 'video';
  is_free: number;
  is_active: number;
  sort_order: number;
}

const consultantServicesPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listConsultantServicesPublic: build.query<
      ConsultantServicePublic[],
      string | { consultantId: string; locale?: string }
    >({
      // Geriye uyum: düz string (consultantId) da kabul edilir; locale verilirse
      // şablondan türeyen servis adları/açıklamaları o dilde döner (tr=danışman metni).
      query: (arg) => {
        const consultantId = typeof arg === 'string' ? arg : arg.consultantId;
        const locale = typeof arg === 'string' ? '' : (arg.locale ?? '');
        const qs = locale ? `?locale=${encodeURIComponent(locale)}` : '';
        return `/consultants/${encodeURIComponent(consultantId)}/services${qs}`;
      },
      transformResponse: (res: { data: ConsultantServicePublic[] } | ConsultantServicePublic[]) =>
        Array.isArray(res) ? res : ((res as any)?.data ?? []),
    }),
  }),
  overrideExisting: false,
});

export const { useListConsultantServicesPublicQuery } = consultantServicesPublicApi;
