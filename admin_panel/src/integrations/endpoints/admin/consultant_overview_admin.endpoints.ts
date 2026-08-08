import { baseApi } from '@/integrations/baseApi';

// Admin danışman detay tab'ları (KYC / Ödemeler / İstatistik) tek endpoint'ten beslenir:
// GET /api/admin/consultants/:id/overview → { data: ConsultantOverview }.

export interface ConsultantKycInfo {
  kyc_status: 'none' | 'pending' | 'approved' | 'rejected';
  kyc_submitted_at: string | null;
  kyc_reviewed_at: string | null;
  kyc_rejection_reason: string | null;
  kyc_documents: Array<{ type?: string; url?: string; [k: string]: unknown }>;
  account_type: 'individual' | 'company' | null;
  identity_number: string | null;
  tax_number: string | null;
  tax_office: string | null;
  company_name: string | null;
  billing_address: string | null;
  bank_name: string | null;
  bank_iban: string | null;
  bank_account_holder: string | null;
}

export interface ConsultantWalletInfo {
  balance: number;
  pending_balance: number;
  currency: string;
}

export interface ConsultantOverviewStats {
  total_bookings: number;
  completed_count: number;
  pending_count: number;
  lifetime_earnings: number;
  month_earnings: number;
  month_sessions: number;
  total_sessions: number;
  rating_avg: number;
  rating_count: number;
  favorite_count: number;
}

export interface ConsultantWithdrawalRow {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled';
  requested_at: string | null;
  reviewed_at: string | null;
  paid_at: string | null;
  rejection_reason: string | null;
  bank_iban: string | null;
  bank_name: string | null;
  bank_holder: string | null;
  transfer_reference: string | null;
}

export interface ConsultantOverview {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  approval_status: string | null;
  kyc: ConsultantKycInfo;
  wallet: ConsultantWalletInfo | null;
  stats: ConsultantOverviewStats;
  withdrawals: ConsultantWithdrawalRow[];
  withdrawal_summary: { total_paid: number; pending_amount: number };
}

function unwrapOne(raw: unknown): ConsultantOverview {
  const data = (raw as { data?: unknown })?.data;
  return (data ?? raw) as ConsultantOverview;
}

export const consultantOverviewAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getConsultantOverviewAdmin: b.query<ConsultantOverview, string>({
      query: (id) => `/admin/consultants/${encodeURIComponent(id)}/overview`,
      transformResponse: unwrapOne,
      providesTags: (_res, _err, id) => [{ type: 'ConsultantOverview', id }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetConsultantOverviewAdminQuery } = consultantOverviewAdminApi;
