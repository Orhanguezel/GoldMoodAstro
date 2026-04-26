// =============================================================
// FILE: src/modules/email-templates/service.ts
// =============================================================
import { and, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { db } from "../../db/client";
import {
  emailTemplates,
  emailTemplatesI18n,
  type EmailTemplateRow,
} from "./schema";
import {
  extractVariablesFromText,
  parseVariablesColumn,
  renderTextWithParams,
} from "./utils";
import { DEFAULT_LOCALE, normalizeLocale } from "../../core/i18n";
import { getDefaultLocale as getDefaultLocaleFromSettings } from '../_shared';

// Render sonucu FE/BE tarafında kullanılabilir
export interface RenderedEmailTemplate {
  template: EmailTemplateRow;
  subject: string;
  html: string;
  required_variables: string[];
  missing_variables: string[];
  locale_resolved: string | null;
}

/**
 * DB'den template'i (key + locale) bulur, params ile render eder.
 *  - Önce istenen locale satırı (email_templates_i18n)
 *  - Bulamazsa DEFAULT_LOCALE satırı
 *  - Parent kaydın is_active = 1 olması zorunlu
 */
export async function renderEmailTemplateByKey(
  key: string,
  params: Record<string, unknown> = {},
  locale?: string | null,
  defaultLocale?: string | null,
): Promise<RenderedEmailTemplate | null> {
  const iReq = alias(emailTemplatesI18n, "eti_req");
  const iDef = alias(emailTemplatesI18n, "eti_def");

  const defLocale =
    normalizeLocale(defaultLocale) ||
    (defaultLocale ? String(defaultLocale).trim() : "") ||
    (await getDefaultLocaleFromSettings()) ||
    DEFAULT_LOCALE;

  const desiredLocale =
    normalizeLocale(locale) || (locale ? String(locale).trim() : "") || defLocale;

  const rows = await db
    .select({
      template: emailTemplates,
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
        eq(iDef.locale, defLocale),
      ),
    )
    .where(
      and(eq(emailTemplates.template_key, key), eq(emailTemplates.is_active, 1)),
    )
    .limit(1);

  if (!rows.length) return null;

  const row = rows[0] as any;
  const template = row.template as EmailTemplateRow;

  const subjectTpl: string = row.subject ?? "";
  const contentTpl: string = row.content ?? "";
  const localeResolved: string | null = row.locale_resolved ?? null;

  const subject = renderTextWithParams(subjectTpl, params);
  const html = renderTextWithParams(contentTpl, params);

  const required =
    parseVariablesColumn(template.variables as any) ??
    extractVariablesFromText(contentTpl);

  const missing = required.filter((k) => !(k in (params || {})));

  return {
    template,
    subject,
    html,
    required_variables: required,
    missing_variables: missing,
    locale_resolved: localeResolved,
  };
}
