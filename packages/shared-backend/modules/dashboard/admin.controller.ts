import type { RouteHandler } from 'fastify';
import { sql, type SQL } from 'drizzle-orm';
import { db } from '../../db/client';

import { users } from '@goldmood/shared-backend/modules/auth/schema';
import { bookings } from '@goldmood/shared-backend/modules/bookings/schema';
import { orders } from '@goldmood/shared-backend/modules/orders/schema';
import { notifications } from '@goldmood/shared-backend/modules/notifications/schema';
import { storageAssets } from '@goldmood/shared-backend/modules/storage/schema';
import { contact_messages } from '@goldmood/shared-backend/modules/contact/schema';
import { emailTemplates } from '@goldmood/shared-backend/modules/emailTemplates/schema';
import { reviews } from '@goldmood/shared-backend/modules/review/schema';
import { resourceWorkingHours } from '@goldmood/shared-backend/modules/availability/schema';

type DashboardSummaryItem = { key: string; label: string; count: number };
type DashboardSummary = { items: DashboardSummaryItem[] };

function toNum(v: unknown): number {
  if (typeof v === 'bigint') return Number(v);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function countAll(table: any, where?: SQL): Promise<number> {
  let q = db.select({ c: sql<number>`COUNT(*)` }).from(table).$dynamic();
  if (where) q = q.where(where);
  const [row] = await q;
  return toNum(row?.c);
}

export const getDashboardSummaryAdmin: RouteHandler = async (req, reply) => {
  try {
    const rows: Array<{ key: string; label: string; count: Promise<number> }> = [
      { key: 'users',          label: 'Users',          count: countAll(users) },
      { key: 'bookings',       label: 'Bookings',       count: countAll(bookings) },
      { key: 'orders',         label: 'Orders',         count: countAll(orders) },
      { key: 'notifications',  label: 'Notifications',  count: countAll(notifications) },
      { key: 'reviews',        label: 'Reviews',        count: countAll(reviews) },
      { key: 'availability',   label: 'Availability',   count: countAll(resourceWorkingHours) },
      { key: 'contacts',       label: 'Support Msgs',   count: countAll(contact_messages) },
      { key: 'email_templates',label: 'Email Templates',count: countAll(emailTemplates) },
      { key: 'storage',        label: 'Storage',        count: countAll(storageAssets) },
    ];

    const items = await Promise.all(
      rows.map(async (r) => ({ key: r.key, label: r.label, count: await r.count })),
    );

    return reply.send({ items } satisfies DashboardSummary);
  } catch (err) {
    req.log.error({ err }, 'dashboard_summary_failed');
    return reply.code(500).send({ error: { message: 'dashboard_summary_failed' } });
  }
};

async function oneNumber(query: SQL): Promise<number> {
  const result = await db.execute(query);
  const rows = Array.isArray(result?.[0]) ? result[0] : result;
  const first = Array.isArray(rows) ? (rows[0] as any) : undefined;
  const value = first ? Object.values(first)[0] : 0;
  return toNum(value);
}

export const getDashboardAnalyticsAdmin: RouteHandler = async (req, reply) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const totalUsers = await oneNumber(sql`SELECT COUNT(*) AS c FROM users`);
    const activeConsultants = await oneNumber(sql`
      SELECT COUNT(*) AS c
      FROM consultants
      WHERE approval_status = 'approved' AND is_available = 1
    `);
    const todayBookings = await oneNumber(sql`
      SELECT COUNT(*) AS c
      FROM bookings
      WHERE appointment_date = ${today}
    `);
    const monthlyRevenue = await oneNumber(sql`
      SELECT COALESCE(SUM(total_amount), 0) AS c
      FROM orders
      WHERE payment_status IN ('paid', 'success')
        AND created_at >= DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01')
    `);

    // "revenue_total" adı taşıyan alan aslında AY BAŞINDAN beri olan ciroydu;
    // panelde "Toplam Ciro" diye görünüyordu. İkisini de ayrı ayrı veriyoruz.
    const revenueAllTime = await oneNumber(sql`
      SELECT COALESCE(SUM(total_amount), 0) AS c
      FROM orders
      WHERE payment_status IN ('paid', 'success')
    `);

    // Grafikler boş dizi olarak dönüyordu (panelde düz çizgi). Son 30 günün
    // günlük cirosu ve randevu adedi gerçek sorgudan gelir.
    const revenueTrendRows = await manyRows(sql`
      SELECT DATE(created_at) AS ymd, COALESCE(SUM(total_amount), 0) AS revenue, COUNT(*) AS orders_count
      FROM orders
      WHERE payment_status IN ('paid', 'success')
        AND created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY ymd ASC
    `);
    const bookingTrendRows = await manyRows(sql`
      SELECT DATE(created_at) AS ymd,
             COUNT(*) AS bookings_total,
             SUM(status IN ('booked','confirmed')) AS bookings_confirmed,
             SUM(status = 'completed') AS bookings_completed,
             SUM(status = 'cancelled') AS bookings_cancelled
      FROM bookings
      WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY ymd ASC
    `);

    const totalBookings = await oneNumber(sql`SELECT COUNT(*) AS c FROM bookings`);
    const confirmedBookings = await oneNumber(sql`
      SELECT COUNT(*) AS c FROM bookings WHERE status IN ('booked', 'confirmed')
    `);
    const completedBookings = await oneNumber(sql`
      SELECT COUNT(*) AS c FROM bookings WHERE status = 'completed'
    `);
    const cancelledBookings = await oneNumber(sql`
      SELECT COUNT(*) AS c FROM bookings WHERE status = 'cancelled'
    `);
    const resourcesTotal = await oneNumber(sql`SELECT COUNT(*) AS c FROM resources`);
    const slotsTotal = await oneNumber(sql`SELECT COUNT(*) AS c FROM resource_slots`);
    const slotsReserved = await oneNumber(sql`SELECT COALESCE(SUM(reserved_count), 0) AS c FROM slot_reservations`);
    const reviewsTotal = await oneNumber(sql`SELECT COUNT(*) AS c FROM reviews`);
    const notificationsTotal = await oneNumber(sql`SELECT COUNT(*) AS c FROM notifications`);
    const emailTemplatesTotal = await oneNumber(sql`SELECT COUNT(*) AS c FROM email_templates`);
    const storageTotal = await oneNumber(sql`SELECT COUNT(*) AS c FROM storage_assets`);
    const auditTotal = await oneNumber(sql`SELECT COUNT(*) AS c FROM audit_logs`);
    const supportTotal = await oneNumber(sql`SELECT COUNT(*) AS c FROM support_tickets`);

    return reply.send({
      range: '30d',
      fromYmd: '',
      toYmdExclusive: '',
      meta: { bucket: 'day' },
      totals: {
        users_total: totalUsers,
        consultants_active: activeConsultants,
        today_bookings: todayBookings,
        revenue_total: revenueAllTime,
        revenue_month: monthlyRevenue,
        bookings_total: totalBookings,
        bookings_new: 0,
        bookings_confirmed: confirmedBookings,
        bookings_completed: completedBookings,
        bookings_cancelled: cancelledBookings,
        bookings_other: Math.max(totalBookings - confirmedBookings - completedBookings - cancelledBookings, 0),
        slots_total: slotsTotal,
        slots_reserved: slotsReserved,
        resources_total: resourcesTotal,
        services_total: activeConsultants,
        faqs_total: 0,
        email_templates_total: emailTemplatesTotal,
        site_settings_total: 0,
        custom_pages_total: 0,
        menu_items_total: 0,
        slider_total: 0,
        footer_sections_total: 0,
        reviews_total: reviewsTotal,
        storage_assets_total: storageTotal,
        db_snapshots_total: 0,
        audit_logs_total: auditTotal,
        availability_total: slotsTotal,
        notifications_total: notificationsTotal,
        contact_messages_unread: 0,
        contact_messages_total: supportTotal,
      },
      resources: [],
      services: [],
      // Alan adları panelin beklediği sözleşmeye göre: bucket + *_total.
      trend: bookingTrendRows.map((r: any) => {
        const total = Number(r.bookings_total ?? 0);
        const confirmed = Number(r.bookings_confirmed ?? 0);
        const completed = Number(r.bookings_completed ?? 0);
        const cancelled = Number(r.bookings_cancelled ?? 0);
        return {
          bucket: String(r.ymd).slice(0, 10),
          bookings_total: total,
          bookings_new: Math.max(total - confirmed - completed - cancelled, 0),
          bookings_confirmed: confirmed,
          bookings_completed: completed,
          bookings_cancelled: cancelled,
        };
      }),
      revenueTrend: revenueTrendRows.map((r: any) => ({
        bucket: String(r.ymd).slice(0, 10),
        revenue_total: Number(r.revenue ?? 0),
        orders_total: Number(r.orders_count ?? 0),
      })),
    });
  } catch (err) {
    req.log.error({ err }, 'dashboard_analytics_failed');
    return reply.code(500).send({ error: { message: 'dashboard_analytics_failed' } });
  }
};

