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

const I18N_LOCALES = ["tr", "en", "de"] as const;
type BannerI18nLocale = (typeof I18N_LOCALES)[number];

type BannerAdminRow = typeof banners.$inferSelect & {
  title?: string | null;
  subtitle?: string | null;
  cta_label?: string | null;
};

function cleanOptionalText(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function cleanBannerBody(body: Partial<typeof banners.$inferInsert>) {
  const next = { ...body } as Record<string, unknown>;
  for (const key of [
    "title_tr",
    "title_en",
    "title_de",
    "subtitle_tr",
    "subtitle_en",
    "subtitle_de",
    "cta_label_tr",
    "cta_label_en",
    "cta_label_de",
    "image_url_mobile",
    "link_url",
    "campaign_id",
  ]) {
    if (key in next) next[key] = cleanOptionalText(next[key]);
  }
  if ("code" in next && typeof next.code === "string") next.code = next.code.trim();
  if ("image_url" in next && typeof next.image_url === "string") next.image_url = next.image_url.trim();
  return next as Partial<typeof banners.$inferInsert>;
}

function hasI18nPayload(body: Partial<typeof banners.$inferInsert>) {
  return I18N_LOCALES.some((locale) =>
    [`title_${locale}`, `subtitle_${locale}`, `cta_label_${locale}`].some((key) => key in body),
  );
}

function i18nValue(
  body: Partial<typeof banners.$inferInsert>,
  field: "title" | "subtitle" | "cta_label",
  locale: BannerI18nLocale,
) {
  return cleanOptionalText((body as Record<string, unknown>)[`${field}_${locale}`]) as string | null;
}

async function syncBannerI18n(bannerId: string, body: Partial<typeof banners.$inferInsert>) {
  if (!hasI18nPayload(body)) return;

  for (const locale of I18N_LOCALES) {
    await (db as any).session.client.query(
      `INSERT INTO banner_i18n (id, banner_id, locale, title, subtitle, cta_label)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         subtitle = VALUES(subtitle),
         cta_label = VALUES(cta_label),
         updated_at = NOW(3)`,
      [
        randomUUID(),
        bannerId,
        locale,
        i18nValue(body, "title", locale),
        i18nValue(body, "subtitle", locale),
        i18nValue(body, "cta_label", locale),
      ],
    );
  }
}

async function mergeAdminI18n<T extends BannerAdminRow>(rows: T[]): Promise<T[]> {
  if (rows.length === 0) return rows;

  const placeholders = rows.map(() => "?").join(",");
  const [i18nRows] = await (db as any).session.client.query(
    `SELECT banner_id, locale, title, subtitle, cta_label
     FROM banner_i18n
     WHERE banner_id IN (${placeholders})`,
    rows.map((row) => row.id),
  );

  const byBanner = new Map<string, Record<string, any>>();
  for (const row of i18nRows as any[]) {
    const entry = byBanner.get(row.banner_id) ?? {};
    entry[row.locale] = row;
    byBanner.set(row.banner_id, entry);
  }

  return rows.map((row) => {
    const translations = byBanner.get(row.id) ?? {};
    return {
      ...row,
      title_tr: translations.tr?.title ?? row.title_tr,
      title_en: translations.en?.title ?? row.title_en,
      title_de: translations.de?.title ?? row.title_de,
      subtitle_tr: translations.tr?.subtitle ?? row.subtitle_tr,
      subtitle_en: translations.en?.subtitle ?? row.subtitle_en,
      subtitle_de: translations.de?.subtitle ?? row.subtitle_de,
      cta_label_tr: translations.tr?.cta_label ?? row.cta_label_tr,
      cta_label_en: translations.en?.cta_label ?? row.cta_label_en,
      cta_label_de: translations.de?.cta_label ?? row.cta_label_de,
    };
  });
}

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
  const locale = q.locale ? normalizeLocale(q.locale) : undefined;

  const where =
    placement && locale
      ? and(eq(banners.placement, placement), or(eq(banners.locale, "*"), eq(banners.locale, locale)))
      : placement
        ? eq(banners.placement, placement)
        : locale
          ? or(eq(banners.locale, "*"), eq(banners.locale, locale))
          : undefined;
  const rows = await db
    .select()
    .from(banners)
    .where(where)
    .orderBy(desc(banners.created_at))
    .limit(200);
  return reply.send({ data: await mergeAdminI18n(rows) });
};

/** GET /admin/banners/:id — detay */
export const adminGet: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const [row] = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  const [merged] = await mergeAdminI18n([row]);
  return reply.send({ data: merged });
};

/** POST /admin/banners — yeni banner */
export const adminCreate: RouteHandler = async (req, reply) => {
  const body = cleanBannerBody(req.body as Partial<typeof banners.$inferInsert>);
  if (!body.code || !body.placement || !body.image_url) {
    return reply.code(400).send({ error: { message: "missing_required_fields" } });
  }
  const id = randomUUID();
  await db.insert(banners).values({ ...body, id } as typeof banners.$inferInsert);
  await syncBannerI18n(id, body);
  const [created] = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
  const [merged] = await mergeAdminI18n([created]);
  return reply.code(201).send({ data: merged });
};

/** PATCH /admin/banners/:id */
export const adminUpdate: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = cleanBannerBody(req.body as Partial<typeof banners.$inferInsert>);
  await db.update(banners).set(body).where(eq(banners.id, id));
  await syncBannerI18n(id, body);
  const [updated] = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
  if (!updated) return reply.code(404).send({ error: { message: "not_found" } });
  const [merged] = await mergeAdminI18n([updated]);
  return reply.send({ data: merged });
};

/** DELETE /admin/banners/:id */
export const adminDelete: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await db.delete(banners).where(eq(banners.id, id));
  return reply.code(204).send();
};
