// src/modules/campaigns/controller.ts
// FAZ 13 / T13-1

import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from "../../db/client";
import { campaigns, campaignRedemptions } from "./schema";
import { and, eq, or, lte, gte, isNull, sql, desc, lt } from "drizzle-orm";

function getUser(req: { user?: unknown }) {
  const u = req.user as Record<string, unknown> | undefined;
  const id = (u?.id ?? u?.sub ?? "") as string;
  return { id };
}

/** GET /campaigns/active?applies_to=subscription — public, aktif kampanyalar */
export const listActive: RouteHandler = async (req, reply) => {
  const q = req.query as Record<string, string | undefined>;
  const appliesTo = q.applies_to;
  const now = new Date();

  const conds = [
    eq(campaigns.is_active, 1),
    or(isNull(campaigns.starts_at), lte(campaigns.starts_at, now)),
    or(isNull(campaigns.ends_at), gte(campaigns.ends_at, now)),
    or(isNull(campaigns.max_uses), lt(campaigns.used_count, campaigns.max_uses)),
  ];
  if (appliesTo) {
    conds.push(or(eq(campaigns.applies_to, "all"), eq(campaigns.applies_to, appliesTo as "subscription" | "credit_package" | "consultant_booking")));
  }

  const rows = await db
    .select({
      id: campaigns.id,
      code: campaigns.code,
      name_tr: campaigns.name_tr,
      name_en: campaigns.name_en,
      description_tr: campaigns.description_tr,
      description_en: campaigns.description_en,
      type: campaigns.type,
      value: campaigns.value,
      applies_to: campaigns.applies_to,
      ends_at: campaigns.ends_at,
    })
    .from(campaigns)
    .where(and(...conds))
    .orderBy(desc(campaigns.created_at))
    .limit(50);

  return reply.send({ data: rows });
};

/** GET /campaigns/me — auth, kullanıcının geçerli ve kullanılmış kampanyaları */
export const listMine: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);
  if (!userId) return reply.code(401).send({ error: { message: "unauthorized" } });

  const now = new Date();

  const activeRows = await db
    .select({
      id: campaigns.id,
      code: campaigns.code,
      name_tr: campaigns.name_tr,
      name_en: campaigns.name_en,
      description_tr: campaigns.description_tr,
      description_en: campaigns.description_en,
      type: campaigns.type,
      value: campaigns.value,
      applies_to: campaigns.applies_to,
      ends_at: campaigns.ends_at,
    })
    .from(campaigns)
    .where(
      and(
        eq(campaigns.is_active, 1),
        or(isNull(campaigns.starts_at), lte(campaigns.starts_at, now)),
        or(isNull(campaigns.ends_at), gte(campaigns.ends_at, now)),
        or(isNull(campaigns.max_uses), lt(campaigns.used_count, campaigns.max_uses)),
      ),
    )
    .orderBy(desc(campaigns.created_at))
    .limit(50);

  const redeemedRows = await db
    .select({
      id: campaignRedemptions.id,
      campaign_id: campaignRedemptions.campaign_id,
      order_id: campaignRedemptions.order_id,
      value_applied: campaignRedemptions.value_applied,
      redeemed_at: campaignRedemptions.redeemed_at,
      code: campaigns.code,
      name_tr: campaigns.name_tr,
      name_en: campaigns.name_en,
      type: campaigns.type,
      value: campaigns.value,
      applies_to: campaigns.applies_to,
    })
    .from(campaignRedemptions)
    .innerJoin(campaigns, eq(campaignRedemptions.campaign_id, campaigns.id))
    .where(eq(campaignRedemptions.user_id, userId))
    .orderBy(desc(campaignRedemptions.redeemed_at))
    .limit(50);

  return reply.send({ data: { active: activeRows, redeemed: redeemedRows } });
};