/**
 * GET /admin/dashboard/consultant-earnings
 * "Kim ne kazandırdı" tablosu — danışman başına ciro, platform komisyonu ve
 * danışman neti.
 *
 * KAYNAK CÜZDAN DEFTERİ: net ve komisyon `wallet_transactions`ten okunur,
 * bookings.session_price'tan HESAPLANMAZ. Komisyon oranı tarihe göre değişiyor
 * (platform_commission_rate.effective_from) ve iade edilen kayıtlar defterde
 * 'refunded' işaretli — sonradan yeniden hesaplamak eski oranı ve iadeleri
 * kaçırır. Defter ne diyorsa o.
 */
export const getConsultantEarningsAdmin: RouteHandler = async (req, reply) => {
  try {
    const query = ((req as any).query ?? {}) as Record<string, unknown>;
    const days = Math.min(Math.max(Number(query.days ?? 90) || 90, 1), 3650);

    const rows = await manyRows(sql`
      SELECT
        c.id AS consultant_id,
        COALESCE(u.full_name, '—') AS name,
        COALESCE(SUM(CASE WHEN wt.payment_status IN ('pending','completed') THEN wt.amount ELSE 0 END), 0) AS net_total,
        COALESCE(SUM(CASE WHEN wt.payment_status = 'completed' THEN wt.amount ELSE 0 END), 0) AS net_released,
        COALESCE(SUM(CASE WHEN wt.payment_status = 'pending' THEN wt.amount ELSE 0 END), 0) AS net_pending,
        COALESCE(SUM(CASE WHEN wt.payment_status = 'refunded' THEN wt.amount ELSE 0 END), 0) AS net_refunded,
        SUM(CASE WHEN wt.purpose = 'session_earning' AND wt.payment_status IN ('pending','completed') THEN 1 ELSE 0 END) AS session_count,
        SUM(CASE WHEN wt.purpose = 'media_message_earning' AND wt.payment_status IN ('pending','completed') THEN 1 ELSE 0 END) AS media_count,
        MAX(wt.created_at) AS last_earning_at
      FROM consultants c
      JOIN users u ON u.id = c.user_id
      LEFT JOIN wallets w ON w.consultant_id = c.id
      LEFT JOIN wallet_transactions wt
        ON wt.wallet_id = w.id
       AND wt.type = 'credit'
       AND wt.purpose IN ('session_earning', 'media_message_earning')
       AND wt.created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
      GROUP BY c.id, u.full_name
      ORDER BY net_total DESC, session_count DESC
      LIMIT 200
    `);

    // Brüt ve komisyon: hakediş satırının description JSON'undan toplanır
    // (yazıldığı ANdaki oranı taşır — sonradan oran değişse bile doğru kalır).
    const grossRows = await manyRows(sql`
      SELECT w.consultant_id AS consultant_id, wt.description AS description
      FROM wallet_transactions wt
      JOIN wallets w ON w.id = wt.wallet_id
      WHERE wt.type = 'credit'
        AND wt.purpose IN ('session_earning', 'media_message_earning')
        AND wt.payment_status IN ('pending','completed')
        AND wt.created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
    `);

    const grossByConsultant = new Map<string, { gross: number; commission: number }>();
    for (const row of grossRows as any[]) {
      const key = String(row.consultant_id ?? '');
      if (!key) continue;
      let gross = 0;
      let commission = 0;
      try {
        const d = JSON.parse(String(row.description || '{}'));
        gross = Number(d.gross ?? 0);
        commission = Number(d.commission_amount ?? 0);
      } catch {
        /* eski serbest metin kayıt — brüt bilinmiyor, 0 sayılır */
      }
      const cur = grossByConsultant.get(key) ?? { gross: 0, commission: 0 };
      cur.gross += Number.isFinite(gross) ? gross : 0;
      cur.commission += Number.isFinite(commission) ? commission : 0;
      grossByConsultant.set(key, cur);
    }

    const data = (rows as any[]).map((r) => {
      const g = grossByConsultant.get(String(r.consultant_id)) ?? { gross: 0, commission: 0 };
      const sessions = Number(r.session_count ?? 0) + Number(r.media_count ?? 0);
      return {
        consultant_id: String(r.consultant_id),
        name: String(r.name),
        gross: Number(g.gross.toFixed(2)),
        commission: Number(g.commission.toFixed(2)),
        net_total: Number(Number(r.net_total ?? 0).toFixed(2)),
        net_released: Number(Number(r.net_released ?? 0).toFixed(2)),
        net_pending: Number(Number(r.net_pending ?? 0).toFixed(2)),
        net_refunded: Number(Number(r.net_refunded ?? 0).toFixed(2)),
        session_count: Number(r.session_count ?? 0),
        media_count: Number(r.media_count ?? 0),
        avg_per_session: sessions > 0 ? Number((g.gross / sessions).toFixed(2)) : 0,
        last_earning_at: r.last_earning_at ?? null,
      };
    });

    const totals = data.reduce(
      (acc, r) => ({
        gross: acc.gross + r.gross,
        commission: acc.commission + r.commission,
        net_total: acc.net_total + r.net_total,
      }),
      { gross: 0, commission: 0, net_total: 0 },
    );

    return reply.send({
      days,
      data,
      totals: {
        gross: Number(totals.gross.toFixed(2)),
        commission: Number(totals.commission.toFixed(2)),
        net_total: Number(totals.net_total.toFixed(2)),
      },
    });
  } catch (err) {
    req.log.error({ err }, 'consultant_earnings_failed');
    return reply.code(500).send({ error: { message: 'consultant_earnings_failed' } });
  }
};

