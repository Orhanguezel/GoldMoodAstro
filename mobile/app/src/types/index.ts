// ─── Auth ──────────────────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterInput {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  rules_accepted: true;
}

export interface RegisterResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface MeResponse {
  user: User;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'user' | 'consultant' | 'admin';
  avatar_url?: string;
  fcm_token?: string;
  is_active: boolean;
}

// ─── Consultant ────────────────────────────────────────────────────

export interface Consultant {
  id: string;
  user_id: string;
  // Joined from users table
  full_name?: string;
  avatar_url?: string;
  // Consultant fields
  bio?: string;
  expertise: string[];          // ["astrology","tarot","numerology"]
  languages: string[];          // ["tr","en"]
  session_price: string;        // decimal as string: "850.00"
  session_duration: number;     // minutes
  currency: string;             // "TRY"
  approval_status: 'pending' | 'approved' | 'rejected';
  is_available: number;         // 0 | 1
  rating_avg: string;           // "4.90"
  rating_count: number;
  total_sessions: number;
}

export interface ConsultantSlot {
  id: string;
  resource_id: string;
  slot_date: string;            // "YYYY-MM-DD"
  slot_time: string;            // "HH:mm:ss"
  capacity: number;
  is_active: number;
  reserved_count?: number;
}

// ─── Booking ───────────────────────────────────────────────────────

export type BookingStatus =
  | 'pending_payment'
  | 'booked'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Booking {
  id: string;
  user_id: string;
  consultant_id: string;
  order_id?: string;
  resource_id: string;
  slot_id?: string;
  appointment_date: string;     // "YYYY-MM-DD"
  appointment_time?: string;    // "HH:mm"
  session_duration: number;
  session_price: string;
  status: BookingStatus;
  customer_note?: string;
  created_at: string;
  // Joined
  consultant?: Consultant;
}

export interface BookingCreateInput {
  consultant_id: string;
  resource_id: string;
  appointment_date: string;
  appointment_time: string;
  session_duration: number;
  session_price: string;
  customer_message?: string;
}

// ─── Order / Payment ───────────────────────────────────────────────

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed';

export interface Order {
  id: string;
  user_id: string;
  booking_id: string;
  order_number: string;
  status: string;
  total_amount: string;
  currency: string;
  payment_status: PaymentStatus;
  transaction_id?: string;
}

export interface OrderCreateResponse {
  success: boolean;
  order_id: string;
  order_number: string;
}

export interface IyzipayInitResponse {
  success: boolean;
  checkout_url: string;
  token: string;
}

// ─── Agora ─────────────────────────────────────────────────────────

export interface AgoraTokenResponse {
  channel_name: string;
  token: string;
  app_id: string;
  uid: number;
}

// ─── Review ────────────────────────────────────────────────────────

export interface Review {
  id: string;
  target_type: string;
  target_id: string;
  user_id: string;
  booking_id?: string;
  rating: number;
  comment?: string;
  is_approved: boolean;
  submitted_locale: string;
  created_at: string;
}
