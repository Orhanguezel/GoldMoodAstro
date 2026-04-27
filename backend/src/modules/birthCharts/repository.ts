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

/** FAZ 8.5 — input → astrology engine input (IANA tz + tob_known fallback). */
function toAstrologyInput(input: CreateBirthChartInput) {
  const tobKnown = input.tob_known !== false;
  const rawTob = tobKnown && input.tob ? input.tob : '12:00:00';
  const time = rawTob.length === 5 ? `${rawTob}:00` : rawTob;
  return {
    date: input.dob,
    time,
    tobKnown,
    latitude: input.pob_lat,
    longitude: input.pob_lng,
    tzIana: input.tz_iana,
    timezoneOffsetMinutes: input.tz_offset ?? 0,
    houseSystem: 'equal' as const,
  };
}

/** Saat bilinmiyorsa DB'ye 12:00:00 yazılır; chart_data.input.tobKnown=false flag taşır. */
function tobForDb(input: CreateBirthChartInput): string {
  const tobKnown = input.tob_known !== false;
  if (!tobKnown || !input.tob) return '12:00:00';
  return input.tob.length === 5 ? `${input.tob}:00` : input.tob;
}

export async function createBirthChart(userId: string, input: CreateBirthChartInput) {
  const rows = await listBirthCharts(userId);
  if (rows.length >= 5) {
    const error = new Error('birth_chart_limit_reached');
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  const chart = await computeNatalChart(toAstrologyInput(input));

  const id = randomUUID();
  await db.insert(birthCharts).values({
    id,
    user_id: userId,
    name: input.name,
    dob: input.dob as never,
    tob: tobForDb(input) as never,
    pob_lat: String(input.pob_lat),
    pob_lng: String(input.pob_lng),
    pob_label: input.pob_label,
    tz_offset: input.tz_offset ?? 0,
    chart_data: chart,
  });

  return getBirthChart(userId, id);
}

export async function previewBirthChart(input: CreateBirthChartInput) {
  const chart = await computeNatalChart(toAstrologyInput(input));

  return {
    id: 'preview',
    name: input.name,
    dob: input.dob,
    tob: tobForDb(input),
    pob_lat: String(input.pob_lat),
    pob_lng: String(input.pob_lng),
    pob_label: input.pob_label,
    tz_offset: input.tz_offset ?? 0,
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