// -------------------------------------------------------------------
// Pazarlama & Dönüşüm dashboard'u — birinci-taraf (kendi DB) metrikleri.
// Pixel/GA tahmini + izne bağlı ölçer; buradaki veriler kesin.
// GET /admin/dashboard/marketing?days=30
// -------------------------------------------------------------------
async function manyRows(query: SQL): Promise<any[]> {
  const result = await db.execute(query);
  const rows = Array.isArray(result?.[0]) ? result[0] : result;
  return Array.isArray(rows) ? rows : [];
}

const PAID_ORDER = sql`payment_status IN ('paid', 'success')`;
const PAID_BOOKING = sql`status IN ('booked', 'confirmed', 'completed')`;

export const getMarketingDashboardAdmin: RouteHandler = async (req, reply) => {
  try {
    const rawDays = Number((req.query as any)?.days);
    const days = [7, 30, 90, 365].includes(rawDays) ? rawDays : 30;
    const fromExpr = sql`(NOW() - INTERVAL ${sql.raw(String(days))} DAY)`;

    // --- Huni: kullanıcı → randevu → ödenmiş randevu ---
    const totalUsers = await oneNumber(sql`SELECT COUNT(*) c FROM users WHERE role = 'user'`);
    const newUsers = await oneNumber(
      sql`SELECT COUNT(*) c FROM users WHERE role = 'user' AND created_at >= ${fromExpr}`,
    );
    const usersWithBooking = await oneNumber(
      sql`SELECT COUNT(DISTINCT user_id) c FROM bookings`,
    );
    const usersPaid = await oneNumber(
      sql`SELECT COUNT(DISTINCT user_id) c FROM bookings WHERE ${PAID_BOOKING}`,
    );

    // --- Gelir (orders paid) ---
    const revenueTotal = await oneNumber(
      sql`SELECT COALESCE(SUM(total_amount), 0) c FROM orders WHERE ${PAID_ORDER}`,
    );
    const revenueRange = await oneNumber(
      sql`SELECT COALESCE(SUM(total_amount), 0) c FROM orders WHERE ${PAID_ORDER} AND created_at >= ${fromExpr}`,
    );
    const paidOrders = await oneNumber(
      sql`SELECT COUNT(*) c FROM orders WHERE ${PAID_ORDER}`,
    );
    // --- Danışmanlık cirosu (bookings paid, session_price snapshot) ---
    const consultationRevenue = await oneNumber(
      sql`SELECT COALESCE(SUM(CAST(session_price AS DECIMAL(12,2))), 0) c FROM bookings WHERE ${PAID_BOOKING}`,
    );

    // --- Gelir trendi (günlük, son N gün) ---
    const trendRows = await manyRows(
      sql`SELECT DATE(created_at) d, COALESCE(SUM(total_amount), 0) amount, COUNT(*) orders
          FROM orders WHERE ${PAID_ORDER} AND created_at >= ${fromExpr}
          GROUP BY DATE(created_at) ORDER BY d ASC`,
    );
    const revenueTrend = trendRows.map((r) => ({
      date: r.d instanceof Date ? r.d.toISOString().slice(0, 10) : String(r.d).slice(0, 10),
      amount: toNum(r.amount),
      orders: toNum(r.orders),
    }));

    // --- Kayıt kaynağı (google vs e-posta/şifre) ---
    const sourceRows = await manyRows(
      sql`SELECT CASE WHEN google_id IS NOT NULL AND google_id <> '' THEN 'google' ELSE 'password' END src,
                 COUNT(*) c
          FROM users WHERE role = 'user' GROUP BY src`,
    );
    const sources = sourceRows.map((r) => ({ key: String(r.src), count: toNum(r.c) }));

    // --- Medya tipi (sesli / görüntülü) ---
    const mediaRows = await manyRows(
      sql`SELECT COALESCE(media_type, 'audio') m, COUNT(*) c FROM bookings GROUP BY m`,
    );
    const mediaSplit = { audio: 0, video: 0 } as Record<string, number>;
    for (const r of mediaRows) mediaSplit[String(r.m)] = toNum(r.c);

    // --- Randevu durum kırılımı (huni sonrası) ---
    const bookingsRange = await oneNumber(
      sql`SELECT COUNT(*) c FROM bookings WHERE created_at >= ${fromExpr}`,
    );
    const paidBookings = await oneNumber(
      sql`SELECT COUNT(*) c FROM bookings WHERE ${PAID_BOOKING}`,
    );

    // --- Top danışmanlar (randevu + ciro + puan) ---
    const topRows = await manyRows(
      sql`SELECT c.id id, COALESCE(u.full_name, '—') name,
                 COUNT(b.id) bookings,
                 COALESCE(SUM(CASE WHEN b.status IN ('booked','confirmed','completed')
                   THEN CAST(b.session_price AS DECIMAL(12,2)) ELSE 0 END), 0) revenue,
                 c.rating_avg rating, c.rating_count rating_count
          FROM consultants c
          JOIN users u ON u.id = c.user_id
          LEFT JOIN bookings b ON b.consultant_id = c.id
          GROUP BY c.id, u.full_name, c.rating_avg, c.rating_count
          ORDER BY bookings DESC, revenue DESC
          LIMIT 8`,
    );
    const topConsultants = topRows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      bookings: toNum(r.bookings),
      revenue: toNum(r.revenue),
      rating: Number(r.rating) || 0,
      ratingCount: toNum(r.rating_count),
    }));

    return reply.send({
      range: { days },
      funnel: {
        totalUsers,
        newUsers,
        usersWithBooking,
        usersPaid,
        userToBookingRate: totalUsers ? Math.round((usersWithBooking / totalUsers) * 1000) / 10 : 0,
        bookingToPaidRate: usersWithBooking
          ? Math.round((usersPaid / usersWithBooking) * 1000) / 10
          : 0,
      },
      revenue: {
        total: revenueTotal,
        range: revenueRange,
        paidOrders,
        avgOrderValue: paidOrders ? Math.round((revenueTotal / paidOrders) * 100) / 100 : 0,
        consultationRevenue,
        trend: revenueTrend,
      },
      bookings: { range: bookingsRange, paid: paidBookings },
      sources,
      mediaSplit,
      topConsultants,
    });
  } catch (err) {
    req.log.error({ err }, 'dashboard_marketing_failed');
    return reply.code(500).send({ error: { message: 'dashboard_marketing_failed' } });
  }
};
