// =============================================================
// astrology_kb — bir natal chart için ilgili "altın metinleri" çek
// =============================================================
import { and, eq, inArray, or, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { astrologyKb, type AstrologyKbRow } from './schema';

export type KbExcerpt = {
  kind: string;
  key1: string;
  key2?: string | null;
  key3?: string | null;
  title: string;
  content: string;
  short_summary?: string | null;
};

export type ChartShape = {
  planets?: Record<string, { sign?: string; house?: number } | undefined>;
  ascendant?: { sign?: string };
  aspects?: Array<{ planet_a: string; planet_b: string; type: string; orb?: number }>;
};

const PLANET_KEYS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

/**
 * Verilen doğum haritasından KB'de aranacak (kind, key1, key2, key3) tuple'larını çıkarır.
 * - planet_sign: her gezegen × burcu için
 * - planet_house: her gezegen × evi için
 * - aspect: önemli açılar (orb < 8°)
 */
function buildLookupKeys(chart: ChartShape) {
  const tuples: Array<{ kind: string; key1: string; key2?: string; key3?: string }> = [];

  // planet_sign + planet_house
  for (const planet of PLANET_KEYS) {
    const p = chart.planets?.[planet];
    if (!p) continue;
    if (p.sign) tuples.push({ kind: 'planet_sign', key1: planet, key2: p.sign });
    if (p.house) tuples.push({ kind: 'planet_house', key1: planet, key2: String(p.house) });
  }

  // ascendant
  if (chart.ascendant?.sign) {
    tuples.push({ kind: 'planet_sign', key1: 'ascendant', key2: chart.ascendant.sign });
  }

  // aspect — orb<8 ve önemli olanlar
  for (const a of chart.aspects || []) {
    if (typeof a.orb === 'number' && a.orb > 8) continue;
    // her iki sırayı da dene (key1 < key2 normalize edilmiş olabilir)
    tuples.push({ kind: 'aspect', key1: a.planet_a, key2: a.planet_b, key3: a.type });
    tuples.push({ kind: 'aspect', key1: a.planet_b, key2: a.planet_a, key3: a.type });
  }

  return tuples;
}

/**
 * Chart için ilgili tüm KB satırlarını tek query ile çeker.
 * NOT: kombine UNIQUE index (kind, key1, key2, key3, locale) üzerinden hızlı.
 */
export async function fetchKbForChart(args: {
  chart: ChartShape;
  locale?: string;
  limit?: number;
}): Promise<KbExcerpt[]> {
  const locale = args.locale || 'tr';
  const tuples = buildLookupKeys(args.chart);
  if (!tuples.length) return [];

  // OR ile birleştir — Drizzle'da inArray uygulanmıyor 3-tuple için, tek tek or() kullan
  const conditions = tuples.map((t) =>
    and(
      eq(astrologyKb.kind, t.kind as any),
      eq(astrologyKb.key1, t.key1),
      t.key2 ? eq(astrologyKb.key2, t.key2) : sql`${astrologyKb.key2} IS NULL`,
      t.key3 ? eq(astrologyKb.key3, t.key3) : sql`${astrologyKb.key3} IS NULL`,
    ),
  );

  const rows = await db
    .select({
      kind: astrologyKb.kind,
      key1: astrologyKb.key1,
      key2: astrologyKb.key2,
      key3: astrologyKb.key3,
      title: astrologyKb.title,
      content: astrologyKb.content,
      short_summary: astrologyKb.short_summary,
    })
    .from(astrologyKb)
    .where(
      and(
        eq(astrologyKb.locale, locale),
        eq(astrologyKb.is_active, 1),
        or(...conditions),
      ),
    )
    .limit(args.limit ?? 25);

  return rows as KbExcerpt[];
}

/**
 * KB excerpt listesini LLM prompt için tek string'e formatlar.
 */
export function formatKbExcerpts(excerpts: KbExcerpt[]): string {
  if (!excerpts.length) return '(astrolog metni bulunamadı)';
  return excerpts
    .map((e) => {
      const id = [e.key1, e.key2, e.key3].filter(Boolean).join('+');
      return `### ${e.title} (${e.kind}: ${id})\n${e.content}`;
    })
    .join('\n\n');
}

export { buildLookupKeys };
