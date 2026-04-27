// src/modules/banners/controller.ts
// FAZ 12 / T12-1

import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from "../../db/client";
import { banners } from "./schema";
import { and, eq, or, lte, gte, isNull, sql, desc, inArray } from "drizzle-orm";

const PLACEMENTS = [
  "home_hero", "home_sidebar", "home_footer", "consultant_list",
  "mobile_welcome", "mobile_home", "mobile_call_end", "admin_dashboard",
] as const;
type Placement = (typeof PLACEMENTS)[number];

/** GET /banners?placement=home_hero&locale=tr — public, aktif + tarih içinde */
export const listActive: RouteHandler = async (req, reply) => {
  const q = req.query as Record<string, string | undefined>;
  const placement = (q.placement || "") as Placement;
  const locale = q.locale || "*";

  if (!placement || !PLACEMENTS.includes(placement)) {
    return reply.code(400).send({ error: { message: "invalid_placement" } });
  }

  const now = new Date();

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

  return reply.send({ data: rows });
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
