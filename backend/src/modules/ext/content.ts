import type { RouteHandler } from 'fastify';
import { z } from 'zod';
import { sql, type SQL } from 'drizzle-orm';
import { db } from '@/db/client';
import { listApprovedConsultants } from '@/modules/consultants/repository';

/**
 * B — İÇERİK KAYNAĞI (dış tüketici: ekosistem sosyal medya, "Content Source API v1.1").
 *
 * Ekosistem bu uçlardan goldmood'un içeriğini çekip YENİ sosyal post ÜRETİR
 * (1a analiz feed'inden AYRI yön). Standart adaptör (v1.1):
 *   GET {base}/articles?type=&locale=&limit=&offset=&q=&sort=  → içerik/blog/fal
 *   GET {base}/products?limit=&offset=&q=&sort=popular         → danışman + ücretsiz araç
 * Yanıt: { items, total, hasMore }. base = /api/ext/content, auth = X-Api-Key (grup).
 *
 * Kullanıcı isteği (2026-08-09): günlük fallar + tarot + fal içerikleri + danışman
 * profilleri paylaşılabilsin → /articles type registry ile genişletilir.
 */

function storefrontBase(): string {
  return (
    process.env.SOCIAL_PUBLIC_BASE ||
    process.env.FRONTEND_URL ||
    'https://goldmoodastro.com'
  ).replace(/\/$/, '');
}

function absUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${storefrontBase()}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

function splitTags(s: string | null | undefined): string[] {
  if (!s) return [];
  return s.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean);
}

function excerptOf(text: string | null | undefined, len = 200): string | null {
  if (!text) return null;
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > len ? clean.slice(0, len).trimEnd() + '…' : clean;
}

function rows<T = any>(result: unknown): T[] {
  return (Array.isArray((result as any)?.[0]) ? (result as any)[0] : (result as any)) as T[];
}

// COUNT(*) sorgusundan tek sayı çıkar.
function countOf(result: unknown): number {
  const r = rows<any>(result);
  const first = r?.[0] ?? {};
  const v = first.total ?? first.count ?? first['COUNT(*)'] ?? Object.values(first)[0];
  return Number(v) || 0;
}

// q → LIKE kalıbı (özel karakterleri kaçır).
function likePattern(q: string): string {
  return `%${q.replace(/[%_\\]/g, (m) => '\\' + m)}%`;
}

const SIGN_TR: Record<string, string> = {
  aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
  leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
  sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık',
};
const PERIOD_TR: Record<string, string> = {
  daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık', transit: 'Transit',
};

type FetchOpts = { locale: string; limit: number; offset: number; q: string | null; period: string };
type FetchResult = { items: any[]; total: number };

// ─────────────────────────────────────────────────────────────
// /articles — içerik türleri (registry ile genişletilebilir)
// ─────────────────────────────────────────────────────────────

async function fetchBlog({ locale, limit, offset, q }: FetchOpts): Promise<FetchResult> {
  const search = q ? sql`AND (i.title LIKE ${likePattern(q)} OR i.summary LIKE ${likePattern(q)})` : sql``;
  const base = storefrontBase();
  const total = countOf(
    await db.execute(sql`
      SELECT COUNT(*) AS total
      FROM custom_pages cp
      JOIN custom_pages_i18n i ON i.custom_page_id = cp.id AND i.locale = ${locale}
      WHERE cp.module_key = 'blog' AND cp.is_published = 1 ${search}
    `),
  );
  const r = rows(
    await db.execute(sql`
      SELECT cp.id, cp.featured_image, cp.created_at, cp.updated_at,
             i.title, i.slug, i.summary, i.content, i.tags
      FROM custom_pages cp
      JOIN custom_pages_i18n i ON i.custom_page_id = cp.id AND i.locale = ${locale}
      WHERE cp.module_key = 'blog' AND cp.is_published = 1 ${search}
      ORDER BY cp.display_order DESC, cp.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `),
  );
  const items = r.map((p: any) => ({
    id: `blog:${p.id}`,
    type: 'blog',
    category: 'blog',
    title: p.title,
    slug: p.slug,
    url: `${base}/${locale}/blog/${p.slug}`,
    excerpt: excerptOf(p.summary || p.content),
    body: p.content ?? null,
    image_url: absUrl(p.featured_image),
    locale,
    published_at: p.created_at,
    updated_at: p.updated_at,
    tags: splitTags(p.tags),
  }));
  return { items, total };
}

