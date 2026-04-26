// =============================================================
// FILE: src/modules/email-templates/schema.ts
// =============================================================
import {
  mysqlTable,
  char,
  varchar,
  text,
  datetime,
  tinyint,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/**
 * Parent tablo:
 * - template_key
 * - variables
 * - is_active
 * - timestamps
 */
export const emailTemplates = mysqlTable(
  "email_templates",
  {
    id: char("id", { length: 36 }).notNull().primaryKey(),

    template_key: varchar("template_key", { length: 100 }).notNull(),

    // JSON-string (string[]) | null
    variables: text("variables"),

    // 0/1
    is_active: tinyint("is_active").notNull().default(1),

    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    // Aynı key sadece bir parent kayıt
    uniqueIndex("ux_email_tpl_key").on(t.template_key),
    index("ix_email_tpl_active").on(t.is_active),
    index("ix_email_tpl_updated_at").on(t.updated_at),
  ],
);

/**
 * i18n tablo:
 * - template_name, subject, content
 * - locale
 */
export const emailTemplatesI18n = mysqlTable(
  "email_templates_i18n",
  {
    id: char("id", { length: 36 }).notNull().primaryKey(),
    template_id: char("template_id", { length: 36 }).notNull(),
    locale: varchar("locale", { length: 10 }).notNull(),

    template_name: varchar("template_name", { length: 150 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    content: text("content").notNull(),

    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    // Bir template için locale tekil olsun
    uniqueIndex("ux_email_tpl_key_locale").on(t.template_id, t.locale),
    index("ix_email_tpl_i18n_locale").on(t.locale),
    index("ix_email_tpl_i18n_name").on(t.template_name),
  ],
);

export type EmailTemplateRow = typeof emailTemplates.$inferSelect;
export type NewEmailTemplateRow = typeof emailTemplates.$inferInsert;

export type EmailTemplateI18nRow = typeof emailTemplatesI18n.$inferSelect;
export type NewEmailTemplateI18nRow = typeof emailTemplatesI18n.$inferInsert;
