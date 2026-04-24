export type BookingPaymentInfoResp = {
  booking_id: string;
  customer_name: string;
  customer_email: string;
  appointment_date: string;
  appointment_time: string | null;
  service_name: string;
  price: number;
  price_display: string;
  currency: string;
  payment_status: string;
  gutschein_applicable?: boolean;
  payment_methods: {
    wallet: boolean;
    paypal: boolean;
  };
};

export type PayBookingBody = {
  payment_method: 'wallet' | 'paypal' | 'gutschein';
  gutschein_code?: string;
  return_url?: string;
  cancel_url?: string;
};

export type PayBookingResp = {
  success: boolean;
  payment_method: 'wallet' | 'paypal' | 'gutschein';
  booking_id: string;
  amount: number;
  currency: string;
  transaction_id?: string;
  paypal?: {
    order_id: string;
    approve_url: string | null;
  };
  gutschein_applied?: {
    code: string;
    value: number;
  };
};

export type CaptureBookingPaypalBody = {
  paypal_order_id: string;
};

export type CaptureBookingPaypalResp = {
  success: boolean;
  already_paid?: boolean;
  booking_id: string;
  amount?: string;
  currency?: string;
  capture_id?: string;
};
