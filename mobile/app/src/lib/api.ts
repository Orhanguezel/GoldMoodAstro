/**
 * GoldMoodAstro API istemcisi.
 * Tüm istekler /api/v1 altına gider. Auth gerektiren istekler
 * Authorization: Bearer <token> header'ı ile gönderilir.
 */

import Constants from 'expo-constants';
import type {
  Consultant, ConsultantSlot,
  Booking, BookingCreateInput,
  Review,
  Subscription, SubscriptionPlan, CreditMe, CreditPackage,
  KvkkAccountDeletionStatus,
  Order, OrderCreateResponse, IyzipayInitResponse,
  LiveKitTokenResponse,
  BirthChart, BirthChartCreateInput, GeocodeResult, DailyReadingResponse,
  MeResponse,
  LoginInput, LoginResponse,
  RegisterInput, RegisterResponse,
  Campaign, RedeemCampaignResponse,
} from '@/types';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  'http://localhost:8094/api/v1';

export const getAssetUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = API_URL.replace('/api/v1', '');
  return `${base}${path}`;
};

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
const del = <T>(path: string) => request<T>('DELETE', path);

function normalizeListResponse<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  const res = value as { items?: unknown; data?: unknown };
  const candidate = (res?.data as unknown) ?? res?.items;
  const nested = candidate as { items?: unknown } | null | undefined;
  const fallback = (nested && Array.isArray(nested.items)) ? nested.items : null;
  if (Array.isArray(candidate)) return candidate as T[];
  if (Array.isArray(fallback)) return fallback as T[];

  return [];
}

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
    post<void>('/push/register-token', { token: fcm_token }),

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

  buy: async (data: { package_id: string; locale?: string }) => {
    const res = await post<{ data: { checkout_url: string; token: string } }>('/credits/buy', data);
    return res.data;
  },
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
  getMyProfile: async () => {
    const res = await get<{ data: any }>('/profiles/me');
    return res.data;
  },

  upsertMyProfile: async (payload: { profile: Record<string, unknown> }) => {
    const res = await patch<{ data: any }>('/profiles/me', payload);
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
// Notifications
// -------------------------------------------------------------------

export const notificationsApi = {
  list: () =>
    get<{ items: any[] }>('/notifications/me'),

  markAsRead: (id: string) =>
    patch<void>(`/notifications/${id}/read`, {}),

  markAllAsRead: () =>
    post<void>('/notifications/read-all', {}),
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

  requestDeletion: async (reason?: string): Promise<{ data: KvkkAccountDeletionStatus & { message?: string; cooling_off_days?: number } }> =>
    post('/me/delete-account', reason?.trim() ? { reason: reason.trim() } : {}),

  cancelDeletion: async (): Promise<{ data: { id: string; status: 'cancelled' } }> =>
    del<{ data: { id: string; status: 'cancelled' } }>('/me/delete-account'),
};

// -------------------------------------------------------------------
// Horoscopes
// -------------------------------------------------------------------

export const horoscopesApi = {
  getToday: async (params: { sign: string; date?: string }): Promise<any> => {
    const res = await get<{ data: any }>('/horoscopes/today', params);
    return res.data;
  },
  getSignInfo: async (sign: string): Promise<any> => {
    const res = await get<{ data: any }>(`/horoscopes/${sign}`);
    return res.data;
  },
  getCompatibility: async (params: { signA: string; signB: string }): Promise<any> => {
    const res = await get<{ data: any }>('/horoscopes/compatibility', params);
    return res.data;
  },
};

export const tarotApi = {
  draw: async (data: { spread_type: string; question?: string; locale?: string }) => {
    const res = await post<{ data: any }>('/tarot/draw', data);
    return res.data;
  },
  getReading: async (id: string) => {
    const res = await get<{ data: any }>(`/tarot/reading/${id}`);
    return res.data;
  },
};

export const coffeeApi = {
  read: async (data: { image_ids: string[]; locale?: string }) => {
    const res = await post<{ data: any }>('/coffee/read', data);
    return res.data;
  },
  getReading: async (id: string) => {
    const res = await get<{ data: any }>(`/coffee/reading/${id}`);
    return res.data;
  },
};

export const storageApi = {
  upload: async (formData: FormData): Promise<{ id: string; url?: string | null }> => {
    const res = await fetch(`${API_URL}/storage/coffee/upload?upsert=1`, {
      method: 'POST',
      headers: _authToken ? { Authorization: `Bearer ${_authToken}` } : undefined,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string })?.message ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<{ id: string; url?: string | null }>;
  },
};

export const dreamsApi = {
  interpret: async (data: { dream_text: string; locale?: string }) => {
    const res = await post<{ data: any }>('/dreams/interpret', data);
    return res.data;
  },
  getReading: async (id: string) => {
    const res = await get<{ data: any }>(`/dreams/reading/${id}`);
    return res.data;
  },
};

export const numerologyApi = {
  calculate: async (data: { full_name: string; birth_date: string; locale?: string }) => {
    const res = await post<{ data: any }>('/numerology/calculate', data);
    return res.data;
  },
  getReading: async (id: string) => {
    const res = await get<{ data: any }>(`/numerology/reading/${id}`);
    return res.data;
  },
};

export const historyApi = {
  getUserHistory: async () => {
    const res = await get<{ data: any[] }>('/history/me');
    return res.data;
  },
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
};

export const synastryApi = {
  quick: async (data: { sign_a: string; sign_b: string }) => {
    const res = await post<{ data: any }>('/synastry/quick', data);
    const d = res.data?.data || res.data;
    return {
      title: `${data.sign_a} & ${data.sign_b}`,
      love_score: d?.result?.love_score ?? 78,
      sexual_score: d?.result?.sexual_score ?? 74,
      content: d?.raw ?? d?.content ?? '',
    };
  },

  manual: async (data: { partner_data: Record<string, unknown> }) => {
    const res = await post<{ data: any }>('/synastry/manual', data);
    const d = res.data?.data || res.data;
    return d;
  },

  list: async () => {
    const res = await get<{ data: any[] }>('/synastry/me');
    return res.data;
  },

  listInvites: async () => {
    const res = await get<{ data: any[] }>('/synastry/invites/me');
    return res.data;
  },

  createInvite: async (partnerUserId: string) => {
    const res = await post<{ data: any }>('/synastry/invite', { partner_user_id: partnerUserId });
    return res.data;
  },

  acceptInvite: async (id: string) => {
    const res = await post<{ data: any }>(`/synastry/invite/${id}/accept`, {});
    return res.data;
  },

  declineInvite: async (id: string) => {
    const res = await post<{ data: any }>(`/synastry/invite/${id}/decline`, {});
    return res.data;
  },
};

export const userApi = {
  search: async (q: string) => {
    const res = await get<{ data: any[] }>(`/auth/search?q=${encodeURIComponent(q)}`);
    return res.data;
  }
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

// -------------------------------------------------------------------
// Campaigns
// -------------------------------------------------------------------

export const campaignsApi = {
  active: async (params?: { applies_to?: string }): Promise<Campaign[]> => {
    const res = await get<{ data: Campaign[] }>('/campaigns/active', params);
    return Array.isArray(res?.data) ? res.data : [];
  },

  mine: async (): Promise<{ active: Campaign[]; redeemed: any[] }> => {
    const res = await get<{ data: { active: Campaign[]; redeemed: any[] } }>('/campaigns/me');
    return {
      active: Array.isArray(res?.data?.active) ? res.data.active : [],
      redeemed: Array.isArray(res?.data?.redeemed) ? res.data.redeemed : [],
    };
  },

  redeem: (params: { code: string; applies_to?: string }) =>
    post<RedeemCampaignResponse>('/campaigns/redeem', params),
};
