// =============================================================
// FILE: src/modules/email-templates/controller.ts
// (public endpoints)
// =============================================================
import type { FastifyReply, FastifyRequest } from "fastify";
import { and, desc, eq, like, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { db } from "../../db/client";
import { emailTemplates, emailTemplatesI18n } from "./schema";
import {
  extractVariablesFromText,
  parseVariablesColumn,
  toBool,
  renderTextWithParams,
} from "./utils";
import { renderByKeySchema } from "./validation";
import { DEFAULT_LOCALE } from "../../core/i18n";
import { siteSettings } from "../siteSettings/schema";

type ListQuery = {
  locale?: string | null;
  is_active?: string | number | boolean;
  q?: string;
};

/** like() için NULL/undefined riskini sıfırlar (SQL'e çevirir) */
const safeText = (col: unknown) => sql<string>`COALESCE(${col as any}, '')`;

/* ------------------------------------------------------------------
   SITE NAME HELPER (site_settings → site_name)
   ------------------------------------------------------------------ */

let cachedSiteName: string | null = null;
let cachedSiteNameLoadedAt: number | null = null;

async function getSiteNameFromSettings(): Promise<string> {
  const now = Date.now();

  if (
    cachedSiteName &&
    cachedSiteNameLoadedAt &&
    now - cachedSiteNameLoadedAt < 5 * 60_000
  ) {
    return cachedSiteName;
  }

  const [titleRow] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, "site_title"))
    .limit(1);

  if (titleRow?.value) {
    cachedSiteName = String(titleRow.value);
    cachedSiteNameLoadedAt = now;
    return cachedSiteName;
  }

  const [companyRow] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, "footer_company_name"))
    .limit(1);

  if (companyRow?.value) {
    cachedSiteName = String(companyRow.value);
    cachedSiteNameLoadedAt = now;
    return cachedSiteName;
  }

  cachedSiteName = "Site";
  cachedSiteNameLoadedAt = now;
  return cachedSiteName;
}

async function enrichParamsWithSiteName(
  params: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (Object.prototype.hasOwnProperty.call(params, "site_name")) return params;

  const siteName = await getSiteNameFromSettings();
  return { ...params, site_name: siteName };
}

/* ------------------------------------------------------------------
   LIST (public)
   ------------------------------------------------------------------ */