/**
 * POST /campaigns/redeem — auth, kupon kodu kullan
 * Body: { code, applies_to?, order_id? }
 * Geri döner: { campaign, value_applied }
 *
 * Not: Bu endpoint kuponu kontrol eder ve eligible'sa redemption kaydı yaratır.
 *      Asıl indirim hesabı checkout (orders / subscription start) tarafından yapılır.
 */
export const redeem: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);
  if (!userId) return reply.code(401).send({ error: { message: "unauthorized" } });

  const body = req.body as { code?: string; applies_to?: string; order_id?: string };
  const code = (body.code || "").trim().toUpperCase();
  if (!code) return reply.code(400).send({ error: { message: "code_required" } });

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.code, code))
    .limit(1);

  if (!campaign) return reply.code(404).send({ error: { message: "campaign_not_found" } });
  if (!campaign.is_active) return reply.code(409).send({ error: { message: "campaign_inactive" } });

  const now = new Date();
  if (campaign.starts_at && campaign.starts_at > now) return reply.code(409).send({ error: { message: "campaign_not_started" } });
  if (campaign.ends_at && campaign.ends_at < now) return reply.code(409).send({ error: { message: "campaign_expired" } });
  if (campaign.max_uses != null && campaign.used_count >= campaign.max_uses) {
    return reply.code(409).send({ error: { message: "campaign_quota_full" } });
  }
  if (body.applies_to && campaign.applies_to !== "all" && campaign.applies_to !== body.applies_to) {
    return reply.code(409).send({ error: { message: "campaign_not_applicable" } });
  }

  // per-user limit
  const userRedemptions = await db
    .select({ id: campaignRedemptions.id })
    .from(campaignRedemptions)
    .where(and(eq(campaignRedemptions.campaign_id, campaign.id), eq(campaignRedemptions.user_id, userId)));
  if (userRedemptions.length >= campaign.max_uses_per_user) {
    return reply.code(409).send({ error: { message: "user_redemption_limit_reached" } });
  }

  // Redemption oluştur (order_id yoksa "preview" — checkout sırasında order_id ile patch'lenir)
  const id = randomUUID();
  await db.insert(campaignRedemptions).values({
    id,
    campaign_id: campaign.id,
    user_id: userId,
    order_id: body.order_id ?? null,
    value_applied: campaign.value,
  });

  // used_count atomic +1
  await db
    .update(campaigns)
    .set({ used_count: sql`used_count + 1` })
    .where(eq(campaigns.id, campaign.id));

  return reply.send({
    data: {
      campaign: {
        id: campaign.id,
        code: campaign.code,
        type: campaign.type,
        value: campaign.value,
        applies_to: campaign.applies_to,
      },
      redemption_id: id,
      value_applied: campaign.value,
    },
  });
};

// ── Admin handlers ─────────────────────────────────────────────────────────

export const adminList: RouteHandler = async (req, reply) => {
  const q = req.query as Record<string, string | undefined>;
  const where = q.code ? eq(campaigns.code, q.code.toUpperCase()) : undefined;
  const rows = await db.select().from(campaigns).where(where).orderBy(desc(campaigns.created_at)).limit(200);
  return reply.send({ data: rows });
};

export const adminCreate: RouteHandler = async (req, reply) => {
  const body = req.body as Partial<typeof campaigns.$inferInsert>;
  if (!body.code || !body.type || body.value == null) {
    return reply.code(400).send({ error: { message: "missing_required_fields" } });
  }
  const id = randomUUID();
  await db.insert(campaigns).values({
    ...body,
    id,
    code: String(body.code).toUpperCase(),
  } as typeof campaigns.$inferInsert);
  const [created] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  return reply.code(201).send({ data: created });
};

export const adminUpdate: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = req.body as Partial<typeof campaigns.$inferInsert>;
  if (body.code) body.code = String(body.code).toUpperCase();
  await db.update(campaigns).set(body).where(eq(campaigns.id, id));
  const [updated] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  if (!updated) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send({ data: updated });
};

export const adminDelete: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await db.delete(campaigns).where(eq(campaigns.id, id));
  return reply.code(204).send();
};
