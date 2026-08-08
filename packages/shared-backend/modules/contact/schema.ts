// =============================================================
// FILE: src/modules/contact/schema.ts
// =============================================================
import {
  mysqlTable,
  char,
  varchar,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/mysql-core";

export const contact_messages = mysqlTable(
  "contact_messages",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 64 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    message: text("message").notNull(),

    status: varchar("status", { length: 32 }).notNull().default("new"), // 'new' | 'in_progress' | 'closed'
    is_resolved: boolean("is_resolved").notNull().default(false),

    admin_note: varchar("admin_note", { length: 2000 }),

    // meta
    ip: varchar("ip", { length: 64 }),
    user_agent: varchar("user_agent", { length: 512 }),

    // antispam
    website: varchar("website", { length: 255 }),

    created_at: timestamp("created_at", { fsp: 3 }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { fsp: 3 }).notNull().defaultNow().onUpdateNow(),
  },
  (t) => [
    index("idx_contact_created_at").on(t.created_at),
    index("idx_contact_status").on(t.status),
    index("idx_contact_resolved").on(t.is_resolved),
  ],
);

export type ContactRow = typeof contact_messages.$inferSelect;
export type ContactInsert = typeof contact_messages.$inferInsert;

// Şimdilik ekstra projection yok, direkt row'u view gibi kullanıyoruz
export type ContactView = ContactRow;

// Admin'in iletişim mesajına gönderdiği yanıtlar (e-posta ile gider + burada kayıt).
// Böylece admin "gönderdiğini sitede görür" ve mesajlaşma iki yönlü olur.
export const contact_replies = mysqlTable(
  "contact_replies",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    contact_id: char("contact_id", { length: 36 }).notNull(),
    message: text("message").notNull(),
    admin_user_id: char("admin_user_id", { length: 36 }),
    channel: varchar("channel", { length: 20 }).notNull().default("email"),
    // 'outbound' = admin yanıtı (e-posta gönderildi), 'inbound' = kullanıcının e-posta yanıtı (IMAP ile alındı)
    direction: varchar("direction", { length: 10 }).notNull().default("outbound"),
    from_email: varchar("from_email", { length: 255 }),
    // dedup + threading: giden yanıtta nodemailer messageId, gelen yanıtta e-posta Message-ID
    email_message_id: varchar("email_message_id", { length: 998 }),
    email_status: varchar("email_status", { length: 20 }).notNull().default("sent"), // sent | failed
    created_at: timestamp("created_at", { fsp: 3 }).notNull().defaultNow(),
  },
  (t) => [index("idx_contact_replies_contact").on(t.contact_id)],
);

export type ContactReplyRow = typeof contact_replies.$inferSelect;