export async function listEmailTemplatesPublic(
  req: FastifyRequest<{ Querystring: ListQuery }>,
  reply: FastifyReply,
) {
  try {
    const { locale, is_active, q } = req.query;

    const desiredLocale =
      (typeof locale === "string" && locale.length > 0
        ? locale
        : (req as any).locale || DEFAULT_LOCALE) ?? DEFAULT_LOCALE;

    const iReq = alias(emailTemplatesI18n, "eti_req");
    const iDef = alias(emailTemplatesI18n, "eti_def");

    const filters: SQL[] = [];

    // is_active filtresi
    if (typeof is_active !== "undefined") {
      filters.push(eq(emailTemplates.is_active, toBool(is_active) ? 1 : 0));
    } else {
      filters.push(eq(emailTemplates.is_active, 1));
    }

    // q filtresi
    if (q && q.trim().length > 0) {
      const qq = `%${q.trim()}%`;

      const search = or(
        like(emailTemplates.template_key, qq),
        like(safeText(iReq.template_name), qq),
        like(safeText(iDef.template_name), qq),
        like(safeText(iReq.subject), qq),
        like(safeText(iDef.subject), qq),
      );

      // ✅ or(...) -> SQL | undefined olabilir; sadece SQL ise ekle
      if (search) filters.push(search);
    }

    const baseQuery = db
      .select({
        id: emailTemplates.id,
        key: emailTemplates.template_key,
        is_active: emailTemplates.is_active,
        variables: emailTemplates.variables,
        template_name: sql<string>`
          COALESCE(${iReq.template_name}, ${iDef.template_name})
        `.as("template_name"),
        subject: sql<string>`
          COALESCE(${iReq.subject}, ${iDef.subject})
        `.as("subject"),
        content: sql<string>`
          COALESCE(${iReq.content}, ${iDef.content})
        `.as("content"),
        locale_resolved: sql<string>`
          CASE
            WHEN ${iReq.id} IS NOT NULL THEN ${iReq.locale}
            ELSE ${iDef.locale}
          END
        `.as("locale_resolved"),
        created_at: emailTemplates.created_at,
        updated_at: emailTemplates.updated_at,
      })
      .from(emailTemplates)
      .leftJoin(
        iReq,
        and(
          eq(iReq.template_id, emailTemplates.id),
          eq(iReq.locale, desiredLocale),
        ),
      )
      .leftJoin(
        iDef,
        and(
          eq(iDef.template_id, emailTemplates.id),
          eq(iDef.locale, DEFAULT_LOCALE),
        ),
      )
      .orderBy(desc(emailTemplates.updated_at));

    // ✅ and(...) da SQL | undefined olabilir; güvenli uygula
    const where = filters.length ? and(...filters) : undefined;
    const rows = await (where ? baseQuery.where(where) : baseQuery);

    const out = rows.map((r) => ({
      id: r.id,
      key: r.key,
      name: r.template_name,
      subject: r.subject,
      content_html: r.content,
      variables:
        parseVariablesColumn(r.variables) ??
        (r.content ? extractVariablesFromText(r.content) : []),
      is_active: toBool(r.is_active),
      locale: r.locale_resolved ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    return reply.send(out);
  } catch (e) {
    req.log.error(e);
    return reply
      .code(500)
      .send({ error: { message: "email_templates_list_failed" } });
  }
}

/** GET by key with locale preference (exact → DEFAULT_LOCALE fallback) */
export async function getEmailTemplateByKeyPublic(
  req: FastifyRequest<{
    Params: { key: string };
    Querystring: { locale?: string };
  }>,
  reply: FastifyReply,
) {
  try {
    const { key } = req.params;
    const desiredLocale =
      (req.query?.locale as string | undefined) ||
      (req as any).locale ||
      DEFAULT_LOCALE;

    const iReq = alias(emailTemplatesI18n, "eti_req");
    const iDef = alias(emailTemplatesI18n, "eti_def");

    const where = and(
      eq(emailTemplates.template_key, key),
      eq(emailTemplates.is_active, 1),
    );

    const rows = await db
      .select({
        id: emailTemplates.id,
        key: emailTemplates.template_key,
        is_active: emailTemplates.is_active,
        variables: emailTemplates.variables,
        template_name: sql<string>`
          COALESCE(${iReq.template_name}, ${iDef.template_name})
        `.as("template_name"),
        subject: sql<string>`
          COALESCE(${iReq.subject}, ${iDef.subject})
        `.as("subject"),
        content: sql<string>`
          COALESCE(${iReq.content}, ${iDef.content})
        `.as("content"),
        locale_resolved: sql<string>`
          CASE
            WHEN ${iReq.id} IS NOT NULL THEN ${iReq.locale}
            ELSE ${iDef.locale}
          END
        `.as("locale_resolved"),
        created_at: emailTemplates.created_at,
        updated_at: emailTemplates.updated_at,
      })
      .from(emailTemplates)
      .leftJoin(
        iReq,
        and(eq(iReq.template_id, emailTemplates.id), eq(iReq.locale, desiredLocale)),
      )
      .leftJoin(
        iDef,
        and(eq(iDef.template_id, emailTemplates.id), eq(iDef.locale, DEFAULT_LOCALE)),
      )
      .where(where)
      .limit(1);

    if (!rows.length) {
      return reply.code(404).send({ error: { message: "not_found" } });
    }

    const r = rows[0];

    return reply.send({
      id: r.id,
      key: r.key,
      name: r.template_name,
      subject: r.subject,
      content_html: r.content,
      variables:
        parseVariablesColumn(r.variables) ??
        (r.content ? extractVariablesFromText(r.content) : []),
      is_active: toBool(r.is_active),
      locale: r.locale_resolved ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    });
  } catch (e) {
    req.log.error(e);
    return reply
      .code(500)
      .send({ error: { message: "email_template_get_failed" } });
  }
}

/** POST /email_templates/by-key/:key/render  (public render helper) */
export async function renderTemplateByKeyPublic(
  req: FastifyRequest<{
    Params: { key: string };
    Body: { params?: Record<string, unknown> };
    Querystring: { locale?: string };
  }>,
  reply: FastifyReply,
) {
  try {
    const parsed = renderByKeySchema.parse({
      key: req.params.key,
      locale: req.query?.locale,
      params: req.body?.params ?? {},
    });

    const baseParams: Record<string, unknown> = parsed.params || {};
    const params = await enrichParamsWithSiteName(baseParams);

    const iReq = alias(emailTemplatesI18n, "eti_req");
    const iDef = alias(emailTemplatesI18n, "eti_def");

    const desiredLocale =
      (parsed.locale as string | null | undefined) ||
      (req as any).locale ||
      DEFAULT_LOCALE;

    const where = and(
      eq(emailTemplates.template_key, parsed.key),
      eq(emailTemplates.is_active, 1),
    );

    const rows = await db
      .select({
        id: emailTemplates.id,
        key: emailTemplates.template_key,
        is_active: emailTemplates.is_active,
        variables: emailTemplates.variables,
        template_name: sql<string>`
          COALESCE(${iReq.template_name}, ${iDef.template_name})
        `.as("template_name"),
        subjectTpl: sql<string>`
          COALESCE(${iReq.subject}, ${iDef.subject})
        `.as("subjectTpl"),
        contentTpl: sql<string>`
          COALESCE(${iReq.content}, ${iDef.content})
        `.as("contentTpl"),
        locale_resolved: sql<string>`
          CASE
            WHEN ${iReq.id} IS NOT NULL THEN ${iReq.locale}
            ELSE ${iDef.locale}
          END
        `.as("locale_resolved"),
        updated_at: emailTemplates.updated_at,
      })
      .from(emailTemplates)
      .leftJoin(
        iReq,
        and(eq(iReq.template_id, emailTemplates.id), eq(iReq.locale, desiredLocale)),
      )
      .leftJoin(
        iDef,
        and(eq(iDef.template_id, emailTemplates.id), eq(iDef.locale, DEFAULT_LOCALE)),
      )
      .where(where)
      .limit(1);

    if (!rows.length) {
      return reply.code(404).send({ error: { message: "not_found" } });
    }

    const row = rows[0];

    const subject = renderTextWithParams(row.subjectTpl ?? "", params);
    const body = renderTextWithParams(row.contentTpl ?? "", params);

    const required =
      parseVariablesColumn(row.variables) ??
      (row.contentTpl ? extractVariablesFromText(row.contentTpl) : []);

    const missing = required.filter((k) => !(k in (params || {})));

    return reply.send({
      id: row.id,
      key: row.key,
      name: row.template_name,
      subject,
      body,
      required_variables: required,
      missing_variables: missing,
      updated_at: row.updated_at,
      locale: row.locale_resolved ?? null,
    });
  } catch (e) {
    if ((e as any)?.name === "ZodError") {
      return reply.code(400).send({
        error: { message: "validation_error", details: (e as any).issues },
      });
    }
    req.log.error(e);
    return reply
      .code(500)
      .send({ error: { message: "email_template_render_failed" } });
  }
}
