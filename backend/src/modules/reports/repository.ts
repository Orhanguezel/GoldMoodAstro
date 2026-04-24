// ===================================================================
// FILE: src/modules/reports/repository.ts
// ===================================================================

import { db } from '@/db/client';
import { bookings, resources, resourcesI18n } from './local-schemas';
import { getDefaultLocale } from '@vps/shared-backend/modules/siteSettings/service';
import { sql, and, gte, lte, eq, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';

export interface ReportParams {
  from?: string;
  to?: string;
  service_id?: string;
  resource_id?: string;
  status?: string;
  locale?: string;
}

const DATE_SQL = sql<string>`STR_TO_DATE(${bookings.appointment_date}, '%Y-%m-%d')`;

function buildWhere(params: ReportParams): SQL[] {
  const where: SQL[] = [];
  const { from, to, service_id, resource_id, status, locale } = params;
  if (from) where.push(gte(bookings.appointment_date, from));
  if (to) where.push(lte(bookings.appointment_date, to));
  if (service_id) where.push(eq(bookings.service_id, service_id));
  if (resource_id) where.push(eq(bookings.resource_id, resource_id));
  if (status) where.push(eq(bookings.status, status));
  if (locale) where.push(eq(bookings.locale, locale));
  return where;
}

export async function getKpiData(from?: string, to?: string) {
  return getKpiDataByFilters({ from, to });
}

export async function getKpiDataByFilters(params: ReportParams) {
  const where = buildWhere(params);
  const baseWhere = where.length ? and(...where) : undefined;

  const dailyBucket = sql<string>`DATE_FORMAT(${DATE_SQL}, '%Y-%m-%d')`;
  const weeklyBucket = sql<string>`CONCAT(DATE_FORMAT(${DATE_SQL}, '%x'), '-W', DATE_FORMAT(${DATE_SQL}, '%v'))`;
  const monthlyBucket = sql<string>`DATE_FORMAT(${DATE_SQL}, '%Y-%m')`;

  const periods = await Promise.all([
    db
      .select({
        bucket: dailyBucket.as('bucket'),
        bookings_total: sql<number>`count(*)`,
        completed_total: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
        cancelled_total: sql<number>`sum(case when status = 'cancelled' then 1 else 0 end)`,
      })
      .from(bookings)
      .where(baseWhere)
      .groupBy(dailyBucket)
      .orderBy(dailyBucket),
    db
      .select({
        bucket: weeklyBucket.as('bucket'),
        bookings_total: sql<number>`count(*)`,
        completed_total: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
        cancelled_total: sql<number>`sum(case when status = 'cancelled' then 1 else 0 end)`,
      })
      .from(bookings)
      .where(baseWhere)
      .groupBy(weeklyBucket)
      .orderBy(weeklyBucket),
    db
      .select({
        bucket: monthlyBucket.as('bucket'),
        bookings_total: sql<number>`count(*)`,
        completed_total: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
        cancelled_total: sql<number>`sum(case when status = 'cancelled' then 1 else 0 end)`,
      })
      .from(bookings)
      .where(baseWhere)
      .groupBy(monthlyBucket)
      .orderBy(monthlyBucket),
  ]);

  return periods.flatMap((rows, index) =>
    rows.map((r) => ({
      period: (['day', 'week', 'month'] as const)[index],
      bucket: String(r.bucket),
      bookings_total: Number(r.bookings_total),
      completed_total: Number(r.completed_total),
      cancelled_total: Number(r.cancelled_total),
      success_rate:
        Number(r.bookings_total) > 0 ? Number(r.completed_total) / Number(r.bookings_total) : 0,
    })),
  );
}

export async function getUsersPerformanceData(from?: string, to?: string) {
  return getUsersPerformanceDataByFilters({ from, to });
}

export async function getLocationsData(from?: string, to?: string) {
  return getLocationsDataByFilters({ from, to });
}

export async function getUsersPerformanceDataByFilters(params: ReportParams) {
  const where = buildWhere(params);
  const defaultLocale = String((await getDefaultLocale(null)) || 'de');
  const iDef = alias(resourcesI18n, 'ri_def');

  const data = await db
    .select({
      resource_id: bookings.resource_id,
      resource_title: sql<string>`COALESCE(${iDef.title}, ${resources.title}, ${bookings.resource_id})`,
      bookings_total: sql<number>`count(*)`,
      completed_total: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
      cancelled_orders: sql<number>`sum(case when status = 'cancelled' then 1 else 0 end)`,
    })
    .from(bookings)
    .leftJoin(resources, eq(resources.id, bookings.resource_id))
    .leftJoin(iDef, and(eq(iDef.resource_id, resources.id), eq(iDef.locale, defaultLocale)))
    .where(where.length ? and(...where) : undefined)
    .groupBy(bookings.resource_id, resources.title, iDef.title);

  return data.map((r) => ({
    resource_id: r.resource_id,
    resource_title: String(r.resource_title || r.resource_id || '—'),
    bookings_total: Number(r.bookings_total),
    completed_total: Number(r.completed_total),
    cancelled_orders: Number(r.cancelled_orders),
    success_rate:
      Number(r.bookings_total) > 0 ? Number(r.completed_total) / Number(r.bookings_total) : 0,
  }));
}

export async function getLocationsDataByFilters(params: ReportParams) {
  const where = buildWhere(params);

  const data = await db
    .select({
      locale: bookings.locale,
      bookings_total: sql<number>`count(*)`,
      completed_total: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
      cancelled_orders: sql<number>`sum(case when status = 'cancelled' then 1 else 0 end)`,
    })
    .from(bookings)
    .where(where.length ? and(...where) : undefined)
    .groupBy(bookings.locale);

  return data.map((r) => ({
    locale: String(r.locale || 'de'),
    locale_label: String(r.locale || 'de').toUpperCase(),
    bookings_total: Number(r.bookings_total),
    completed_total: Number(r.completed_total),
    cancelled_orders: Number(r.cancelled_orders),
    success_rate:
      Number(r.bookings_total) > 0 ? Number(r.completed_total) / Number(r.bookings_total) : 0,
  }));
}
