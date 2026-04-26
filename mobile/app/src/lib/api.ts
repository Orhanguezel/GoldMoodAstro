/**
 * GoldMoodAstro API istemcisi.
 * Tüm istekler /api/v1 altına gider. Auth gerektiren istekler
 * Authorization: Bearer <token> header'ı ile gönderilir.
 */

import Constants from 'expo-constants';
import type {
  Consultant, ConsultantSlot,
  Booking, BookingCreateInput,
  Order, OrderCreateResponse, IyzipayInitResponse,
  AgoraTokenResponse,
  MeResponse,
  LoginInput, LoginResponse,
  RegisterInput, RegisterResponse,
} from '@/types';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  'http://localhost:8094/api/v1';

// -------------------------------------------------------------------
// HTTP core
// -------------------------------------------------------------------

let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  params?: Record<string, string | number>,
): Promise<T> {
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_authToken) headers['Authorization'] = `Bearer ${_authToken}`;

  try {
    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(`[API ERROR] ${method} ${path} | Status: ${res.status}`, err);
      throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
    }

    return res.json() as Promise<T>;
  } catch (e: any) {
    console.error(`[NETWORK ERROR] ${method} ${path} | ${e.message}`);
    throw e;
  }
}

const get  = <T>(path: string, params?: Record<string, string | number>) => request<T>('GET', path, undefined, params);
const post = <T>(path: string, body: unknown) => request<T>('POST', path, body);
const patch = <T>(path: string, body: unknown) => request<T>('PATCH', path, body);

// -------------------------------------------------------------------
// Auth
// -------------------------------------------------------------------

export const authApi = {
  login: (data: LoginInput) =>
    post<LoginResponse>('/auth/login', data),

  register: (data: RegisterInput) =>
    post<RegisterResponse>('/auth/register', data),

  me: () =>
    get<MeResponse>('/auth/me'),

  registerFcmToken: (fcm_token: string) =>
    post<void>('/push/register-token', { fcm_token }),
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

  slots: async (consultantId: string, date: string): Promise<ConsultantSlot[]> => {
    const res = await get<{ data: ConsultantSlot[] }>(`/consultants/${consultantId}/slots`, { date });
    return Array.isArray(res?.data) ? res.data : [];
  },
};

// -------------------------------------------------------------------
// Bookings
// -------------------------------------------------------------------

export const bookingsApi = {
  create: (data: BookingCreateInput) =>
    post<Booking>('/bookings', data),

  list: (params?: { status?: string }) =>
    get<{ items: Booking[] }>('/bookings/me', params as Record<string, string>),

  get: (id: string) =>
    get<Booking>(`/bookings/${id}`),

  cancel: (id: string) =>
    patch<Booking>(`/bookings/${id}/cancel`, {}),
};

// -------------------------------------------------------------------
// Orders (Iyzipay ödemesi)
// -------------------------------------------------------------------

export const ordersApi = {
  createForBooking: (bookingId: string) =>
    post<OrderCreateResponse>('/orders', { booking_id: bookingId, payment_gateway_slug: 'iyzipay' }),

  initIyzipay: (orderId: string) =>
    post<IyzipayInitResponse>(`/orders/${orderId}/init-iyzico`, {}),

  get: (id: string) =>
    get<Order>(`/orders/${id}`),
};

// -------------------------------------------------------------------
// Agora (Sesli Görüşme)
// -------------------------------------------------------------------

export const agoraApi = {
  getToken: (bookingId: string) =>
    post<AgoraTokenResponse>('/agora/token', { booking_id: bookingId }),

  endSession: (bookingId: string) =>
    post<void>('/agora/session/end', { booking_id: bookingId }),
};

// -------------------------------------------------------------------
// Reviews
// -------------------------------------------------------------------

export const reviewsApi = {
  forConsultant: (consultantId: string) =>
    get<{ items: { id: string; rating: number; comment: string; created_at: string }[] }>('/reviews', { target_type: 'consultant', target_id: consultantId }),

  create: (data: { booking_id: string; target_id: string; rating: number; comment?: string }) =>
    post<void>('/reviews', data),
};

// -------------------------------------------------------------------
// Chat
// -------------------------------------------------------------------

export const chatApi = {
  listThreads: () =>
    get<{ items: any[] }>('/chat/threads'),

  createThread: (targetId: string) =>
    post<{ id: string }>('/chat/threads', { target_id: targetId }),

  listMessages: (threadId: string) =>
    get<{ items: any[] }>(`/chat/threads/${threadId}/messages`),

  postMessage: (threadId: string, message: string) =>
    post<{ id: string }>(`/chat/threads/${threadId}/messages`, { message }),
};
