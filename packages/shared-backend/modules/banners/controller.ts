// src/modules/banners/controller.ts
// FAZ 12 / T12-1

import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from "../../db/client";
import { banners } from "./schema";
import { and, eq, or, lte, gte, isNull, sql, desc, inArray } from "drizzle-orm";
import { bearerFrom, getJWTFromReq } from "../auth/helpers";
import { getSubscriptionSummary } from "../subscriptions";

const PLACEMENTS = [
  "home_hero", "home_sidebar", "home_footer", "consultant_list",
  "home_mid_1", "home_mid_2", "home_mid_3",
  "consultant_detail_top", "consultant_detail_bottom",
  "dashboard_top", "blog_sidebar", "blog_inline",
  "mobile_welcome", "mobile_home", "mobile_call_end", "admin_dashboard",
] as const;
type Placement = (typeof PLACEMENTS)[number];
type TargetSegment = "all" | "free" | "paid";

function normalizeLocale(locale?: string | null): string {
  const normalized = String(locale || "tr").trim().toLowerCase().split("-")[0];
  return normalized || "tr";
}

function fallbackByLocale<T>(locale: string, tr: T, en: T, de?: T): T {
  if (locale === "en") return (en ?? tr) as T;
  if (locale === "de") return ((de ?? tr) ?? en) as T;
  return tr;
}

async function localizeBanners<T extends {
  id: string;
  title_tr?: string | null;
  title_en?: string | null;
  title_de?: string | null;
  subtitle_tr?: string | null;
  subtitle_en?: string | null;
  subtitle_de?: string | null;
  cta_label_tr?: string | null;
  cta_label_en?: string | null;
  cta_label_de?: string | null;
}>(rows: T[], locale: string) {
  if (rows.length === 0) return rows;

  const normalized = normalizeLocale(locale);
  const placeholders = rows.map(() => "?").join(",");
  const [i18nRows] = await (db as any).session.client.query(
    `SELECT banner_id, locale, title, subtitle, cta_label
     FROM banner_i18n
     WHERE banner_id IN (${placeholders}) AND locale IN (?, 'tr')`,
    [...rows.map((row) => row.id), normalized],
  );
  const byBanner = new Map<string, Record<string, any>>();
  for (const row of i18nRows as any[]) {
    const entry = byBanner.get(row.banner_id) ?? {};
    entry[row.locale] = row;
    byBanner.set(row.banner_id, entry);
  }

  return rows.map((row) => {
    const translations = byBanner.get(row.id) ?? {};
    const resolved = translations[normalized] ?? translations.tr;
    return {
      ...row,
      title: resolved?.title ?? fallbackByLocale(normalized, row.title_tr ?? null, row.title_en ?? null, row.title_de ?? null),
      subtitle: resolved?.subtitle ?? fallbackByLocale(normalized, row.subtitle_tr ?? null, row.subtitle_en ?? null, row.subtitle_de ?? null),
      cta_label: resolved?.cta_label ?? fallbackByLocale(normalized, row.cta_label_tr ?? null, row.cta_label_en ?? null, row.cta_label_de ?? null),
    };
  });
}

export function resolveBannerTargetSegments(subscription: unknown): TargetSegment[] {
  return ["all", subscription ? "paid" : "free"];
}

async function resolveBannerSegments(req: Parameters<RouteHandler>[0]): Promise<TargetSegment[]> {
  const token = bearerFrom(req);
  if (!token) return resolveBannerTargetSegments(null);

  try {
    const payload = getJWTFromReq(req).verify(token) as { sub?: string };
    if (!payload.sub) return resolveBannerTargetSegments(null);
    const subscription = await getSubscriptionSummary(payload.sub);
    return resolveBannerTargetSegments(subscription);
  } catch {
    return resolveBannerTargetSegments(null);
  }
}

/** GET /banners?placement=home_hero&locale=tr — public, aktif + tarih içinde */
export const listActive: RouteHandler = async (req, reply) => {
  const q = req.query as Record<string, string | undefined>;
  const placement = (q.placement || "") as Placement;
  const locale = normalizeLocale(q.locale || (req as any).locale || "tr");

  if (!placement || !PLACEMENTS.includes(placement)) {
    return reply.code(400).send({ error: { message: "invalid_placement" } });
  }

  const now = new Date();
  const targetSegments = await resolveBannerSegments(req);

  const rows = await db
    .select()
    .from(banners)
    .where(
      and(
        eq(banners.placement, placement),
        eq(banners.is_active, 1),
        or(eq(banners.locale, "*"), eq(banners.locale, locale)),
        or(isNull(banners.starts_at), lte(banners.starts_at, now)),
        or(isNull(banners.ends_at), gte(banners.ends_at, now)),
        inArray(banners.target_segment, targetSegments),
      )
    )
    .orderBy(desc(banners.priority), desc(banners.created_at))
    .limit(10);

  // view_count'u toplu artır
  if (rows.length > 0) {
    await db
      .update(banners)
      .set({ view_count: sql`view_count + 1` })
      .where(inArray(banners.id, rows.map(r => r.id)));
  }

  return reply.send({ data: await localizeBanners(rows, locale) });
};

/** POST /banners/:id/click — counter (anonim, no auth) */
export const trackClick: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await db
    .update(banners)
    .set({ click_count: sql`click_count + 1` })
    .where(eq(banners.id, id));
  return reply.code(204).send();
};

// ── Admin handlers ─────────────────────────────────────────────────────────

/** GET /admin/banners — liste */
export const adminList: RouteHandler = async (req, reply) => {
  const q = req.query as Record<string, string | undefined>;
  const placement = q.placement as Placement | undefined;

  const where = placement ? eq(banners.placement, placement) : undefined;
  const rows = await db
    .select()
    .from(banners)
    .where(where)
    .orderBy(desc(banners.created_at))
    .limit(200);
  return reply.send({ data: rows });
};

/** GET /admin/banners/:id — detay */
export const adminGet: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const [row] = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send({ data: row });
};

/** POST /admin/banners — yeni banner */
export const adminCreate: RouteHandler = async (req, reply) => {
  const body = req.body as Partial<typeof banners.$inferInsert>;
  if (!body.code || !body.placement || !body.image_url) {
    return reply.code(400).send({ error: { message: "missing_required_fields" } });
  }
  const id = randomUUID();
  await db.insert(banners).values({ ...body, id } as typeof banners.$inferInsert);
  const [created] = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
  return reply.code(201).send({ data: created });
};

/** PATCH /admin/banners/:id */
export const adminUpdate: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = req.body as Partial<typeof banners.$inferInsert>;
  await db.update(banners).set(body).where(eq(banners.id, id));
  const [updated] = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
  if (!updated) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send({ data: updated });
};

/** DELETE /admin/banners/:id */
export const adminDelete: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await db.delete(banners).where(eq(banners.id, id));
  return reply.code(204).send();
};
