import { baseApi } from '@/integrations/baseApi';
import type { ConsultantAdmin } from './consultants_admin.endpoints';

// Extend ConsultantAdmin with KYC fields if not already
export interface KycConsultantAdmin extends ConsultantAdmin {
  account_type: 'individual' | 'company' | null;
  identity_number: string | null;
  tax_number: string | null;
  tax_office: string | null;
  company_name: string | null;
  billing_address: string | null;
  kyc_status: 'none' | 'pending' | 'approved' | 'rejected' | null;
  kyc_rejection_reason: string | null;
  kyc_documents: Array<{ type: string; url: string }> | null;
}

function unwrapList(raw: unknown): KycConsultantAdmin[] {
  if (Array.isArray(raw)) return raw as KycConsultantAdmin[];
  const data = (raw as { data?: unknown })?.data;
  return Array.isArray(data) ? (data as KycConsultantAdmin[]) : [];
}

export const kycAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listPendingKycAdmin: b.query<KycConsultantAdmin[], void>({
      query: () => '/admin/kyc/pending',
      transformResponse: unwrapList,
      providesTags: ['KycPending'],
    }),
    approveKycAdmin: b.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/admin/kyc/${encodeURIComponent(id)}/approve`, method: 'POST' }),
      invalidatesTags: ['KycPending'],
    }),
    rejectKycAdmin: b.mutation<{ success: boolean }, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/kyc/${encodeURIComponent(id)}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['KycPending'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListPendingKycAdminQuery,
  useApproveKycAdminMutation,
  useRejectKycAdminMutation,
} = kycAdminApi;
