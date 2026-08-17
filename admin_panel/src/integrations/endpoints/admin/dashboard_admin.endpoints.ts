// =============================================================
// FILE: src/integrations/endpoints/admin/dashboard_admin.endpoints.ts
// =============================================================
import { baseApi } from "@/integrations/baseApi";
import type { DashboardAnalytics, DashboardRangeKey } from "@/integrations/shared";
import { normalizeDashboardAnalytics } from "@/integrations/shared";

// ---- Pazarlama & Dönüşüm (birinci-taraf) tipleri --------------
export type MarketingFunnel = {
  totalUsers: number;
  newUsers: number;
  usersWithBooking: number;
  usersPaid: number;
  userToBookingRate: number;
  bookingToPaidRate: number;
};
export type MarketingRevenue = {
  total: number;
  range: number;
  paidOrders: number;
  avgOrderValue: number;
  consultationRevenue: number;
  trend: Array<{ date: string; amount: number; orders: number }>;
};
export type MarketingDashboard = {
  range: { days: number };
  funnel: MarketingFunnel;
  revenue: MarketingRevenue;
  bookings: { range: number; paid: number };
  sources: Array<{ key: string; count: number }>;
  mediaSplit: Record<string, number>;
  topConsultants: Array<{
    id: string;
    name: string;
    bookings: number;
    revenue: number;
    rating: number;
    ratingCount: number;
  }>;
};

const EMPTY_MARKETING: MarketingDashboard = {
  range: { days: 30 },
  funnel: {
    totalUsers: 0,
    newUsers: 0,
    usersWithBooking: 0,
    usersPaid: 0,
    userToBookingRate: 0,
    bookingToPaidRate: 0,
  },
  revenue: { total: 0, range: 0, paidOrders: 0, avgOrderValue: 0, consultationRevenue: 0, trend: [] },
  bookings: { range: 0, paid: 0 },
  sources: [],
  mediaSplit: { audio: 0, video: 0 },
  topConsultants: [],
};

// ---- API -----------------------------------------------------
export type ConsultantEarningRow = {
  consultant_id: string;
  name: string;
  gross: number;
  commission: number;
  net_total: number;
  net_released: number;
  net_pending: number;
  net_refunded: number;
  session_count: number;
  media_count: number;
  avg_per_session: number;
  last_earning_at: string | null;
};

export type ConsultantEarnings = {
  days: number;
  data: ConsultantEarningRow[];
  totals: { gross: number; commission: number; net_total: number };
};

export const dashboardAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getDashboardSummaryAdmin: b.query<DashboardAnalytics, { range?: DashboardRangeKey } | void>({
      query: (params) => ({
        url: "/admin/dashboard/analytics",
        params: params ?? undefined,
      }),
      transformResponse: (res: unknown) => normalizeDashboardAnalytics(res),
      providesTags: [{ type: "Dashboard" as const, id: "SUMMARY" }],
    }),

    getMarketingDashboardAdmin: b.query<MarketingDashboard, { days?: number } | void>({
      query: (params) => ({
        url: "/admin/dashboard/marketing",
        params: params?.days ? { days: params.days } : undefined,
      }),

      transformResponse: (res: unknown) => {
        const d = ((res as any)?.data ?? res) as Partial<MarketingDashboard> | undefined;
        if (!d || typeof d !== "object") return EMPTY_MARKETING;
        return { ...EMPTY_MARKETING, ...d } as MarketingDashboard;
      },
      providesTags: [{ type: "Dashboard" as const, id: "MARKETING" }],
    }),

    getConsultantEarningsAdmin: b.query<ConsultantEarnings, { days?: number } | void>({
      query: (params) => ({
        url: '/admin/dashboard/consultant-earnings',
        params: params?.days ? { days: params.days } : undefined,
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDashboardSummaryAdminQuery,
  useGetMarketingDashboardAdminQuery,
  useGetConsultantEarningsAdminQuery,
} =
  dashboardAdminApi;
