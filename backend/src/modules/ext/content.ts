import type { RouteHandler } from 'fastify';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { listApprovedConsultants } from '@/modules/consultants/repository';

/**
 * B — İÇERİK KAYNAĞI (dış tüketici: ekosistem sosyal medya, "Content Source API v1").
 *
 * Ekosistem bu uçlardan goldmood'un içeriğini çekip YENİ sosyal post ÜRETİR
 * (1a analiz feed'inden AYRI yön). Standart adaptör şekli:
 *   GET {base}/articles?type=&locale=&limit=&is_published=1   → içerik/blog/fal
 *   GET {base}/products?sort=popular&limit=                   → danışman + ücretsiz araç
 * base = https://goldmoodastro.com/api/ext/content, auth = X-Api-Key (grup seviyesinde).
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

// Göreli asset yolunu mutlak URL'ye çevir (zaten mutlaksa dokunma).
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

const SIGN_TR: Record<string, string> = {
  aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
  leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
  sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık',
};
const PERIOD_TR: Record<string, string> = {
  daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık', transit: 'Transit',
};

// ─────────────────────────────────────────────────────────────
// /articles — içerik türleri (registry ile genişletilebilir)
// ─────────────────────────────────────────────────────────────

async function fetchBlog(locale: string, limit: number) {
  const r = rows(
    await db.execute(sql`
      SELECT cp.id, cp.featured_image, cp.created_at, cp.updated_at,
             i.title, i.slug, i.summary, i.content, i.tags
      FROM custom_pages cp
      JOIN custom_pages_i18n i ON i.custom_page_id = cp.id AND i.locale = ${locale}
      WHERE cp.module_key = 'blog' AND cp.is_published = 1
      ORDER BY cp.display_order DESC, cp.created_at DESC
      LIMIT ${limit}
    `),
  );
  const base = storefrontBase();
  return r.map((p: any) => ({
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
}

async function fetchHoroscopes(locale: string, limit: number, period: string) {
  const r = rows(
    await db.execute(sql`
      SELECT id, sign, period, period_start_date, locale, content,
             mood_score, lucky_number, lucky_color, created_at, updated_at
      FROM daily_horoscopes
      WHERE locale = ${locale} AND period = ${period}
      ORDER BY period_start_date DESC, sign ASC
      LIMIT ${limit}
    `),
  );
  const base = storefrontBase();
  return r.map((h: any) => {
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
}

async function fetchTarot(locale: string, limit: number) {
  const r = rows(
    await db.execute(sql`
      SELECT id, slug, name_tr, name_en, arcana, suit, number,
             upright_meaning, reversed_meaning, image_url, keywords, updated_at
      FROM tarot_cards
      ORDER BY arcana ASC, number ASC
      LIMIT ${limit}
    `),
  );
  const base = storefrontBase();
  return r.map((c: any) => {
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
}

// Sembol sözlüğü falları (coffee_symbols / dream_symbols aynı şekil: slug, name_tr,
// meaning, category JSON). Post üretimi için "X sembolü ne anlama gelir" içeriği.
async function fetchSymbolFal(
  table: 'coffee_symbols' | 'dream_symbols',
  falType: 'coffee' | 'dream',
  toolPath: string,
  locale: string,
  limit: number,
) {
  const r = rows(
    await db.execute(sql`
      SELECT id, slug, name_tr, meaning, category, created_at
      FROM ${sql.raw(table)}
      ORDER BY name_tr ASC
      LIMIT ${limit}
    `),
  );
  const base = storefrontBase();
  return r.map((s: any) => {
    let category: string[] = [];
    try {
      category = Array.isArray(s.category) ? s.category : JSON.parse(s.category || '[]');
    } catch { category = []; }
    const falLabel = falType === 'coffee' ? 'Kahve Falı' : 'Rüya';
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
}

// type → fetcher. Yeni fal türü buraya eklenir (registry deseni).
const ARTICLE_TYPES: Record<string, (locale: string, limit: number, opts: { period: string }) => Promise<any[]>> = {
  blog: (l, n) => fetchBlog(l, n),
  horoscope: (l, n, o) => fetchHoroscopes(l, n, o.period),
  tarot: (l, n) => fetchTarot(l, n),
  coffee: (l, n) => fetchSymbolFal('coffee_symbols', 'coffee', 'kahve-fali', l, n),
  dream: (l, n) => fetchSymbolFal('dream_symbols', 'dream', 'ruya-tabiri', l, n),
};

const articlesQuerySchema = z.object({
  type: z.string().optional(),
  locale: z.string().default('tr'),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  period: z.string().default('daily'),
  is_published: z.string().optional(), // standart adaptör uyumu (blog zaten yalnız yayınlanmış)
});

export const articlesHandler: RouteHandler = async (req, reply) => {
  const q = articlesQuerySchema.parse(req.query ?? {});
  const type = (q.type || 'blog').toLowerCase();
  const fetcher = ARTICLE_TYPES[type];
  if (!fetcher) {
    return reply.code(400).send({
      error: { message: 'unknown_type', allowed: Object.keys(ARTICLE_TYPES) },
    });
  }
  const items = await fetcher(q.locale, q.limit, { period: q.period });
  return { items, count: items.length, type, locale: q.locale };
};

// ─────────────────────────────────────────────────────────────
// /products — danışman profilleri (öne çıkan/popüler) + ücretsiz araçlar
// ─────────────────────────────────────────────────────────────

// Ücretsiz araçlar — post üretimi için CTA'lı "ürün" olarak sunulur (fiyat=0).
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
    currency: 'TRY',
    popularity: null,
    in_stock: true,
    tags: t.tags,
  }));
}

const productsQuerySchema = z.object({
  locale: z.string().default('tr'),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  sort: z.string().default('popular'),
  include_tools: z.string().optional(), // '0' → araçları hariç tut
});

export const productsHandler: RouteHandler = async (req, reply) => {
  const q = productsQuerySchema.parse(req.query ?? {});
  const base = storefrontBase();

  const consultants = (await listApprovedConsultants(
    { sort: q.sort === 'popular' ? 'popular' : 'featured', limit: q.limit } as any,
    q.locale,
    null,
  )) as any[];

  const consultantProducts = consultants.map((c) => ({
    id: `consultant:${c.id}`,
    type: 'consultant',
    title: c.full_name,
    slug: c.slug,
    url: `${base}/${q.locale}/consultants/${c.slug}`,
    image_url: absUrl(c.avatar_url),
    price: Number(c.session_price ?? 0) || null,
    currency: c.currency ?? 'TRY',
    popularity: Number(c.favorite_count ?? c.total_sessions ?? c.rating_count ?? 0),
    in_stock: true,
    // Profil zenginleştirme — "danışmanımızı tanıyın" postu üretimi için
    headline: c.headline ?? null,
    excerpt: excerptOf(c.bio),
    expertise: Array.isArray(c.expertise) ? c.expertise : [],
    languages: Array.isArray(c.languages) ? c.languages : [],
    rating_avg: c.rating_avg != null ? Number(c.rating_avg) : null,
    rating_count: Number(c.rating_count ?? 0),
    tags: Array.isArray(c.expertise) ? [...c.expertise, 'danışman', 'astrolog'] : ['danışman'],
  }));

  const includeTools = q.include_tools !== '0';
  const items = includeTools ? [...consultantProducts, ...freeToolProducts(q.locale)] : consultantProducts;

  return { items, count: items.length, locale: q.locale };
};
