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

/**
 * FAZ 20 / T20-3 + T20-4 — Yükselen + Güneş + Ay (Big Three) preview.
 * Auth ZORUNLU DEĞİL. Kullanıcı kayıt etmeden de görebilir; CTA ile tam haritaya yönlendirir.
 *
 * Hesaplama: Swiss Ephemeris ile compute (mevcut altyapı).
 * İçerik: astrology_kb'den `kind=sign` short_summary + image_url çekilir.
 */
export async function previewBigThree(input: CreateBirthChartInput, locale: string = 'tr') {
  const chart = await computeNatalChart(toAstrologyInput(input));

  const sun = chart.planets?.sun;
  const moon = chart.planets?.moon;
  const asc = chart.ascendant;
  const tobUnknown = (chart as any)?.tob_unknown === true || input.tob_known === false;

  // KB'den 3 sign için title + short_summary + image_url topla (tek query)
  const wantedSigns = [sun?.sign, moon?.sign, asc?.sign].filter(Boolean) as string[];
  const placeholders = wantedSigns.map(() => '?').join(',');
  let kbBySign = new Map<string, { title: string; short_summary: string | null; image_url: string | null }>();
  if (wantedSigns.length > 0) {
    const [rows] = await (db as any).session.client.query(
      `SELECT key1, title, short_summary, image_url
       FROM astrology_kb
       WHERE kind = 'sign' AND key1 IN (${placeholders}) AND locale = ? AND is_active = 1`,
      [...wantedSigns, locale],
    );
    for (const r of rows as any[]) {
      kbBySign.set(String(r.key1), {
        title: String(r.title),
        short_summary: r.short_summary ?? null,
        image_url: r.image_url ?? null,
      });
    }
  }

  const slot = (
    label: 'sun' | 'moon' | 'ascendant',
    signKey: string | undefined,
    signLabel: string | undefined,
    extra: Record<string, unknown> = {},
  ) => {
    if (!signKey) return null;
    const kb = kbBySign.get(signKey) ?? null;
    return {
      slot: label,
      sign: signKey,
      sign_label: signLabel ?? null,
      kb_title: kb?.title ?? null,
      summary: kb?.short_summary ?? null,
      image_url: kb?.image_url ?? null,
      ...extra,
    };
  };

  return {
    big_three: {
      sun: slot('sun', sun?.sign, sun?.sign_label),
      moon: slot('moon', moon?.sign, moon?.sign_label),
      // Asc tob unknown ise tahminden çok genel uyarı verilmeli — frontend bunu işleyecek
      ascendant: slot('ascendant', asc?.sign, asc?.sign_label, { tob_unknown: tobUnknown }),
    },
    input: {
      name: input.name,
      dob: input.dob,
      tob: tobForDb(input),
      tob_known: input.tob_known !== false,
      pob_label: input.pob_label,
    },
    /** Frontend: kayıt CTA'sı için tam chart data lazım olursa, /birth-charts/preview kullanılır. */
    cta: {
      message: 'Diğer 7 gezegenin için tam haritan ücretsiz — kayıt ol.',
      action_path: '/register',
    },
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

export async function updateBirthChart(userId: string, id: string, input: CreateBirthChartInput) {
  const chart = await computeNatalChart(toAstrologyInput(input));

  await db.update(birthCharts)
    .set({
      name: input.name,
      dob: input.dob as never,
      tob: tobForDb(input) as never,
      pob_lat: String(input.pob_lat),
      pob_lng: String(input.pob_lng),
      pob_label: input.pob_label,
      tz_offset: input.tz_offset ?? 0,
      chart_data: chart,
    })
    .where(and(eq(birthCharts.user_id, userId), eq(birthCharts.id, id)));

  return getBirthChart(userId, id);
}
