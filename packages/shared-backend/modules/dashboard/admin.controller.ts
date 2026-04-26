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
        revenue_total: monthlyRevenue,
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
      trend: [],
      revenueTrend: [],
    });
  } catch (err) {
    req.log.error({ err }, 'dashboard_analytics_failed');
    return reply.code(500).send({ error: { message: 'dashboard_analytics_failed' } });
  }
};
