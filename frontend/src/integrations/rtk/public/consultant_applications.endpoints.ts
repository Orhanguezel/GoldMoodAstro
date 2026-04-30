import { baseApi } from '@/integrations/rtk/baseApi';

export interface ConsultantApplicationPayload {
  email: string;
  full_name: string;
  phone?: string;
  bio: string;
  expertise: string[];
  languages: string[];
  experience_years?: number;
  certifications?: string;
  cv_url?: string;
  sample_chart_url?: string;
}

export const consultantApplicationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    applyConsultant: build.mutation<{ id: string }, ConsultantApplicationPayload>({
      query: (body) => ({
        url: '/consultants/apply',
        method: 'POST',
        body,
      }),
      transformResponse: (res: { data: { id: string } }) => res.data,
      invalidatesTags: ['ConsultantApplications' as any],
    }),
  }),
  overrideExisting: false,
});

export const { useApplyConsultantMutation } = consultantApplicationsApi;