async function fetchHoroscopes({ locale, limit, offset, q, period }: FetchOpts): Promise<FetchResult> {
  const search = q ? sql`AND content LIKE ${likePattern(q)}` : sql``;
  const base = storefrontBase();
  const total = countOf(
    await db.execute(sql`
      SELECT COUNT(*) AS total FROM daily_horoscopes
      WHERE locale = ${locale} AND period = ${period} ${search}
    `),
  );
  const r = rows(
    await db.execute(sql`
      SELECT id, sign, period, period_start_date, locale, content,
             mood_score, lucky_number, lucky_color, created_at, updated_at
      FROM daily_horoscopes
      WHERE locale = ${locale} AND period = ${period} ${search}
      ORDER BY period_start_date DESC, sign ASC
      LIMIT ${limit} OFFSET ${offset}
    `),
  );
  const items = r.map((h: any) => {
    const dateKey = h.period_start_date instanceof Date
      ? h.period_start_date.toISOString().slice(0, 10)
      : String(h.period_start_date).slice(0, 10);
    const signLabel = SIGN_TR[h.sign] ?? h.sign;
    return {
      id: `horoscope:${h.id}`,
      type: 'horoscope',
      category: h.sign,
      title: `${signLabel} — ${PERIOD_TR[h.period] ?? h.period} Burç Yorumu (${dateKey})`,
      slug: `${h.sign}-${h.period}-${dateKey}`,
      url: `${base}/${locale}/burclar/${h.sign}`,
      excerpt: excerptOf(h.content),
      body: h.content ?? null,
      image_url: null,
      locale,
      published_at: h.period_start_date,
      updated_at: h.updated_at,
      tags: [h.sign, h.period, 'burc', 'astroloji'],
      meta: { mood_score: h.mood_score, lucky_number: h.lucky_number, lucky_color: h.lucky_color },
    };
  });
  return { items, total };
}

async function fetchTarot({ locale, limit, offset, q }: FetchOpts): Promise<FetchResult> {
  const search = q
    ? sql`WHERE (name_tr LIKE ${likePattern(q)} OR name_en LIKE ${likePattern(q)} OR upright_meaning LIKE ${likePattern(q)})`
    : sql``;
  const base = storefrontBase();
  const total = countOf(await db.execute(sql`SELECT COUNT(*) AS total FROM tarot_cards ${search}`));
  const r = rows(
    await db.execute(sql`
      SELECT id, slug, name_tr, name_en, arcana, suit, number,
             upright_meaning, reversed_meaning, image_url, keywords, updated_at
      FROM tarot_cards ${search}
      ORDER BY arcana ASC, number ASC
      LIMIT ${limit} OFFSET ${offset}
    `),
  );
  const items = r.map((c: any) => {
    const name = locale === 'tr' ? c.name_tr : (c.name_en || c.name_tr);
    let keywords: string[] = [];
    try {
      keywords = Array.isArray(c.keywords) ? c.keywords : JSON.parse(c.keywords || '[]');
    } catch { keywords = []; }
    return {
      id: `tarot:${c.id}`,
      type: 'tarot',
      category: c.arcana,
      title: `${name} — Tarot Kartı Anlamı`,
      slug: c.slug,
      url: `${base}/${locale}/tarot`,
      excerpt: excerptOf(c.upright_meaning),
      body: `Düz: ${c.upright_meaning ?? ''}\n\nTers: ${c.reversed_meaning ?? ''}`.trim(),
      image_url: absUrl(c.image_url),
      locale,
      published_at: null,
      updated_at: c.updated_at,
      tags: [...keywords, 'tarot', 'fal', c.arcana].filter(Boolean),
    };
  });
  return { items, total };
}

// coffee_symbols / dream_symbols aynı şekil (slug, name_tr, meaning, category JSON).
async function fetchSymbolFal(
  table: 'coffee_symbols' | 'dream_symbols',
  falType: 'coffee' | 'dream',
  toolPath: string,
  { locale, limit, offset, q }: FetchOpts,
): Promise<FetchResult> {
  const search = q ? sql`WHERE (name_tr LIKE ${likePattern(q)} OR meaning LIKE ${likePattern(q)})` : sql``;
  const base = storefrontBase();
  const total = countOf(await db.execute(sql`SELECT COUNT(*) AS total FROM ${sql.raw(table)} ${search}`));
  const r = rows(
    await db.execute(sql`
      SELECT id, slug, name_tr, meaning, category, created_at
      FROM ${sql.raw(table)} ${search}
      ORDER BY name_tr ASC
      LIMIT ${limit} OFFSET ${offset}
    `),
  );
  const falLabel = falType === 'coffee' ? 'Kahve Falı' : 'Rüya';
  const items = r.map((s: any) => {
    let category: string[] = [];
    try {
      category = Array.isArray(s.category) ? s.category : JSON.parse(s.category || '[]');
    } catch { category = []; }
    return {
      id: `${falType}:${s.id}`,
      type: falType,
      category: category[0] ?? falType,
      title: `${s.name_tr} — ${falLabel} Sembolü Anlamı`,
      slug: s.slug,
      url: `${base}/${locale}/${toolPath}`,
      excerpt: excerptOf(s.meaning),
      body: s.meaning ?? null,
      image_url: null,
      locale,
      published_at: s.created_at,
      updated_at: s.created_at,
      tags: [...category, falType === 'coffee' ? 'kahve falı' : 'rüya tabiri', 'fal'].filter(Boolean),
    };
  });
  return { items, total };
}

