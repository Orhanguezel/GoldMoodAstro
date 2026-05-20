// =============================================================
// FILE: src/integrations/endpoints/admin/commission_change_admin.endpoints.ts
// Komisyon orani degisikligi bildirim mailer endpoint'i.
// =============================================================

import { baseApi } from '@/integrations/baseApi';

export interface CommissionState {
  new_percent: number;
  previous_percent: number | null;
  effective_from: string | null;
  notice_days: number;
}

export interface CommissionCandidatePreview {
  consultant_id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  locale: string;
  already_sent_at: string | null;
}

export interface CommissionNoticeError {
  consultant_id: string;
  user_id: string;
  email: string | null;
  error: string;
}

export interface CommissionNoticeResult {
  dry_run: boolean;
  total_candidates: number;
  sent: number;
  skipped: number;
  errors: CommissionNoticeError[];
  commission: CommissionState;
  candidates_preview?: CommissionCandidatePreview[];
}

export interface SendCommissionNoticeArgs {
  dry_run?: boolean;
  force?: boolean;
}

interface ApiEnvelope<T> {
  data?: T;
}

function unwrap(input: unknown): CommissionNoticeResult {
  const obj = (input ?? {}) as ApiEnvelope<CommissionNoticeResult>;
  if (obj && typeof obj === 'object' && 'data' in obj && obj.data && typeof obj.data === 'object') {
    return obj.data as CommissionNoticeResult;
  }
  return input as CommissionNoticeResult;
}

const ADMIN_BASE = '/admin/commission-change';

export const commissionChangeAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    sendCommissionNoticeAdmin: b.mutation<CommissionNoticeResult, SendCommissionNoticeArgs | void>({
      query: (args) => {
        const params: Record<string, string> = {};
        params.dry_run = args && args.dry_run === false ? 'false' : 'true';
        if (args && args.force) params.force = 'true';
        return {
          url: `${ADMIN_BASE}/send-notice`,
          method: 'POST',
          params,
        };
      },
      transformResponse: (res: unknown): CommissionNoticeResult => unwrap(res),
    }),
  }),
  overrideExisting: true,
});

export const { useSendCommissionNoticeAdminMutation } = commissionChangeAdminApi;
