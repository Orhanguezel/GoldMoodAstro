import type { RouteHandler } from 'fastify';
import { z } from 'zod';
import { and, asc, eq, gt, gte, inArray, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/social/db/client';
import { socialPosts } from '@/social/db/schema';

/**
 * 1a — İÇERİK KATALOĞU (dış tüketici: ekosistem sosyal medya).
 *
 * Kaynak: goldmood'un KENDİ DB'sindeki social_posts (goldmood posting cron'unun
 * yazdığı + yayın sonrası platform post id'sini kaydettiği tablo).
 *
 * FLATTEN: platform='both' satırı → iki DÜZ öğe (facebook + instagram), her biri
 * kendi platform + platformPostId'siyle, ortak taksonomiyi paylaşır. Ekosistem her
 * öğenin platformPostId'sini Graph API insight'ıyla eşleştirir ("hangi tür/zaman/
 * seriesPart tutuyor" analizi). Telegram öğelerinde platformPostId=null (id kolonu yok).
 *
 * Salt-okuma. Keyset sayfalama (updatedAt, id) — offset değil, ölçek için.
 */

// Günlük burç carousel'i part1/part2 → hangi 6 burcu kapsıyor (per-sign insight
// carousel düzeyinde matematiksel olarak imkânsız; seriesPart gerçek kırılım).
const SIGN_PARTS: Record<number, string[]> = {
  1: ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo'],
  2: ['libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'],
};

// platform enum → gerçekte yayınlanan hedef platformlar (flatten fan-out).
const PLATFORM_FANOUT: Record<string, string[]> = {
  facebook: ['facebook'],
  instagram: ['instagram'],
  telegram: ['telegram'],
  x: ['x'],
  youtube: ['youtube'],
  linkedin: ['linkedin'],
  both: ['facebook', 'instagram'],
  all: ['facebook', 'instagram', 'telegram'],
};

// Varsayılan feed: taslak/iptal hariç. ?status=all → filtre yok; ?status=posted → daralt.
const DEFAULT_STATUSES = ['posted', 'scheduled', 'publishing', 'manual_pending'] as const;

const querySchema = z.object({
  updatedSince: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  cursor: z.string().optional(),
  status: z.string().optional(), // 'all' | 'posted' | 'scheduled' | ...
});

type Row = typeof socialPosts.$inferSelect;

function parseHashtags(s: string | null): string[] {
  if (!s) return [];
  return s
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseSourceRef(sourceRef: string | null) {
  const out: {
    series: string | null;
    seriesPart: number | null;
    signsCovered: string[];
    dateKey: string | null;
    isStory: boolean;
    isReel: boolean;
  } = { series: null, seriesPart: null, signsCovered: [], dateKey: null, isStory: false, isReel: false };
  if (!sourceRef) return out;

  // daily-horoscope-carousel-2026-08-09-part2  |  daily-horoscope-2026-08-09-part1
  const daily = sourceRef.match(/^daily-horoscope(?:-carousel)?-(\d{4}-\d{2}-\d{2})-part([12])$/);
  if (daily) {
    out.series = 'daily-horoscope';
    out.dateKey = daily[1]!;
    out.seriesPart = Number(daily[2]);
    out.signsCovered = SIGN_PARTS[out.seriesPart] ?? [];
    return out;
  }

  // Temalı: "august-2026-extra:08:story:moon-symbol-cta"
  if (sourceRef.includes(':')) {
    out.series = sourceRef.split(':')[0] || null;
    out.isStory = /(^|:)story(:|$)/.test(sourceRef);
    out.isReel = /(^|:)reel(:|$)/.test(sourceRef);
    return out;
  }

  out.series = sourceRef;
  return out;
}

function toDateKey(d: Date | string | null): string | null {
  if (!d) return null;
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function deriveContentType(row: Row, parsed: ReturnType<typeof parseSourceRef>, mediaCount: number): string {
  if (parsed.isStory) return 'story';
  if (parsed.isReel) return 'reel';
  if (mediaCount > 1) return 'carousel';
  if (mediaCount === 1) return 'single';
  return 'text';
}

function platformPostId(row: Row, platform: string): string | null {
  switch (platform) {
    case 'facebook':
      return row.fbPostId || null;
    case 'instagram':
      return row.igMediaId || null;
    case 'x':
      return row.xTweetId || null;
    case 'youtube':
      return row.youtubeVideoId || null;
    default:
      return null; // telegram, linkedin: id kolonu yok
  }
}

function rowToItems(row: Row) {
  const parsed = parseSourceRef(row.sourceRef);
  const media = Array.isArray(row.mediaUrls) && row.mediaUrls.length
    ? row.mediaUrls
    : row.imageUrl
      ? [row.imageUrl]
      : [];
  const contentType = deriveContentType(row, parsed, media.length);
  const targets = PLATFORM_FANOUT[row.platform] ?? [row.platform];

  const shared = {
    postUuid: row.uuid,
    createdAt: row.createdAt,
    publishedAt: row.postedAt,
    updatedAt: row.updatedAt,
    status: row.status,
    contentType,
    postType: row.postType,
    series: parsed.series,
    seriesPart: parsed.seriesPart,
    signsCovered: parsed.signsCovered,
    dateKey: parsed.dateKey ?? toDateKey(row.postedAt ?? row.scheduledAt),
    language: 'tr',
    title: row.title,
    caption: row.caption,
    hashtags: parseHashtags(row.hashtags),
    mediaUrls: media,
    canonicalSlug: row.linkUrl || null,
    sourceType: row.sourceType,
    sourceRef: row.sourceRef,
    aiGenerated: !!row.aiGenerated,
    aiModel: row.aiModel || null,
  };

  return targets.map((platform) => ({
    id: `${row.uuid}#${platform}`,
    platform,
    platformPostId: platformPostId(row, platform),
    ...shared,
  }));
}

// Keyset cursor = base64("<updatedAtMs>:<numericId>"). Bir satırı iki sayfaya bölmemek
// için sayfalama SATIR düzeyinde; her satır tüm platform öğelerini birlikte yayar.
function encodeCursor(row: Row): string {
  const ts = row.updatedAt instanceof Date ? row.updatedAt.getTime() : new Date(row.updatedAt as any).getTime();
  return Buffer.from(`${ts}:${row.id}`).toString('base64url');
}

function decodeCursor(cursor: string): { ts: Date; id: number } | null {
  try {
    const [tsStr, idStr] = Buffer.from(cursor, 'base64url').toString('utf8').split(':');
    const ts = Number(tsStr);
    const id = Number(idStr);
    if (!Number.isFinite(ts) || !Number.isFinite(id)) return null;
    return { ts: new Date(ts), id };
  } catch {
    return null;
  }
}

export const contentCatalogHandler: RouteHandler = async (req, reply) => {
  const q = querySchema.parse(req.query ?? {});

  const conds: SQL[] = [];

  // Durum filtresi
  if (q.status && q.status !== 'all') {
    const wanted = q.status.split(',').map((s) => s.trim()).filter(Boolean);
    conds.push(inArray(socialPosts.status, wanted as any));
  } else if (!q.status) {
    conds.push(inArray(socialPosts.status, DEFAULT_STATUSES as unknown as string[] as any));
  }

  // Artımlı çekim
  if (q.updatedSince) {
    conds.push(gte(socialPosts.updatedAt, new Date(q.updatedSince)));
  }

  // Keyset cursor: (updatedAt > ts) OR (updatedAt = ts AND id > id)
  if (q.cursor) {
    const cur = decodeCursor(q.cursor);
    if (!cur) return reply.code(400).send({ error: { message: 'invalid_cursor' } });
    const keyset = or(
      gt(socialPosts.updatedAt, cur.ts),
      and(eq(socialPosts.updatedAt, cur.ts), gt(socialPosts.id, cur.id)),
    );
    if (keyset) conds.push(keyset);
  }

  const rows = (await db
    .select()
    .from(socialPosts)
    .where(conds.length ? and(...conds) : sql`1=1`)
    .orderBy(asc(socialPosts.updatedAt), asc(socialPosts.id))
    .limit(q.limit)) as Row[];

  const items = rows.flatMap(rowToItems);
  const hasMore = rows.length === q.limit;
  const nextCursor = hasMore && rows.length ? encodeCursor(rows[rows.length - 1]!) : null;

  return {
    items,
    nextCursor,
    hasMore,
    // NOT: limit SATIR sayısıdır; flatten sonrası öğe sayısı (both postları) daha fazla olabilir.
    rowCount: rows.length,
    itemCount: items.length,
  };
};
