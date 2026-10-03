/**
 * GoldMoodAstro API istemcisi.
 * Base URL Fastify ön ekiyle uyumlu: /api (örn. /api/auth/login).
 * Auth gerektiren istekler Authorization: Bearer ile gider.
 */

import Constants from 'expo-constants';
import { router } from 'expo-router';
import { storage } from '@/lib/storage';
import type { CustomPageRow } from '@/lib/cms';
import { messageFromApiErrorBody, normalizeListResponse } from '@/lib/apiUtils';
import { PAYMENT_SUCCESS_PATTERNS, PAYMENT_FAILURE_PATTERNS } from '@/lib/paymentReturn';
import { fetchWithPolicy, HttpError, SessionChangedError } from './core/transport';
import {
  buildBookingCreateRequest,
  buildLoginRequest,
  buildMobilePasswordResetRequest,
  buildOrderForBookingRequest,
  buildRegisterRequest,
  apiPaths,
} from '@/lib/apiContracts';
import type {
  Consultant, ConsultantAvailability, ConsultantService,
  Booking, BookingCreateInput, BookingCreateResult,
  Review,
  Subscription, SubscriptionPlan, CreditMe, CreditPackage,
  MediaMessage, MediaMessageCreateInput, ConsultantMediaSettings, MediaMessageKind,
  ConsultantSelfStats,
  ConsultantSelfBooking,
  ConsultantSelfAvailability,
  ConsultantTimeBlock,
  ConsultantWalletResponse,
  ConsultantWithdrawalRequest,
  ConsultantSelfProfile,
  ConsultantKycDocument,
  ConsultantSelfThread,
  ConsultantSelfThreadMessage,
  ConsultantSelfService,
  ConsultantSelfServicePayload,
  ConsultantSelfReview,
  KvkkAccountDeletionStatus,
  Order, OrderCreateResponse, CheckoutInitResponse,
  LiveKitTokenResponse,
  BirthChart, BirthChartCreateInput, GeocodeResult, DailyReadingResponse,
  BigThreePreviewResponse,
  MeResponse,
  LoginInput, LoginResponse,
  RegisterInput, RegisterResponse,
  Campaign, RedeemCampaignResponse,
  PublicMenuItemDto,
  FooterSectionPublic,
  Banner,
} from '@/types';

import { logger } from '@/lib/logger';
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  'http://localhost:8094/api';

/** Cihazın yerel takvimine göre YYYY-MM-DD — günlük burç eşlemesi için sunucu TZ’inden bağımsız. */
export function formatLocalYmd(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** YYYY-MM-DD → yerel gece yarısı Date (UTC kayması yok). */
export function localDateFromYmd(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export const getAssetUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = API_URL.replace(/\/api(\/v1)?\/?$/i, '');
  return `${base}${path}`;
};

/** Public web origin derived from API base — used for CMS routes (blog, about, …). */
export function getPublicSiteOrigin(): string {
  return API_URL.replace(/\/api(\/v1)?\/?$/i, '').replace(/\/+$/, '');
}

/** Next.js site (aynı içerik / web menüleri) — WebView URL’leri için. */
export function getPublicWebUrl(): string {
  const fromEnv = typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_SITE_URL?.trim() : '';
  const extra = (Constants.expoConfig?.extra ?? {}) as { siteUrl?: string };
  const fromExtra = extra.siteUrl?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  if (fromExtra) return fromExtra.replace(/\/+$/, '');
  const apiOrigin = API_URL.replace(/\/api(\/v1)?\/?$/i, '').replace(/\/+$/, '');
  if (/127\.0\.0\.1|localhost/i.test(apiOrigin)) return 'http://localhost:3000';
  try {
    const normalized = apiOrigin.startsWith('http') ? apiOrigin : `https://${apiOrigin}`;
    const u = new URL(normalized);
    return `${u.protocol}//${u.hostname}`.replace(/\/+$/, '');
  } catch {
    return 'http://localhost:3000';
  }
}

// -------------------------------------------------------------------
// HTTP core
// -------------------------------------------------------------------

type ApiEnvelope<T> = { data: T };
type JsonRecord = Record<string, unknown>;

export interface MobileProfile extends JsonRecord {
  full_name?: string;
  phone?: string | null;
  address_line1?: string | null;
  city?: string | null;
  avatar_url?: string | null;
  push_notifications?: boolean | number;
  email_notifications?: boolean | number;
}

export interface AppNotification extends JsonRecord {
  id: string;
  type?: string;
  title?: string;
  body?: string;
  message?: string;
  is_read?: boolean | number;
  created_at?: string;
  data?: JsonRecord | null;
}

export interface HoroscopeToday extends JsonRecord {
  id?: string;
  sign?: string;
  date?: string;
  period_start_date?: string;
  periodStartDate?: string;
  short_summary?: string;
  content?: string;
}

export interface HoroscopeSignInfo extends JsonRecord {
  sign?: string;
  label?: string;
  short_summary?: string;
  element?: string;
  modality?: string;
}

export interface HoroscopeCompatibility extends JsonRecord {
  signA?: string;
  signB?: string;
  score?: number;
  content?: string;
}

export interface ReadingCard extends JsonRecord {
  name?: string;
  image_url?: string | null;
}

export interface ReadingResult extends JsonRecord {
  id?: string;
  title?: string;
  interpretation?: string;
  reading?: string;
  result_text?: string;
  readingText?: string;
  dream_text?: string;
  content?: string;
  raw?: string;
  cards?: ReadingCard[];
  data?: ReadingResult;
  result?: JsonRecord & {
    reading?: string;
    love_score?: number;
    sexual_score?: number;
  };
}

export interface YildiznameReading extends ReadingResult {
  id: string;
  ebced_total: number;
  menzil_no: number;
  interpretation: string;
  menzil?: { name_tr?: string };
  ebcedValue: number;
  signNumber: number;
  readingText: string;
}

export interface SynastryResult extends ReadingResult {
  love_score?: number;
  sexual_score?: number;
  score?: number;
}

export interface SynastryInvite extends JsonRecord {
  id: string;
  status?: string;
  partner_user_id?: string;
}

export interface UserSearchResult extends JsonRecord {
  id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string | null;
}

export interface RedeemedCampaign extends JsonRecord {
  id?: string;
  campaign_id?: string;
  code?: string;
  redeemed_at?: string;
}

let _authToken: string | null = null;
let authEpoch = 0;
let hydrated = false;
let hydration: Promise<string | null> | null = null;
const authListeners = new Set<() => void>();
export const getAuthEpoch = () => authEpoch;
export const subscribeToAuth = (listener: () => void) => {
  authListeners.add(listener);
  return () => { authListeners.delete(listener); };
};
const UNAUTHORIZED_NO_GLOBAL_SIGNOUT = new Set([
  '/auth/login', '/auth/register', '/auth/social-login', '/auth/token/refresh',
]);

export function setAuthToken(token: string | null) {
  hydrated = true;
  if (_authToken === token) return;
  _authToken = token;
  authEpoch++;
  for (const listener of authListeners) listener();
}

export async function hydrateAuthTokenFromStorage(): Promise<string | null> {
  if (hydrated) return _authToken;
  if (hydration) return hydration;
  const epoch = authEpoch;
  hydration = (async () => {
    const token = await storage.getAuthToken();
    if (epoch === authEpoch && !hydrated) setAuthToken(token);
    return _authToken;
  })().finally(() => { hydration = null; });
  return hydration;
}

let refreshFlight: { epoch: number; promise: Promise<string | null> } | null = null;
async function refreshAccessToken(epoch: number): Promise<string | null> {
  if (refreshFlight?.epoch === epoch) return refreshFlight.promise;
  const expected = _authToken;
  const promise = (async () => {
    const refreshToken = await storage.getRefreshToken();
    if (epoch !== authEpoch) throw new SessionChangedError();
    if (!refreshToken || !expected) return null;
    const res = await fetchWithPolicy(`${API_URL}/auth/token/refresh`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (epoch !== authEpoch) throw new SessionChangedError();
    if (res.status === 401 || res.status === 403) return null;
    // Connectivity/server failures must not revoke a valid persisted session.
    if (!res.ok) throw new HttpError(res.status);
    const data = await res.json() as { access_token?: string; refresh_token?: string };
    if (!data.access_token) throw new HttpError(502, 'Invalid refresh response');
    if (!await storage.rotateSession(expected, data.access_token, data.refresh_token)) {
      throw new SessionChangedError();
    }
    if (epoch !== authEpoch) throw new SessionChangedError();
    // Rotation keeps the same account epoch; login/logout increment it.
    _authToken = data.access_token;
    return data.access_token;
  })();
  const flight = { epoch, promise };
  refreshFlight = flight;
  try { return await promise; }
  finally { if (refreshFlight === flight) refreshFlight = null; }
}

async function handleSessionExpired(path: string, epoch: number) {
  if (epoch !== authEpoch || !_authToken || UNAUTHORIZED_NO_GLOBAL_SIGNOUT.has(path)) return;
  setAuthToken(null);
  await storage.clearSession();
  try { router.replace('/auth/login' as const); }
  catch { /* Router may not be mounted during bootstrap. */ }
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string,
  body?: unknown, params?: Record<string, string | number>,
): Promise<T> {
  await hydrateAuthTokenFromStorage();
  const epoch = authEpoch;
  const url = new URL(`${API_URL}${path}`);
  for (const [key, value] of Object.entries(params ?? {})) url.searchParams.set(key, String(value));
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_authToken) headers.Authorization = `Bearer ${_authToken}`;
  const init = { method, headers, body: body != null ? JSON.stringify(body) : undefined };
  let res = await fetchWithPolicy(url.toString(), init);
  if (epoch !== authEpoch) throw new SessionChangedError();
  if (res.status === 401 && !UNAUTHORIZED_NO_GLOBAL_SIGNOUT.has(path)) {
    const refreshed = await refreshAccessToken(epoch);
    if (refreshed) {
      // Do not automatically replay writes (booking, payment, deletion).
      if (method !== 'GET') throw new HttpError(409, 'Session refreshed; please retry the operation');
      headers.Authorization = `Bearer ${refreshed}`;
      res = await fetchWithPolicy(url.toString(), init, { retries: 0 });
    }
  }
  if (epoch !== authEpoch) throw new SessionChangedError();
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) await handleSessionExpired(path, epoch);
    throw new HttpError(res.status, messageFromApiErrorBody(body));
  }
  const data = res.status === 204 ? undefined : await res.json();
  if (epoch !== authEpoch) throw new SessionChangedError();
  return data as T;
}

