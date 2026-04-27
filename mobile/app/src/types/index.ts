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
  media_type?: 'audio' | 'video';
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

// ─── Subscription ───────────────────────────────────────────────

export type SubscriptionProvider = 'iyzipay' | 'apple_iap' | 'google_iap' | 'manual';
export type SubscriptionStatus = 'pending' | 'active' | 'cancelled' | 'expired' | 'grace_period' | 'past_due';

export interface SubscriptionPlan {
  id: string;
  code: string;
  name_tr: string;
  name_en: string;
  description_tr?: string | null;
  description_en?: string | null;
  price_minor: number;
  currency: string;
  period: 'monthly' | 'yearly' | 'lifetime';
  trial_days: number;
  features: unknown;
  is_active: number;
  display_order: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  provider: SubscriptionProvider;
  provider_subscription_id: string | null;
  status: SubscriptionStatus;
  started_at: string | null;
  ends_at: string | null;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  auto_renew: number;
  price_minor: number;
  currency: string;
  created_at?: string;
  updated_at?: string;
  plan?: SubscriptionPlan;
}

export interface CreditPackage {
  id: string;
  code: string;
  name_tr: string;
  name_en: string;
  description_tr?: string | null;
  description_en?: string | null;
  price_minor: number;
  currency: string;
  credits: number;
  bonus_credits: number;
  is_active: number;
  is_featured: number;
  display_order: number;
}

export type CreditTransactionType = 'purchase' | 'consumption' | 'refund' | 'bonus' | 'adjustment';

export interface CreditTransaction {
  id: string;
  type: CreditTransactionType;
  amount: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  order_id: string | null;
  description: string | null;
  created_at: string;
}

export interface CreditMe {
  balance: number;
  currency: string;
  recent_transactions: CreditTransaction[];
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

// ─── LiveKit ───────────────────────────────────────────────────────

export interface LiveKitTokenResponse {
  token: string;
  room: string;
  ws_url: string;
  expires_at: string;
}

// ─── Astrology / Birth Chart ──────────────────────────────────────

export type ZodiacSign =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

export type PlanetKey =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto';

export interface PlanetPlacement {
  key: PlanetKey;
  name: string;
  symbol: string;
  longitude: number;
  sign: ZodiacSign;
  sign_label: string;
  degree_in_sign: number;
  house: number;
  retrograde: boolean;
}

export interface HouseCusp {
  house: number;
  longitude: number;
  sign: ZodiacSign;
  sign_label: string;
  degree_in_sign: number;
}

export interface ChartAspect {
  type: 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';
  planet_a: PlanetKey;
  planet_b: PlanetKey;
  orb: number;
  exact_angle: number;
}

export interface NatalChart {
  planets: Record<PlanetKey, PlanetPlacement>;
  houses: HouseCusp[];
  ascendant: HouseCusp;
  midheaven: HouseCusp;
  aspects: ChartAspect[];
}

export interface BirthChart {
  id: string;
  user_id: string;
  name: string;
  dob: string;
  tob: string;
  pob_lat: string;
  pob_lng: string;
  pob_label: string;
  tz_offset: number;
  chart_data: NatalChart;
  created_at?: string;
  updated_at?: string;
}

export interface BirthChartCreateInput {
  name: string;
  dob: string;
  tob: string;
  pob_lat: number;
  pob_lng: number;
  pob_label: string;
  tz_offset: number;
}

export interface GeocodeResult {
  q: string;
  lat: number;
  lng: number;
  label: string;
  source: 'cache' | 'nominatim';
}

export interface DailyReading {
  id: string;
  user_id: string;
  chart_id: string;
  reading_date: string;
  content: string;
  transits_snapshot?: unknown;
  model_used?: string;
}

export interface DailyReadingResponse {
  reading: DailyReading;
  reused: boolean;
  similarity_max: number;
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

// ─── Banner ────────────────────────────────────────────────────────

export type BannerPlacement =
  | 'home_hero'
  | 'home_sidebar'
  | 'home_footer'
  | 'consultant_list'
  | 'mobile_welcome'
  | 'mobile_home'
  | 'mobile_call_end';

export interface Banner {
  id: string;
  code: string;
  title_tr?: string | null;
  title_en?: string | null;
  subtitle_tr?: string | null;
  subtitle_en?: string | null;
  image_url: string;
  image_url_mobile?: string | null;
  link_url?: string | null;
  cta_label_tr?: string | null;
  cta_label_en?: string | null;
  placement: BannerPlacement;
  locale: string;
  priority: number;
}