// type → fetcher. Yeni fal türü buraya eklenir (registry deseni).
const ARTICLE_TYPES: Record<string, (opts: FetchOpts) => Promise<FetchResult>> = {
  blog: fetchBlog,
  horoscope: fetchHoroscopes,
  tarot: fetchTarot,
  coffee: (o) => fetchSymbolFal('coffee_symbols', 'coffee', 'kahve-fali', o),
  dream: (o) => fetchSymbolFal('dream_symbols', 'dream', 'ruya-tabiri', o),
};

const articlesQuerySchema = z.object({
  type: z.string().optional(),
  locale: z.string().default('tr'),
  limit: z.coerce.number().int().min(1).max(60).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  q: z.string().trim().min(1).max(120).optional(),
  period: z.string().default('daily'),
  sort: z.string().optional(), // v1.1 uyumu (şu an tür-içi sabit sıralama)
  is_published: z.string().optional(),
});

export const articlesHandler: RouteHandler = async (req, reply) => {
  const p = articlesQuerySchema.parse(req.query ?? {});
  const type = (p.type || 'blog').toLowerCase();
  const fetcher = ARTICLE_TYPES[type];
  if (!fetcher) {
    return reply.code(400).send({
      error: { message: 'unknown_type', allowed: Object.keys(ARTICLE_TYPES) },
    });
  }
  const { items, total } = await fetcher({
    locale: p.locale,
    limit: p.limit,
    offset: p.offset,
    q: p.q ?? null,
    period: p.period,
  });
  return { items, total, hasMore: p.offset + items.length < total, type, locale: p.locale };
};

// ─────────────────────────────────────────────────────────────
// /products — danışman profilleri (öne çıkan/popüler) + ücretsiz araçlar
// ─────────────────────────────────────────────────────────────

function freeToolProducts(locale: string) {
  const base = storefrontBase();
  const tools = [
    { slug: 'tarot', title: 'Ücretsiz Tarot Falı', path: 'tarot', tags: ['tarot', 'fal'] },
    { slug: 'kahve-fali', title: 'Kahve Falı', path: 'kahve-fali', tags: ['kahve falı', 'fal'] },
    { slug: 'burcunu-ogren', title: 'Doğum Haritası / Burcunu Öğren', path: 'burcunu-ogren', tags: ['doğum haritası', 'astroloji'] },
    { slug: 'yukselen-burc', title: 'Yükselen Burç Hesaplayıcı', path: 'yukselen-burc-hesaplayici', tags: ['yükselen burç'] },
  ];
  return tools.map((t) => ({
    id: `tool:${t.slug}`,
    type: 'tool',
    title: t.title,
    slug: t.slug,
    url: `${base}/${locale}/${t.path}`,
    image_url: null,
    price: 0,
    currency: 'EUR',
    popularity: null,
    in_stock: true,
    tags: t.tags,
  }));
}

const productsQuerySchema = z.object({
  locale: z.string().default('tr'),
  limit: z.coerce.number().int().min(1).max(60).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  q: z.string().trim().min(1).max(120).optional(),
  sort: z.string().default('popular'),
  include_tools: z.string().optional(), // '0' → araçları hariç tut
});

export const productsHandler: RouteHandler = async (req, reply) => {
  const p = productsQuerySchema.parse(req.query ?? {});
  const base = storefrontBase();

  // Danışman havuzu (küçük ölçek: gate'li tüm liste alınır, q/offset uygulamada dilimlenir).
  const consultants = (await listApprovedConsultants(
    { sort: p.sort === 'popular' ? 'popular' : 'featured' } as any,
    p.locale,
    null,
  )) as any[];

  let consultantProducts = consultants.map((c) => ({
    id: `consultant:${c.id}`,
    type: 'consultant',
    title: c.full_name,
    slug: c.slug,
    url: `${base}/${p.locale}/consultants/${c.slug}`,
    image_url: absUrl(c.avatar_url),
    price: Number(c.session_price ?? 0) || null,
    currency: c.currency ?? 'EUR',
    popularity: Number(c.favorite_count ?? c.total_sessions ?? c.rating_count ?? 0),
    in_stock: true,
    headline: c.headline ?? null,
    excerpt: excerptOf(c.bio),
    expertise: Array.isArray(c.expertise) ? c.expertise : [],
    languages: Array.isArray(c.languages) ? c.languages : [],
    rating_avg: c.rating_avg != null ? Number(c.rating_avg) : null,
    rating_count: Number(c.rating_count ?? 0),
    tags: Array.isArray(c.expertise) ? [...c.expertise, 'danışman', 'astrolog'] : ['danışman'],
  }));

  const includeTools = p.include_tools !== '0';
  let all = includeTools ? [...consultantProducts, ...freeToolProducts(p.locale)] : consultantProducts;

  // q araması (başlık/uzmanlık/tag üzerinde)
  if (p.q) {
    const needle = p.q.toLocaleLowerCase('tr');
    all = all.filter((it: any) => {
      const hay = [it.title, it.headline, ...(it.tags || []), ...(it.expertise || [])]
        .filter(Boolean).join(' ').toLocaleLowerCase('tr');
      return hay.includes(needle);
    });
  }

  const total = all.length;
  const items = all.slice(p.offset, p.offset + p.limit);
  return { items, total, hasMore: p.offset + items.length < total, locale: p.locale };
};