/** Multipart writes use the same deadline and account boundary as JSON writes. */
async function uploadForm(path: string, form: FormData): Promise<unknown> {
  await hydrateAuthTokenFromStorage();
  const epoch = authEpoch;
  const headers: Record<string, string> = {};
  if (_authToken) headers.Authorization = `Bearer ${_authToken}`;
  const res = await fetchWithPolicy(`${API_URL}${path}`, { method: 'POST', headers, body: form });
  if (epoch !== authEpoch) throw new SessionChangedError();
  if (res.status === 401) {
    const refreshed = await refreshAccessToken(epoch);
    if (refreshed) throw new HttpError(409, 'Session refreshed; please retry the operation');
  }
  if (epoch !== authEpoch) throw new SessionChangedError();
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    if (res.status === 401) await handleSessionExpired(path, epoch);
    throw new HttpError(res.status, messageFromApiErrorBody(errorBody));
  }
  const result: unknown = await res.json();
  if (epoch !== authEpoch) throw new SessionChangedError();
  return result;
}

/** GET: 404 veya ağ hatası → null (tema / opsiyonel veri; LogBox spam’i yok). */
async function getAllow404<T>(
  path: string,
  params?: Record<string, string | number>,
): Promise<T | null> {
  await hydrateAuthTokenFromStorage();
  const epoch = authEpoch;

  const url = new URL(`${API_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_authToken) headers['Authorization'] = `Bearer ${_authToken}`;

  try {
    const res = await fetchWithPolicy(url.toString(), { method: 'GET', headers });
    if (epoch !== authEpoch) return null;
    if (res.status === 404) return null;
    if (!res.ok) {
      if (__DEV__) {
        const err = await res.json().catch(() => ({}));
        logger.warn(`[GoldMood] GET ${path} → ${res.status}`, err);
      }
      return null;
    }
    const data = (await res.json()) as T;
    return epoch === authEpoch ? data : null;
  } catch {
    if (__DEV__) {
      logger.warn(
        `[GoldMood] GET ${path} — ağ hatası (backend çalışıyor mu? iOS simülatör: localhost; gerçek cihaz: Mac LAN IP + EXPO_PUBLIC_API_URL)`,
      );
    }
    return null;
  }
}

const get  = <T>(path: string, params?: Record<string, string | number>) => request<T>('GET', path, undefined, params);
const post = <T>(path: string, body: unknown) => request<T>('POST', path, body);
const put = <T>(path: string, body: unknown) => request<T>('PUT', path, body);
const patch = <T>(path: string, body: unknown) => request<T>('PATCH', path, body);
const del = <T>(path: string) => request<T>('DELETE', path);

// -------------------------------------------------------------------
// Auth
// -------------------------------------------------------------------

export const authApi = {
  login: (data: LoginInput) => {
    const req = buildLoginRequest(data);
    return post<LoginResponse>(req.path, req.body);
  },

  register: (data: RegisterInput) => {
    const req = buildRegisterRequest(data);
    return post<RegisterResponse>(req.path, req.body);
  },

  requestPasswordReset: (email: string) => {
    const req = buildMobilePasswordResetRequest(email);
    return post<{ success: boolean; message?: string; token?: string; reset_code?: string; delivery?: string }>(
      req.path,
      req.body,
    );
  },

  confirmPasswordReset: (data: { token?: string; email?: string; code?: string; password: string }) =>
    post<{ success: boolean; message?: string }>(apiPaths.auth.passwordResetConfirm, data),

  me: () =>
    get<MeResponse>(apiPaths.auth.me),

  updateUser: (data: { password: string; current_password: string }) =>
    put<{ user: MeResponse['user'] }>('/auth/user', data),

  registerFcmToken: (fcm_token: string) =>
    post<void>('/push/register-token', { token: fcm_token }),

  unregisterFcmToken: () =>
    post<void>('/push/unregister-token', {}),

  socialLogin: (data: {
    type: 'apple' | 'google' | 'facebook';
    identity_token?: string;
    access_token?: string;
    authorization_code?: string;
    apple_user_name?: string;
    email?: string;
  }) => post<LoginResponse>('/auth/social-login', data),
};

// -------------------------------------------------------------------
// Consultants
// -------------------------------------------------------------------

export const consultantsApi = {
  list: async (params?: { expertise?: string; minPrice?: number; maxPrice?: number; minRating?: number; page?: number }): Promise<Consultant[]> => {
    const res = await get<{ data: Consultant[] }>('/consultants', params as Record<string, string | number>);
    return Array.isArray(res?.data) ? res.data : [];
  },

  get: async (id: string): Promise<Consultant> => {
    const res = await get<{ data: Consultant }>(`/consultants/${id}`);
    return res.data;
  },

  availability: async (
    consultantId: string,
    params: { date: string; duration?: number; service_id?: string },
  ): Promise<ConsultantAvailability> => {
    const res = await get<{ data: ConsultantAvailability }>(
      `/consultants/${consultantId}/availability`,
      {
        date: params.date,
        ...(params.duration ? { duration: params.duration } : {}),
        ...(params.service_id ? { service_id: params.service_id } : {}),
      },
    );
    return res.data;
  },

  services: async (consultantId: string): Promise<ConsultantService[]> => {
    const res = await get<{ data: ConsultantService[] }>(`/consultants/${consultantId}/services`);
    return Array.isArray(res?.data) ? res.data : [];
  },
};

// -------------------------------------------------------------------
// Bookings
// -------------------------------------------------------------------

export const bookingsApi = {
  create: (data: BookingCreateInput) => {
    const req = buildBookingCreateRequest(data);
    return post<BookingCreateResult>(req.path, req.body);
  },

  requestNow: (data: {
    consultant_id: string;
    service_id?: string;
    customer_message?: string;
  }) =>
    post<{ ok: boolean; id: string; status: string; message?: string; timeout_at?: string }>(
      apiPaths.bookings.requestNow,
      data,
    ),

  list: (params?: { status?: string }) =>
    get<{ items: Booking[] }>(apiPaths.bookings.mine, params as Record<string, string>),

  get: (id: string) =>
    get<Booking>(`/bookings/${id}`),

  cancel: (id: string) =>
    patch<Booking>(`/bookings/${id}/cancel`, {}),
};

// -------------------------------------------------------------------
// Orders (Stripe Checkout — kart + PayPal)
// -------------------------------------------------------------------

export const ordersApi = {
  createForBooking: (bookingId: string) => {
    const req = buildOrderForBookingRequest(bookingId);
    return post<OrderCreateResponse>(req.path, req.body);
  },

  initStripeCheckout: (orderId: string) =>
    post<CheckoutInitResponse>(apiPaths.orders.initStripeCheckout(orderId), {}),

  get: (id: string) =>
    get<Order>(`/orders/${id}`),
};

// -------------------------------------------------------------------
// Subscription / Credits
// -------------------------------------------------------------------

export const subscriptionsApi = {
  plans: async (): Promise<SubscriptionPlan[]> => {
    const res = await get<{ data: SubscriptionPlan[] }>('/subscriptions/plans');
    return Array.isArray(res?.data) ? res.data : [];
  },

  me: async (): Promise<Subscription | null> => {
    const res = await get<{ data: Subscription | null }>('/subscriptions/me');
    return res.data;
  },

  start: (planId: string, paymentGatewaySlug = 'stripe'): Promise<{
    data: {
      order_id?: string;
      plan_id?: string;
      checkout_url?: string;
      token?: string;
      paid?: boolean;
    };
  }> => post('/subscriptions/start', { plan_id: planId, payment_gateway_slug: paymentGatewaySlug }),

  verifyReceipt: (payload: {
    plan_id?: string;
    platform: 'apple' | 'google' | 'apple_iap' | 'google_iap';
    receipt: string;
    transaction_id?: string;
    purchase_token?: string;
    product_id?: string;
  }) => post<{
    data: {
      platform: string;
      valid: boolean;
      subscription?: Subscription | null;
      transaction_id?: string;
      message?: string;
    };
  }>('/subscriptions/verify-receipt', payload),

  cancel: (reason?: string) =>
    post<{ data: Subscription }>('/subscriptions/cancel', { ...(reason ? { reason } : {}) }),
};

export const creditsApi = {
  me: async (): Promise<CreditMe | null> => {
    const res = await get<{ data: CreditMe }>('/credits/me');
    return res?.data ?? null;
  },

  getBalance: async () => {
    const res = await get<{ data: { balance: number } }>('/credits/balance');
    return res.data;
  },

  packages: async (): Promise<CreditPackage[]> => {
    const res = await get<{ data: CreditPackage[] }>('/credits/packages');
    return Array.isArray(res?.data) ? res.data : [];
  },

  listPackages: async (): Promise<CreditPackage[]> => {
    const res = await get<{ data: CreditPackage[] }>('/credits/packages');
    return Array.isArray(res?.data) ? res.data : [];
  },

  purchase: (packageId: string, paymentGatewaySlug = 'stripe'): Promise<{
    data: {
      order_id?: string;
      package_id?: string;
      checkout_url?: string;
      token?: string;
      free?: boolean;
      credits_added?: number;
      balance?: number;
    };
  }> => post('/credits/purchase', { package_id: packageId, payment_gateway_slug: paymentGatewaySlug }),

  buy: async (data: { package_id: string; locale?: string }) => {
    const res = await post<{ data: { checkout_url: string; token: string } }>('/credits/buy', data);
    return res.data;
  },

  verifyReceipt: (payload: {
    package_id?: string;
    package_code?: string;
    platform: 'apple' | 'google' | 'apple_iap' | 'google_iap';
    receipt: string;
    transaction_id?: string;
    purchase_token?: string;
    product_id?: string;
  }) => post<{
    data: {
      platform: string;
      valid: boolean;
      order_id?: string;
      package_id?: string;
      credits_added?: number;
      balance?: number;
      idempotent?: boolean;
    };
  }>('/credits/verify-receipt', payload),
};

export const mediaMessagesApi = {
  safetyForConsultant: async (id: string) => (await get<{ data: { blocked_by_me: boolean; blocked_by_peer: boolean; terms_accepted: boolean } }>(`/me/consultants/${encodeURIComponent(id)}/media-safety`)).data,
  safety: async (id: string) => (await get<{ data: { blocked_by_me: boolean; blocked_by_peer: boolean; terms_accepted: boolean } }>(`/me/media-messages/${encodeURIComponent(id)}/safety`)).data,
  block: async (id: string) => (await post<{ data: { blocked_by_me: boolean; blocked_by_peer: boolean; terms_accepted: boolean } }>(`/me/media-messages/${encodeURIComponent(id)}/block`, {})).data,
  unblock: async (id: string) => (await del<{ data: { blocked_by_me: boolean; blocked_by_peer: boolean; terms_accepted: boolean } }>(`/me/media-messages/${encodeURIComponent(id)}/block`)).data,
  report: async (id: string, reason: 'harassment' | 'hate' | 'sexual' | 'spam' | 'other' = 'other') => post<{ ok: boolean }>(`/me/media-messages/${encodeURIComponent(id)}/reports`, { reason }),
  getConsultantSettings: async (consultantId: string): Promise<ConsultantMediaSettings | null> => {
    const res = await get<{ data: ConsultantMediaSettings }>(`/consultants/${consultantId}/media-settings`);
    return res?.data ?? null;
  },

  listMine: async (): Promise<MediaMessage[]> => {
    const res = await get<{ data: MediaMessage[] }>('/me/media-messages');
    return Array.isArray(res?.data) ? res.data : [];
  },

  create: async (data: MediaMessageCreateInput): Promise<MediaMessage> => {
    const res = await post<{ data: MediaMessage }>('/me/media-messages', data);
    return res.data;
  },

  listConsultant: async (): Promise<MediaMessage[]> => {
    const res = await get<{ data: MediaMessage[] }>('/me/consultant/media-messages');
    return Array.isArray(res?.data) ? res.data : [];
  },

  reply: async (id: string, data: {
    kind: MediaMessageKind;
    storage_path: string;
    duration_seconds?: number;
    note?: string | null;
  }): Promise<MediaMessage> => {
    const res = await post<{ data: MediaMessage }>(`/me/consultant/media-messages/${encodeURIComponent(id)}/reply`, data);
    return res.data;
  },

  fileUrl: (id: string): string =>
    `${API_URL}/me/media-messages/${encodeURIComponent(id)}/file`,
};

export const consultantSelfApi = {
  profile: async (): Promise<ConsultantSelfProfile> => {
    const res = await get<{ data: ConsultantSelfProfile }>('/me/consultant');
    return res.data;
  },

  profileCompletion: async (): Promise<{
    score: number;
    status: 'excellent' | 'improvable' | 'incomplete';
    items: Array<{ id: string; label: string; labelKey: string; tab: string; done: boolean; weight: number }>;
  }> => {
    const res = await get<{ data: { score: number; status: 'excellent' | 'improvable' | 'incomplete'; items: Array<{ id: string; label: string; labelKey: string; tab: string; done: boolean; weight: number }> } }>('/me/consultant/profile-completion');
    return res.data;
  },

  updateProfile: async (payload: Partial<ConsultantSelfProfile>): Promise<{ id: string }> => {
    const res = await patch<{ data: { id: string } }>('/me/consultant', payload);
    return res.data;
  },

  stats: async (): Promise<ConsultantSelfStats> => {
    const res = await get<{ data: ConsultantSelfStats }>('/me/consultant/stats');
    return res.data;
  },

  bookings: async (params?: { status?: string }): Promise<ConsultantSelfBooking[]> => {
    const res = await get<{ data: ConsultantSelfBooking[] }>('/me/consultant/bookings', params);
    return Array.isArray(res?.data) ? res.data : [];
  },

  approveBooking: async (id: string): Promise<{ id: string; status: string }> => {
    const res = await post<{ data: { id: string; status: string } }>(`/me/consultant/bookings/${encodeURIComponent(id)}/approve`, {});
    return res.data;
  },

  rejectBooking: async (id: string, reason?: string): Promise<{ id: string; status: string }> => {
    const res = await post<{ data: { id: string; status: string } }>(
      `/me/consultant/bookings/${encodeURIComponent(id)}/reject`,
      reason ? { reason } : {},
    );
    return res.data;
  },

  cancelBooking: async (id: string, reason: string): Promise<{ id: string; status: string }> => {
    const res = await post<{ data: { id: string; status: string } }>(
      `/me/consultant/bookings/${encodeURIComponent(id)}/cancel`,
      { reason },
    );
    return res.data;
  },

  availability: async (): Promise<ConsultantSelfAvailability> => {
    const res = await get<{ data: ConsultantSelfAvailability }>('/me/consultant/availability');
    return res.data;
  },

  updateAvailability: async (hours: ConsultantSelfAvailability['working_hours']): Promise<{ resource_id: string; count: number }> => {
    const res = await patch<{ data: { resource_id: string; count: number } }>(
      '/me/consultant/availability',
      { hours },
    );
    return res.data;
  },

  overrideAvailabilityDay: async (payload: { date: string; is_active: 0 | 1 }): Promise<{
    resource_id: string;
    date: string;
    is_active: 0 | 1;
    updated: number;
    planned: number;
  }> => {
    const res = await post<{ data: { resource_id: string; date: string; is_active: 0 | 1; updated: number; planned: number } }>(
      '/me/consultant/availability/day',
      payload,
    );
    return res.data;
  },

  timeBlocks: async (date?: string): Promise<ConsultantTimeBlock[]> => {
    const res = await get<{ data: ConsultantTimeBlock[] }>('/me/consultant/time-blocks', date ? { date } : undefined);
    return Array.isArray(res?.data) ? res.data : [];
  },

  createTimeBlock: async (payload: { block_date: string; start_time: string; end_time: string; reason?: string | null }): Promise<ConsultantTimeBlock> => {
    const res = await post<{ data: ConsultantTimeBlock }>('/me/consultant/time-blocks', payload);
    return res.data;
  },

  deleteTimeBlock: async (id: string): Promise<{ id: string; ok: boolean }> => {
    const res = await del<{ data: { id: string; ok: boolean } }>(`/me/consultant/time-blocks/${encodeURIComponent(id)}`);
    return res.data;
  },

  wallet: async (): Promise<ConsultantWalletResponse> => {
    const res = await get<{ data: ConsultantWalletResponse }>('/me/consultant/wallet');
    return res.data;
  },

  withdrawals: async (): Promise<ConsultantWithdrawalRequest[]> => {
    const res = await get<{ data: ConsultantWithdrawalRequest[] }>('/me/consultant/withdrawals');
    return Array.isArray(res?.data) ? res.data : [];
  },

  requestWithdrawal: async (payload: { amount: number; notes?: string }): Promise<{
    id: string;
    status: 'pending';
    amount: number;
    currency: string;
    message: string;
  }> => {
    const res = await post<{ data: { id: string; status: 'pending'; amount: number; currency: string; message: string } }>(
      '/me/consultant/wallet/withdraw',
      payload,
    );
    return res.data;
  },

  uploadKycDocument: async (payload: {
    type: ConsultantKycDocument['type'];
    uri: string;
    name?: string;
    mime?: string;
  }): Promise<ConsultantKycDocument> => {
    const form = new FormData();
    form.append('file', {
      uri: payload.uri,
      name: payload.name ?? `${payload.type}-${Date.now()}.jpg`,
      type: payload.mime ?? 'image/jpeg',
    } as unknown as Blob);
    const data = await uploadForm(
      `/me/consultant/kyc/documents?type=${encodeURIComponent(payload.type)}`, form,
    ) as { data: ConsultantKycDocument };
    return data.data;
  },

  submitKyc: async (): Promise<{ id: string; kyc_status: 'pending' }> => {
    const res = await post<{ data: { id: string; kyc_status: 'pending' } }>('/me/consultant/kyc/submit', {});
    return res.data;
  },

  threads: async (): Promise<ConsultantSelfThread[]> => {
    const res = await get<{ data: ConsultantSelfThread[] }>('/me/consultant/threads');
    return Array.isArray(res?.data) ? res.data : [];
  },

  threadMessages: async (id: string): Promise<{ thread_id: string; messages: ConsultantSelfThreadMessage[] }> => {
    const res = await get<{ data: { thread_id: string; messages: ConsultantSelfThreadMessage[] } }>(
      `/me/consultant/threads/${encodeURIComponent(id)}/messages`,
    );
    return res.data;
  },

  replyThread: async (id: string, text: string): Promise<ConsultantSelfThreadMessage> => {
    const res = await post<{ data: ConsultantSelfThreadMessage }>(
      `/me/consultant/threads/${encodeURIComponent(id)}/reply`,
      { text },
    );
    return res.data;
  },

  markThreadRead: async (id: string): Promise<{ ok: boolean }> => {
    const res = await post<{ data: { ok: boolean } }>(`/me/consultant/threads/${encodeURIComponent(id)}/read`, {});
    return res.data;
  },

  services: async (): Promise<ConsultantSelfService[]> => {
    const res = await get<{ data: ConsultantSelfService[] }>('/me/consultant/services');
    return Array.isArray(res?.data) ? res.data : [];
  },

  createService: async (payload: ConsultantSelfServicePayload): Promise<{ id: string }> => {
    const res = await post<{ data: { id: string } }>('/me/consultant/services', payload);
    return res.data;
  },

  updateService: async (id: string, payload: Partial<ConsultantSelfServicePayload>): Promise<{ id: string }> => {
    const res = await patch<{ data: { id: string } }>(`/me/consultant/services/${encodeURIComponent(id)}`, payload);
    return res.data;
  },

  deleteService: async (id: string): Promise<{ id: string; ok: boolean }> => {
    const res = await del<{ data: { id: string; ok: boolean } }>(`/me/consultant/services/${encodeURIComponent(id)}`);
    return res.data;
  },

  reviews: async (status?: 'approved' | 'pending' | 'replied' | 'unreplied'): Promise<ConsultantSelfReview[]> => {
    const res = await get<{ data: ConsultantSelfReview[] }>('/me/consultant/reviews', status ? { status } : undefined);
    return Array.isArray(res?.data) ? res.data : [];
  },

  replyReview: async (id: string, reply: string): Promise<{ id: string; consultant_reply: string }> => {
    const res = await post<{ data: { id: string; consultant_reply: string } }>(
      `/me/consultant/reviews/${encodeURIComponent(id)}/reply`,
      { reply },
    );
    return res.data;
  },

  heartbeat: async (): Promise<{
    consultant_id: string;
    last_heartbeat_at: string | null;
    became_online_at: string | null;
    is_online: boolean;
  }> => {
    const res = await post<{ data: { consultant_id: string; last_heartbeat_at: string | null; became_online_at: string | null; is_online: boolean } }>(
      '/me/consultant/heartbeat',
      {},
    );
    return res.data;
  },
};

export const favoritesApi = {
  list: async (): Promise<Consultant[]> => {
    const res = await get<{ data: Consultant[] }>('/me/favorites');
    return Array.isArray(res?.data) ? res.data : [];
  },

  ids: async (): Promise<string[]> => {
    const res = await get<{ data: string[] }>('/me/favorites/ids');
    return Array.isArray(res?.data) ? res.data : [];
  },

  add: (consultantId: string) =>
    post<{ data: { consultant_id: string; is_favorited: true } }>(`/me/favorites/${consultantId}`, {}),

  remove: (consultantId: string) =>
    del<{ data: { consultant_id: string; is_favorited: false } }>(`/me/favorites/${consultantId}`),
};

// -------------------------------------------------------------------
// LiveKit (Sesli/Görüntülü Görüşme)
// -------------------------------------------------------------------

export const livekitApi = {
  getToken: async (bookingId: string): Promise<LiveKitTokenResponse> => {
    const res = await post<{ data: LiveKitTokenResponse }>('/livekit/token', { booking_id: bookingId });
    return res.data;
  },

  endSession: (bookingId: string) =>
    post<void>('/livekit/session/end', { booking_id: bookingId }),
};

// -------------------------------------------------------------------
// Astrology / Birth Charts
// -------------------------------------------------------------------

export const birthChartsApi = {
  list: async (): Promise<BirthChart[]> => {
    const res = await get<{ data: BirthChart[] }>('/birth-charts');
    return Array.isArray(res?.data) ? res.data : [];
  },

  listMyBirthCharts: async (): Promise<BirthChart[]> => {
    const res = await get<{ data: BirthChart[] }>('/birth-charts');
    return Array.isArray(res?.data) ? res.data : [];
  },

  create: async (data: BirthChartCreateInput): Promise<BirthChart> => {
    const res = await post<{ data: BirthChart }>('/birth-charts', data);
    return res.data;
  },

  /** Auth gerekmez — Güneş, Ay, Yükselen önizlemesi + KB özeti */
  previewBigThree: async (data: BirthChartCreateInput): Promise<BigThreePreviewResponse> => {
    const res = await post<{ data: BigThreePreviewResponse }>('/birth-charts/preview-big-three', data);
    return res.data;
  },

  get: async (id: string): Promise<BirthChart> => {
    const res = await get<{ data: BirthChart }>(`/birth-charts/${id}`);
    return res.data;
  },

  transit: async (id: string) => {
    const res = await post<{ data: unknown }>(`/birth-charts/${id}/transit`, {});
    return res.data;
  },
};

export const profilesApi = {
  getMyProfile: async (): Promise<MobileProfile | null> => {
    const res = await get<MobileProfile | ApiEnvelope<MobileProfile> | null>('/profiles/me');
    return res && 'data' in res ? (res as ApiEnvelope<MobileProfile>).data : res as MobileProfile | null;
  },

  upsertMyProfile: async (payload: { profile: Record<string, unknown> }): Promise<MobileProfile> => {
    const res = await patch<MobileProfile | ApiEnvelope<MobileProfile>>('/profiles/me', payload);
    return 'data' in res ? (res as ApiEnvelope<MobileProfile>).data : res as MobileProfile;
  },
};

export const geocodeApi = {
  search: async (q: string): Promise<GeocodeResult> => {
    const res = await get<{ data: GeocodeResult }>('/geocode', { q });
    return res.data;
  },
};

export const readingsApi = {
  daily: async (chartId: string): Promise<DailyReadingResponse> => {
    const res = await post<{ data: DailyReadingResponse }>('/readings/daily', { chart_id: chartId });
    return res.data;
  },
};

// -------------------------------------------------------------------
// Reviews
// -------------------------------------------------------------------

export const reviewsApi = {
  forConsultant: async (consultantId: string): Promise<Review[]> => {
    const res = await get<unknown>('/reviews', { target_type: 'consultant', target_id: consultantId, approved: 'true', active: 'true' });
    return normalizeListResponse<Review>(res);
  },

  create: (data: { booking_id: string; target_id: string; rating: number; comment?: string }) =>
    post<void>('/reviews', data),
};

// -------------------------------------------------------------------
// Chat
// -------------------------------------------------------------------

export type ChatContextType =
  | 'consultant_lead'
  | 'booking'
  | 'support'
  | 'job'
  | 'request';

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_user_id: string;
  text: string;
  created_at: string;
}

export const chatApi = {
  listThreads: () =>
    get<{ items: unknown[] }>('/chat/threads'),

  getOrCreateThread: async (params: {
    context_type: ChatContextType;
    context_id: string;
  }): Promise<{ id: string }> => {
    const res = await post<{ thread: { id: string } }>('/chat/threads', params);
    return res.thread;
  },

  /** T29-3 — danışman ön mesaj thread'i */
  createThreadForConsultant: (consultantId: string) =>
    chatApi.getOrCreateThread({
      context_type: 'consultant_lead',
      context_id: consultantId,
    }),

  /** T29-5 — randevu bağlı mesajlaşma */
  createThreadForBooking: (bookingId: string) =>
    chatApi.getOrCreateThread({ context_type: 'booking', context_id: bookingId }),

  listMessages: (threadId: string) =>
    get<{ items: ChatMessage[] }>(`/chat/threads/${threadId}/messages`, { limit: 100 }),

  postMessage: async (threadId: string, text: string): Promise<ChatMessage> => {
    const res = await post<{ message: ChatMessage }>(
      `/chat/threads/${threadId}/messages`,
      { text },
    );
    return res.message;
  },
  blockState: (threadId: string) => get<{ peer_user_id: string; blocked_by_me: boolean; blocked_by_peer: boolean; terms_accepted: boolean }>(`/chat/threads/${encodeURIComponent(threadId)}/block`),
  blockPeer: (threadId: string) => post<{ peer_user_id: string; blocked_by_me: boolean; blocked_by_peer: boolean; terms_accepted: boolean }>(`/chat/threads/${encodeURIComponent(threadId)}/block`, {}),
  unblockPeer: (threadId: string) => del<{ peer_user_id: string; blocked_by_me: boolean; blocked_by_peer: boolean; terms_accepted: boolean }>(`/chat/threads/${encodeURIComponent(threadId)}/block`),
  acceptTerms: () => post<{ ok: boolean }>('/chat/terms/accept', { accepted: true }),
  reportMessage: (threadId: string, messageId: string, reason: 'harassment' | 'hate' | 'sexual' | 'spam' | 'other') =>
    post<{ ok: boolean }>(`/chat/threads/${encodeURIComponent(threadId)}/reports`, { message_id: messageId, reason }),
};

/** User inbox shares the web dashboard's customer thread contract. */
export interface CustomerThreadMessage {
  id: string;
  thread_id: string;
  sender_user_id: string;
  text: string;
  created_at: string;
  from_self: boolean;
}

export interface CustomerThread {
  thread_id: string;
  context_type: string;
  context_id: string;
  created_at: string;
  updated_at: string;
  consultant: { id: string; display_name: string | null; full_name: string | null; avatar_url: string | null } | null;
  unread_count: number;
  last_message: CustomerThreadMessage | null;
}

export const customerThreadsApi = {
  list: async (): Promise<CustomerThread[]> =>
    (await get<ApiEnvelope<CustomerThread[]>>('/me/customer/threads')).data,
  messages: async (id: string): Promise<CustomerThreadMessage[]> =>
    (await get<ApiEnvelope<{ messages: CustomerThreadMessage[] }>>(`/me/customer/threads/${encodeURIComponent(id)}/messages`)).data.messages,
  reply: async (id: string, text: string): Promise<CustomerThreadMessage> =>
    (await post<ApiEnvelope<CustomerThreadMessage>>(`/me/customer/threads/${encodeURIComponent(id)}/reply`, { text })).data,
  markRead: async (id: string): Promise<void> => {
    await post(`/me/customer/threads/${encodeURIComponent(id)}/mark-read`, {});
  },
};

// -------------------------------------------------------------------
// Notifications
// -------------------------------------------------------------------

export const notificationsApi = {
  list: () =>
    get<{ data: AppNotification[]; page: number; limit: number; total: number }>('/notifications'),

  markAsRead: (id: string) =>
    patch<AppNotification>(`/notifications/${encodeURIComponent(id)}`, { is_read: true }),

  markAllAsRead: () =>
    post<{ ok: boolean }>('/notifications/mark-all-read', {}),
};

// -------------------------------------------------------------------
// KVKK (Data export + account deletion)
// -------------------------------------------------------------------

export const kvkkApi = {
  exportMyData: async (): Promise<Record<string, unknown>> => {
    const res = await get<Record<string, unknown>>('/me/export');
    return res;
  },

  getDeletionStatus: async (): Promise<KvkkAccountDeletionStatus | null> => {
    const res = await get<{ data: KvkkAccountDeletionStatus | null }>('/me/delete-account');
    return res.data;
  },

  requestDeletion: async (
    reason?: string,
    apple?: { identityToken: string; authorizationCode: string; nonce: string },
  ): Promise<{ data: KvkkAccountDeletionStatus & { message?: string; cooling_off_days?: number; apple_revocation?: 'revoked' | 'not_requested' | 'unavailable' | 'failed' } }> =>
    post('/me/delete-account', {
      ...(reason?.trim() ? { reason: reason.trim() } : {}),
      ...(apple ? {
        apple_identity_token: apple.identityToken,
        apple_authorization_code: apple.authorizationCode,
        apple_nonce: apple.nonce,
      } : {}),
    }),

  cancelDeletion: async (): Promise<{ data: { id: string; status: 'cancelled' } }> =>
    del<{ data: { id: string; status: 'cancelled' } }>('/me/delete-account'),
};

// -------------------------------------------------------------------
// Horoscopes
// -------------------------------------------------------------------

export const horoscopesApi = {
  /** Bugün için kayıt yoksa backend 404 döner; uygulama bunu null sayar. */
  getToday: async (params: {
    sign: string;
    /** YYYY-MM-DD; verilmezse cihazın yerel günü kullanılır (TR’de doğru “bugün”). */
    date?: string;
    locale?: string;
  }): Promise<HoroscopeToday | null> => {
    const date = params.date ?? formatLocalYmd(new Date());
    try {
      const json = await getAllow404<ApiEnvelope<HoroscopeToday>>('/horoscopes/today', {
        sign: params.sign, date, ...(params.locale ? { locale: params.locale } : {}),
      });
      const row = json?.data;
      if (!row) return null;
      const periodStart = row.period_start_date ?? row.periodStartDate ?? row.date;
      return { ...row, date: periodStart };
    } catch {
      if (__DEV__) logger.warn('[GoldMood] GET /horoscopes/today network error');
      return null;
    }
  },
  getSignInfo: async (sign: string): Promise<HoroscopeSignInfo> => {
    const res = await get<ApiEnvelope<HoroscopeSignInfo>>(`/horoscopes/${sign}`);
    return res.data;
  },
  getCompatibility: async (params: { signA: string; signB: string }): Promise<HoroscopeCompatibility> => {
    const res = await get<ApiEnvelope<HoroscopeCompatibility>>('/horoscopes/compatibility', params);
    return res.data;
  },
};

export const tarotApi = {
  draw: async (data: { spread_type: string; question?: string; locale?: string }): Promise<ReadingResult> => {
    const res = await post<ApiEnvelope<ReadingResult>>('/tarot/draw', data);
    return res.data;
  },
  getReading: async (id: string): Promise<ReadingResult> => {
    const res = await get<ApiEnvelope<ReadingResult>>(`/tarot/reading/${id}`);
    return res.data;
  },
};

export const coffeeApi = {
  read: async (data: { image_ids: string[]; locale?: string }): Promise<ReadingResult> => {
    const res = await post<ApiEnvelope<ReadingResult>>('/coffee/read', data);
    return res.data;
  },
  getReading: async (id: string): Promise<ReadingResult> => {
    const res = await get<ApiEnvelope<ReadingResult>>(`/coffee/reading/${id}`);
    return res.data;
  },
};

export const storageApi = {
  upload: async (
    formData: FormData,
    options: { bucket?: string; path?: string; upsert?: boolean } = {}
  ): Promise<{ id: string; url?: string | null; path?: string }> => {
    const bucket = options.bucket ?? 'coffee';
    const params = new URLSearchParams();
    if (options.path) params.set('path', options.path);
    if (options.upsert) params.set('upsert', '1');

    const data = await uploadForm(`/storage/${encodeURIComponent(bucket)}/upload?${params.toString()}`, formData) as {
      items?: { id?: string; path?: string; url?: string | null }[];
      id?: string; path?: string; url?: string | null;
    };
    // Wrap to match common response shape
    const item = data.items?.[0] ?? data;
    const id = item.id ?? item.path;
    if (!id) throw new Error('Upload response missing identifier');
    return {
      id,
      url: item.url,
      path: item.path,
    };
  },
};

export const dreamsApi = {
  interpret: async (data: { dream_text: string; locale?: string }): Promise<ReadingResult> => {
    const res = await post<ApiEnvelope<ReadingResult>>('/dreams/interpret', data);
    return res.data;
  },
  getReading: async (id: string): Promise<ReadingResult> => {
    const res = await get<ApiEnvelope<ReadingResult>>(`/dreams/reading/${id}`);
    return res.data;
  },
};

export const numerologyApi = {
  calculate: async (data: { full_name: string; birth_date: string; locale?: string }): Promise<ReadingResult> => {
    const res = await post<ApiEnvelope<ReadingResult>>('/numerology/calculate', data);
    return res.data;
  },
  getReading: async (id: string): Promise<ReadingResult> => {
    const res = await get<ApiEnvelope<ReadingResult>>(`/numerology/reading/${id}`);
    return res.data;
  },
};

export type ReadingHistoryType =
  | 'tarot'
  | 'coffee'
  | 'dream'
  | 'numerology'
  | 'yildizname'
  | 'synastry';

export interface ReadingHistoryItem {
  type: ReadingHistoryType;
  id: string;
  created_at: string;
  title: string;
  snippet: string | null;
}

export const historyApi = {
  getUserHistory: async (limit = 50): Promise<ReadingHistoryItem[]> => {
    const res = await get<{ data: ReadingHistoryItem[] }>('/me/history', { limit });
    return Array.isArray(res?.data) ? res.data : [];
  },

  deleteReading: async (type: ReadingHistoryType, id: string) =>
    del<{ ok: boolean }>(`/me/readings/${type}/${encodeURIComponent(id)}`),

  deleteAll: async () =>
    del<{ ok: boolean; total?: number; deleted?: Record<string, number> }>('/me/readings/all'),
};

export const yildiznameApi = {
  read: async (data: { name: string; mother_name: string; birth_date?: string }) => {
    const birthYear = data.birth_date ? Number(String(data.birth_date).slice(0, 4)) : new Date().getFullYear();
    const res = await post<{
      data: {
        id: string;
        ebced_total: number;
        menzil_no: number;
        interpretation: string;
        menzil?: { name_tr?: string };
      };
    }>('/yildizname/read', {
      name: data.name,
      mother_name: data.mother_name,
      birth_year: Number.isFinite(birthYear) ? birthYear : new Date().getFullYear(),
      locale: 'tr',
    });
    return {
      ...res.data,
      ebcedValue: res.data.ebced_total,
      signNumber: res.data.menzil_no,
      readingText: res.data.interpretation,
    };
  },

  getReading: async (id: string): Promise<ReadingResult> => {
    const res = await get<ApiEnvelope<ReadingResult>>(`/yildizname/reading/${id}`);
    const d = res.data;
    return {
      ...d,
      readingText: d?.interpretation ?? d?.result_text ?? '',
    };
  },
};

export const synastryApi = {
  quick: async (data: { sign_a: string; sign_b: string }): Promise<SynastryResult> => {
    const res = await post<ApiEnvelope<ReadingResult>>('/synastry/quick', data);
    const d = res.data?.data || res.data;
    return {
      title: `${data.sign_a} & ${data.sign_b}`,
      love_score: d?.result?.love_score ?? 78,
      sexual_score: d?.result?.sexual_score ?? 74,
      content: d?.raw ?? d?.content ?? '',
    };
  },

  manual: async (data: { partner_data: Record<string, unknown> }): Promise<SynastryResult> => {
    const res = await post<ApiEnvelope<ReadingResult>>('/synastry/manual', data);
    const d = res.data?.data || res.data;
    return d as SynastryResult;
  },

  list: async (): Promise<SynastryResult[]> => {
    const res = await get<ApiEnvelope<SynastryResult[]>>('/synastry/me');
    return res.data;
  },

  getReading: async (id: string): Promise<SynastryResult> => {
    const res = await get<ApiEnvelope<ReadingResult>>(`/synastry/reading/${id}`);
    return res.data?.data ?? res.data;
  },

  listInvites: async (): Promise<SynastryInvite[]> => {
    const res = await get<ApiEnvelope<SynastryInvite[]>>('/synastry/invites/me');
    return res.data;
  },

  createInvite: async (partnerUserId: string): Promise<SynastryInvite> => {
    const res = await post<ApiEnvelope<SynastryInvite>>('/synastry/invite', { partner_user_id: partnerUserId });
    return res.data;
  },

  acceptInvite: async (id: string): Promise<SynastryResult> => {
    const res = await post<ApiEnvelope<SynastryResult>>(`/synastry/invite/${id}/accept`, {});
    return res.data;
  },

  declineInvite: async (id: string): Promise<SynastryInvite> => {
    const res = await post<ApiEnvelope<SynastryInvite>>(`/synastry/invite/${id}/decline`, {});
    return res.data;
  },
};

export const userApi = {
  search: async (q: string): Promise<UserSearchResult[]> => {
    const res = await get<ApiEnvelope<UserSearchResult[]>>(`/auth/search?q=${encodeURIComponent(q)}`);
    return res.data;
  }
};

// -------------------------------------------------------------------
// Site settings (public)
// -------------------------------------------------------------------

function parseSettingBool(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    return v === '1' || v === 'true' || v === 'yes';
  }
  return false;
}

function parseSettingStringArray(value: unknown, fallback: string[]): string[] {
  const normalize = (candidate: unknown): string[] | null => {
    if (Array.isArray(candidate)) {
      const items = candidate.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
      return items.length ? items : null;
    }
    if (typeof candidate === 'string' && candidate.trim()) {
      try {
        return normalize(JSON.parse(candidate));
      } catch {
        return [candidate.trim()];
      }
    }
    return null;
  };
  return normalize(value) ?? fallback;
}

export const siteSettingsApi = {
  getSettingValue: async (key: string): Promise<unknown | null> => {
    const row = await getAllow404<{ value: unknown }>(`/site_settings/${key}`);
    return row?.value ?? null;
  },

  isFeatureEnabled: async (key: string): Promise<boolean> => {
    const value = await siteSettingsApi.getSettingValue(key);
    return parseSettingBool(value);
  },

  getDesignTokens: async (): Promise<unknown | null> => {
    const row = await getAllow404<{ value: unknown }>('/site_settings/design_tokens');
    if (!row) return null;
    return row.value;
  },

  getMobileVersionPolicy: async (): Promise<{
    minVersion: string | null;
    latestVersion: string | null;
    updateUrl: string | null;
  }> => {
    const [minVersion, latestVersion, updateUrl] = await Promise.all([
      siteSettingsApi.getSettingValue('mobile_min_version'),
      siteSettingsApi.getSettingValue('mobile_latest_version'),
      siteSettingsApi.getSettingValue('mobile_update_url'),
    ]);
    const asString = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);
    return {
      minVersion: asString(minVersion),
      latestVersion: asString(latestVersion),
      updateUrl: asString(updateUrl),
    };
  },

  getMobilePaymentReturnPatterns: async (): Promise<{
    success: string[];
    failure: string[];
  }> => {
    const [success, failure] = await Promise.all([
      siteSettingsApi.getSettingValue('mobile_payment_success_patterns'),
      siteSettingsApi.getSettingValue('mobile_payment_failure_patterns'),
    ]);
    return {
      success: parseSettingStringArray(success, PAYMENT_SUCCESS_PATTERNS),
      failure: parseSettingStringArray(failure, PAYMENT_FAILURE_PATTERNS),
    };
  },
};

// -------------------------------------------------------------------
// Banners
// -------------------------------------------------------------------

export const bannersApi = {
  list: async (params: { placement: string; locale?: string }): Promise<Banner[]> => {
    try {
      const res = await get<ApiEnvelope<Banner[]>>('/banners', params);
      return Array.isArray(res?.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  trackClick: (id: string) => {
    post<void>(`/banners/${id}/click`, {}).catch(() => {});
  },
};

// -------------------------------------------------------------------
// Navigation (admin-managed header menu — same payload as web)
// -------------------------------------------------------------------

export const navigationApi = {
  listHeaderMenu: async (locale: string): Promise<PublicMenuItemDto[]> => {
    const raw = await get<unknown>('/menu_items', {
      location: 'header',
      nested: 'true',
      is_active: 'true',
      locale,
    });
    return normalizeListResponse<PublicMenuItemDto>(raw);
  },

  listFooterMenu: async (locale: string): Promise<PublicMenuItemDto[]> => {
    const raw = await get<unknown>('/menu_items', {
      location: 'footer',
      is_active: 'true',
      locale,
    });
    return normalizeListResponse<PublicMenuItemDto>(raw).sort(
      (a, b) => (a.position ?? a.order_num ?? 0) - (b.position ?? b.order_num ?? 0),
    );
  },

  listFooterSections: async (locale: string): Promise<FooterSectionPublic[]> => {
    const raw = await get<unknown>('/footer_sections', {
      is_active: 'true',
      locale,
    });
    const rows = normalizeListResponse<FooterSectionPublic & { display_order?: number }>(raw);
    return rows
      .map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        display_order: typeof r.display_order === 'number' ? r.display_order : 0,
      }))
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  },
};

// -------------------------------------------------------------------
// Campaigns
// -------------------------------------------------------------------

export const campaignsApi = {
  active: async (params?: { applies_to?: string }): Promise<Campaign[]> => {
    const res = await get<{ data: Campaign[] }>('/campaigns/active', params);
    return Array.isArray(res?.data) ? res.data : [];
  },

  mine: async (): Promise<{ active: Campaign[]; redeemed: RedeemedCampaign[] }> => {
    const res = await get<ApiEnvelope<{ active: Campaign[]; redeemed: RedeemedCampaign[] }>>('/campaigns/me');
    return {
      active: Array.isArray(res?.data?.active) ? res.data.active : [],
      redeemed: Array.isArray(res?.data?.redeemed) ? res.data.redeemed : [],
    };
  },

  redeem: (params: { code: string; applies_to?: string }) =>
    post<RedeemCampaignResponse>('/campaigns/redeem', params),
};

// -------------------------------------------------------------------
// Custom pages (CMS — blog, legal, about)
// -------------------------------------------------------------------

export const customPagesApi = {
  list: async (params: {
    module_key?: string;
    locale?: string;
    limit?: number;
    sort?: string;
    orderDir?: string;
    is_published?: string;
  }): Promise<CustomPageRow[]> => {
    const raw = await get<unknown>('/custom-pages', {
      limit: params.limit ?? 50,
      sort: params.sort ?? 'created_at',
      orderDir: params.orderDir ?? 'desc',
      is_published: params.is_published ?? '1',
      ...(params.module_key ? { module_key: params.module_key } : {}),
      ...(params.locale ? { locale: params.locale } : {}),
    });
    return normalizeListResponse<CustomPageRow>(raw);
  },

  getBySlug: async (slug: string, locale?: string): Promise<CustomPageRow | null> => {
    try {
      return await get<CustomPageRow>(
        `/custom-pages/by-slug/${encodeURIComponent(slug)}`,
        locale ? { locale } : undefined,
      );
    } catch {
      return null;
    }
  },
};

// -------------------------------------------------------------------
// Consultant application (become consultant)
// -------------------------------------------------------------------

export interface ConsultantApplicationInput {
  email: string;
  full_name: string;
  phone?: string;
  bio: string;
  expertise: string[];
  languages: string[];
  experience_years?: number;
  certifications?: string;
}

export const consultantApplicationsApi = {
  apply: (body: ConsultantApplicationInput) =>
    post<{ data: { id: string } }>('/consultants/apply', body).then((r) => r.data),
};

// -------------------------------------------------------------------
// Review outcomes (astrolog karnesi — T42-1)
// -------------------------------------------------------------------

export type ReviewOutcomeResponse =
  | 'happened'
  | 'partially'
  | 'did_not_happen'
  | 'no_answer';

export interface PendingOutcomeDto {
  id: string;
  review_id: string;
  consultant_id: string;
  follow_up_at: string;
  review_rating: number | null;
  review_created_at: string | null;
  consultant_slug: string | null;
  consultant_avatar: string | null;
  consultant_name: string | null;
}

export const reviewOutcomesApi = {
  listPending: async (): Promise<PendingOutcomeDto[]> => {
    const raw = await get<unknown>('/reviews/me/pending-outcomes');
    return normalizeListResponse<PendingOutcomeDto>(raw);
  },

  submit: (reviewId: string, user_response: ReviewOutcomeResponse, notes?: string) =>
    patch<{ data: { id: string; user_response: ReviewOutcomeResponse } }>(
      `/reviews/${encodeURIComponent(reviewId)}/outcome`,
      { user_response, notes },
    ),
};

// -------------------------------------------------------------------
// Contact form (T42-2)
// -------------------------------------------------------------------

export interface ContactCreateInput {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export const contactApi = {
  submit: (body: ContactCreateInput) => post<{ data?: { id: string } }>('/contacts', body),
};
