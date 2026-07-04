export type AccountDeletionRequestStatus = 'pending' | 'cancelled' | 'completed';

export type AccountDeletionRequestAdmin = {
  id: string;
  user_id: string;
  requested_at: string;
  scheduled_for: string;
  status: AccountDeletionRequestStatus;
  cancelled_at: string | null;
  completed_at: string | null;
  reason: string | null;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
  user_email: string | null;
  user_full_name: string | null;
  user_role: string | null;
  user_is_active: 0 | 1 | boolean | null;
  seconds_until_deletion: number | string | null;
};

export type AccountDeletionRequestsResponse = {
  data: AccountDeletionRequestAdmin[];
  meta: {
    status: AccountDeletionRequestStatus;
    limit: number;
    offset: number;
    total: number;
  };
};
