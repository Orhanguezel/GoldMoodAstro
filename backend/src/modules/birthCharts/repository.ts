import { randomUUID } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  computeNatalChart,
  computeSynastry,
  computeTransitChart,
} from '@goldmood/shared-backend/modules/astrology';
import { birthCharts } from './schema';
import type { CreateBirthChartInput } from './validation';

export async function listBirthCharts(userId: string) {
  return db.select().from(birthCharts).where(eq(birthCharts.user_id, userId));
}

export async function getBirthChart(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(birthCharts)
    .where(and(eq(birthCharts.user_id, userId), eq(birthCharts.id, id)))
    .limit(1);
  return row ?? null;
}

export async function createBirthChart(userId: string, input: CreateBirthChartInput) {
  const rows = await listBirthCharts(userId);
  if (rows.length >= 5) {
    const error = new Error('birth_chart_limit_reached');
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  const chart = await computeNatalChart({
    date: input.dob,
    time: input.tob.length === 5 ? `${input.tob}:00` : input.tob,
    latitude: input.pob_lat,
    longitude: input.pob_lng,
    timezoneOffsetMinutes: input.tz_offset,
    houseSystem: 'equal',
  });

  const id = randomUUID();
  await db.insert(birthCharts).values({
    id,
    user_id: userId,
    name: input.name,
    dob: input.dob as never,
    tob: input.tob as never,
    pob_lat: String(input.pob_lat),
    pob_lng: String(input.pob_lng),
    pob_label: input.pob_label,
    tz_offset: input.tz_offset,
    chart_data: chart,
  });

  return getBirthChart(userId, id);
}

export async function previewBirthChart(input: CreateBirthChartInput) {
  const chart = await computeNatalChart({
    date: input.dob,
    time: input.tob.length === 5 ? `${input.tob}:00` : input.tob,
    latitude: input.pob_lat,
    longitude: input.pob_lng,
    timezoneOffsetMinutes: input.tz_offset,
    houseSystem: 'equal',
  });

  return {
    id: 'preview',
    name: input.name,
    dob: input.dob,
    tob: input.tob,
    pob_lat: String(input.pob_lat),
    pob_lng: String(input.pob_lng),
    pob_label: input.pob_label,
    tz_offset: input.tz_offset,
    chart_data: chart,
  };
}

export async function deleteBirthChart(userId: string, id: string) {
  await db.delete(birthCharts).where(and(eq(birthCharts.user_id, userId), eq(birthCharts.id, id)));
  return { ok: true, id };
}

export async function getBirthChartTransit(userId: string, id: string) {
  const row = await getBirthChart(userId, id);
  if (!row) return null;
  return computeTransitChart(row.chart_data);
}

export async function getBirthChartSynastry(userId: string, chartAId: string, chartBId: string) {
  const chartA = await getBirthChart(userId, chartAId);
  const chartB = await getBirthChart(userId, chartBId);
  if (!chartA || !chartB) return null;
  return computeSynastry(chartA.chart_data, chartB.chart_data);
}
