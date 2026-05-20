export type WithdrawalStatus = 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled';

export type WithdrawalRequestDto = {
  id: string;
  consultant_id: string;
  amount: string;
  currency: string;
  bank_iban: string;
  bank_holder: string;
  status: WithdrawalStatus;
  requested_at: string;
  reviewed_at: string | null;
  paid_at: string | null;
  rejection_reason: string | null;
  admin_note: string | null;
  transfer_reference: string | null;
  
  // Enriched fields from users table
  consultant_email?: string | null;
  consultant_name?: string | null;
};

export type WithdrawalsListResponse = {
  items: WithdrawalRequestDto[];
  total: number;
};

export type WithdrawalsListQueryParams = {
  status?: WithdrawalStatus;
  consultant_id?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  orderDir?: 'asc' | 'desc';
};

export function coerceWithdrawalsList(raw: unknown): WithdrawalsListResponse {
  const r = raw as any;
  if (!r) return { items: [], total: 0 };
  if (Array.isArray(r)) return { items: r as WithdrawalRequestDto[], total: r.length };
  if (Array.isArray(r.items)) {
    const total = Number.isFinite(Number(r.total)) ? Number(r.total) : r.items.length;
    return { items: r.items as WithdrawalRequestDto[], total };
  }
  if (Array.isArray(r.data)) {
    const total = Number.isFinite(Number(r.total)) ? Number(r.total) : r.data.length;
    return { items: r.data as WithdrawalRequestDto[], total };
  }
  return { items: [], total: 0 };
}
