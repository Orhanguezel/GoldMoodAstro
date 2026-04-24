export type GutscheinProductDto = {
  id: string;
  name: string;
  value: string;
  currency: string;
  validity_days: number;
  description: string | null;
  is_active: number;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type PurchaseGutscheinBody = {
  product_id?: string | null;
  custom_value?: number | null;
  custom_currency?: string | null;
  purchaser_name: string;
  purchaser_email: string;
  recipient_name?: string | null;
  recipient_email?: string | null;
  personal_message?: string | null;
};

export type PurchaseGutscheinResp = {
  success: boolean;
  gutschein_id: string;
  code: string;
  value: string;
  currency: string;
  expires_at: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  paypal?: {
    order_id: string;
    approve_url: string | null;
  };
};

export type CaptureGutscheinPaypalResp = {
  success: boolean;
  already_paid?: boolean;
  gutschein_id: string;
  code: string;
  value?: string;
  currency?: string;
  capture_status?: string;
};

export type CheckGutscheinBody = { code: string };

export type CheckGutscheinResp = {
  code: string;
  value: string;
  currency: string;
  status: 'pending' | 'active' | 'redeemed' | 'expired' | 'cancelled';
  expires_at: string | null;
  recipient_name: string | null;
};

export type RedeemGutscheinBody = {
  code: string;
  booking_id?: string | null;
};

export type RedeemGutscheinResp = {
  success: boolean;
  code: string;
  value: string;
  currency: string;
};
