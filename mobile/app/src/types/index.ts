// ─── Auth ──────────────────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
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
  refresh_token?: string;
  token_type: string;
  user: User;
}

export interface MeResponse {
  user: User;
}

export interface KvkkAccountDeletionStatus {
  id: string;
  status: 'pending' | 'cancelled' | 'completed';
  requested_at: string | null;
  scheduled_for: string | null;
  completed_at: string | null;
  reason: string | null;
  cooling_off_days?: number;
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
  /** FAZ 41 — auth/me; yoksa subscriptions/me ile türetilir */
  is_premium?: boolean;
  subscription?: UserSubscriptionSummary | null;
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
  video_session_price?: string | null;
  supports_video?: number;      // 0 | 1
  currency: string;             // "TRY"
  approval_status: 'pending' | 'approved' | 'rejected';
  is_available: number;         // 0 | 1
  is_online?: boolean | number;  // backend presence heartbeat
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

export interface ConsultantAvailability {
  consultant_id: string;
  resource_id: string | null;
  windows: Array<{ start: string; end: string }>;
  busy: Array<{ start: string; end: string; kind: 'booking' | 'block'; label?: string | null }>;
  starts: string[];
  step_minutes: number;
  duration_minutes: number;
}

export interface ConsultantService {
  id: string;
  consultant_id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  price: string;
  currency: string;
  is_free: number;
  media_type?: 'audio' | 'video' | 'both';
  is_active: number;
  sort_order: number;
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
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  resource_id: string;
  slot_id?: string;
  appointment_date: string;     // "YYYY-MM-DD"
  appointment_time?: string;    // "HH:mm"
  session_duration: number;
  session_price: string;
  media_type?: 'audio' | 'video';
  status: BookingStatus;
  customer_note?: string;
  customer_message?: string | null;
  created_at: string;
  // Joined
  consultant?: Consultant;
  consultant_name?: string | null;
  consultant_avatar?: string | null;
}

export interface BookingCreateInput {
  consultant_id: string;
  resource_id: string;
  appointment_date: string;
  appointment_time: string;
  session_duration: number;
  session_price: string;
  media_type?: 'audio' | 'video';
  withdrawal_consent?: boolean;
  service_id?: string;
  customer_message?: string;
  source_type?: 'daily_reading';
  source_id?: string;
}

export interface BookingCreateResult {
  ok: boolean;
  id: string;
  status: BookingStatus;
}

// ─── Subscription ───────────────────────────────────────────────

export type SubscriptionProvider = 'iyzipay' | 'apple_iap' | 'google_iap' | 'manual';
export type SubscriptionStatus = 'pending' | 'active' | 'cancelled' | 'expired' | 'grace_period' | 'past_due';

export interface UserSubscriptionSummary {
  tier: 'free' | 'premium';
  plan_code: string | null;
  period: 'monthly' | 'yearly' | 'lifetime' | null;
  status: SubscriptionStatus;
  ends_at: string | null;
  trial_ends_at: string | null;
  is_trial: boolean;
}

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

// ─── Paid Media Messages ──────────────────────────────────────────

export type MediaMessageKind = 'audio' | 'video';
export type MediaMessageStatus = 'sent' | 'answered' | 'expired' | 'refunded';

export interface MediaMessage {
  id: string;
  user_id: string;
  consultant_id: string;
  parent_id: string | null;
  kind: MediaMessageKind;
  direction: 'question' | 'reply';
  storage_path: string;
  duration_seconds: number | null;
  note: string | null;
  price: number;
  currency: string;
  status: MediaMessageStatus;
  reply_due_at: string | null;
  answered_at: string | null;
  created_at: string;
  consultant_name?: string | null;
  consultant_avatar_url?: string | null;
  customer_name?: string | null;
  customer_avatar_url?: string | null;
  reply_id?: string | null;
  reply_kind?: MediaMessageKind | null;
  reply_storage_path?: string | null;
  reply_duration_seconds?: number | null;
  reply_note?: string | null;
  reply_created_at?: string | null;
}

export interface MediaMessageCreateInput {
  consultant_id: string;
  kind: MediaMessageKind;
  storage_path: string;
  duration_seconds?: number;
  note?: string | null;
}

export interface ConsultantMediaSettings {
  consultant_id: string;
  audio_enabled: boolean;
  audio_price: number;
  video_enabled: boolean;
  video_price: number;
  reply_sla_hours: number;
  currency: string;
}

// ─── Consultant Self Panel ────────────────────────────────────────

export interface ConsultantSelfStats {
  this_month_session_count: number;
  this_month_earnings: number;
  last_month_session_count: number;
  last_month_earnings: number;
  session_delta_pct: number;
  earnings_delta_pct: number;
  pending_bookings: number;
  requested_now_count: number;
  pending_messages: number;
  avg_response_minutes: number;
  rating_avg: number;
  rating_count: number;
  total_sessions: number;
  favorite_count: number;
  is_available: number;
  last_7_days: Array<{ date: string; count: number; earnings: number }>;
}

export interface ConsultantSelfBooking {
  id: string;
  user_id: string;
  service_id: string | null;
  appointment_date: string;
  appointment_time: string | null;
  session_duration: number;
  session_price: string;
  media_type: string;
  status: string;
  customer_message: string | null;
  customer_note?: string | null;
  admin_note?: string | null;
  decision_note?: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  customer_avatar_url?: string | null;
  service_title?: string | null;
  created_at: string;
}

export interface ConsultantWorkingHour {
  id?: string;
  dow: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  capacity: number;
  is_active: number;
}

export interface ConsultantSelfAvailability {
  resource_id: string | null;
  resource_title?: string | null;
  working_hours: ConsultantWorkingHour[];
}

export interface ConsultantTimeBlock {
  id: string;
  consultant_id: string;
  block_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  created_at?: string;
}

export interface ConsultantWallet {
  id: string;
  balance: string;
  pending_balance: string;
  currency: string;
}

export interface ConsultantWalletTransaction {
  id: string;
  wallet_id: string;
  user_id?: string;
  amount: string;
  currency?: string;
  type: 'credit' | 'debit';
  purpose: string;
  description: string | null;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_ref?: string | null;
  created_at: string;
}

export interface ConsultantWalletResponse {
  wallet: ConsultantWallet;
  transactions: ConsultantWalletTransaction[];
  this_month: {
    credits: number;
    debits: number;
    net: number;
  };
}

export interface ConsultantWithdrawalRequest {
  id: string;
  consultant_id: string;
  amount: string;
  currency: string;
  bank_iban: string;
  bank_holder: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled';
  requested_at: string;
  reviewed_at?: string | null;
  paid_at?: string | null;
  rejection_reason?: string | null;
  admin_note?: string | null;
  transfer_reference?: string | null;
}

export type ConsultantKycStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface ConsultantKycDocument {
  type: 'id_front' | 'id_back' | 'tax_certificate' | 'other';
  url: string;
  storage_asset_id?: string;
  name?: string;
  mime?: string;
  size?: number;
  uploaded_at?: string;
}

export interface ConsultantSelfProfile {
  id: string;
  user_id: string;
  bio: string | null;
  session_price?: string | number | null;
  session_duration?: number | null;
  video_session_price?: string | number | null;
  is_available?: number | null;
  supports_video?: number | null;
  account_type: 'individual' | 'company' | null;
  identity_number: string | null;
  tax_number: string | null;
  tax_office: string | null;
  company_name: string | null;
  billing_address: string | null;
  bank_name: string | null;
  bank_iban: string | null;
  bank_account_holder: string | null;
  kyc_status: ConsultantKycStatus;
  kyc_rejection_reason: string | null;
  kyc_documents?: ConsultantKycDocument[] | null;
}

export interface ConsultantSelfService {
  id: string;
  consultant_id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  price: string;
  currency: string;
  media_type: 'audio' | 'video';
  is_free: number;
  is_active: number;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ConsultantSelfServicePayload {
  name: string;
  slug: string;
  description?: string | null;
  duration_minutes: number;
  price: number;
  currency?: string;
  media_type?: 'audio' | 'video';
  is_free?: number;
  is_active?: number;
  sort_order?: number;
}

export interface ConsultantSelfReview {
  id: string;
  target_id: string;
  user_id: string | null;
  name?: string | null;
  email?: string | null;
  rating: number;
  comment: string | null;
  consultant_reply: string | null;
  consultant_replied_at: string | null;
  is_approved: number;
  is_verified: number;
  created_at: string;
  locale?: string | null;
}

export interface ConsultantSelfThreadCustomer {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface ConsultantSelfThreadMessage {
  id: string;
  thread_id: string;
  sender_user_id: string;
  text: string;
  created_at: string;
  from_consultant: boolean;
}

export interface ConsultantSelfThread {
  thread_id: string;
  context_type: 'consultant_lead' | 'booking';
  context_id: string;
  created_at: string;
  updated_at: string;
  customer: ConsultantSelfThreadCustomer | null;
  unread_count: number;
  last_message: ConsultantSelfThreadMessage | null;
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
  tz_offset?: number;
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
  /** @deprecated Backend resolves timezone from coordinates. Do not send from client. */
  tz_offset?: number;
  tob_known?: boolean;
}

/** POST /birth-charts/preview-big-three Büyük Üçlü yanıtı */
export interface BigThreeSlotPayload {
  slot: 'sun' | 'moon' | 'ascendant';
  sign: string;
  sign_label: string | null;
  kb_title: string | null;
  summary: string | null;
  image_url: string | null;
  tob_unknown?: boolean;
}

export interface BigThreePreviewResponse {
  big_three: {
    sun: BigThreeSlotPayload | null;
    moon: BigThreeSlotPayload | null;
    ascendant: BigThreeSlotPayload | null;
  };
  input: {
    name: string;
    dob: string;
    tob: string;
    tob_known: boolean;
    pob_label: string;
  };
  cta: {
    message: string;
    action_path: string;
  };
}

export interface GeocodeResult {
  q: string;
  lat: number;
  lng: number;
  label: string;
  tz_iana?: string;
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
  target_type: 'consultant' | string;
  target_id: string;
  user_id: string;
  booking_id?: string;
  rating: number;
  comment?: string | null;
  name?: string | null;
  admin_reply?: string | null;
  consultant_reply?: string | null;
  is_verified?: boolean | number;
  is_approved?: boolean;
  submitted_locale?: string;
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
// ─── Campaign ──────────────────────────────────────────────────────
export type CampaignType = 'discount_percentage' | 'discount_fixed' | 'bonus_credits' | 'free_trial_days';
export type CampaignAppliesTo = 'all' | 'consultant_booking' | 'subscription' | 'credit_package';

export interface Campaign {
  id: string;
  code: string;
  type: CampaignType;
  value: string;
  applies_to: CampaignAppliesTo;
  is_active: boolean;
  starts_at?: string;
  ends_at?: string;
}

export interface RedeemCampaignResponse {
  valid: boolean;
  campaign: Campaign;
  message?: string;
}

// ─── Navigation / menu_items (backend public tree) ───────────────

export interface PublicMenuItemDto {
  id: string;
  title: string;
  url: string;
  href: string;
  slug: string | null;
  section_id: string | null;
  parent_id: string | null;
  icon: string | null;
  is_active: boolean;
  position: number;
  order_num: number;
  children?: PublicMenuItemDto[];
}

/** GET /footer_sections — public liste (mobil footer grupları) */
export interface FooterSectionPublic {
  id: string;
  slug: string;
  title: string | null;
  display_order: number;
}
