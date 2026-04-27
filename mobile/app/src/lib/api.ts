/**
 * GoldMoodAstro API istemcisi.
 * Tüm istekler /api/v1 altına gider. Auth gerektiren istekler
 * Authorization: Bearer <token> header'ı ile gönderilir.
 */

import Constants from 'expo-constants';
import type {
  Consultant, ConsultantSlot,
  Booking, BookingCreateInput,
  Subscription, SubscriptionPlan, CreditMe, CreditPackage,
  Order, OrderCreateResponse, IyzipayInitResponse,
  LiveKitTokenResponse,
  BirthChart, BirthChartCreateInput, GeocodeResult, DailyReadingResponse,
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

  start: (planId: string, paymentGatewaySlug = 'iyzipay'): Promise<{
    data: {
      order_id?: string;
      plan_id?: string;
      checkout_url?: string;
      token?: string;
      paid?: boolean;
    };
  }> => post('/subscriptions/start', { plan_id: planId, payment_gateway_slug: paymentGatewaySlug }),

  cancel: (reason?: string) =>
    post<{ data: Subscription }>('/subscriptions/cancel', { ...(reason ? { reason } : {}) }),
};

export const creditsApi = {
  me: async (): Promise<CreditMe | null> => {
    const res = await get<{ data: CreditMe }>('/credits/me');
    return res?.data ?? null;
  },

  packages: async (): Promise<CreditPackage[]> => {
    const res = await get<{ data: CreditPackage[] }>('/credits/packages');
    return Array.isArray(res?.data) ? res.data : [];
  },

  purchase: (packageId: string, paymentGatewaySlug = 'iyzipay'): Promise<{
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

  create: async (data: BirthChartCreateInput): Promise<BirthChart> => {
    const res = await post<{ data: BirthChart }>('/birth-charts', data);
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
// -------------------------------------------------------------------
// Horoscopes
// -------------------------------------------------------------------

export const horoscopesApi = {
  getToday: async (params: { sign: string; date?: string }): Promise<any> => {
    const res = await get<{ data: any }>('/horoscopes/today', params);
    return res.data;
  },
};

// -------------------------------------------------------------------
// Banners
// -------------------------------------------------------------------

export const bannersApi = {
  list: async (params: { placement: string; locale?: string }): Promise<any[]> => {
    const res = await get<{ data: any[] }>('/banners', params);
    return Array.isArray(res?.data) ? res.data : [];
  },

  trackClick: (id: string) =>
    post<void>(`/banners/${id}/click`, {}),
};
