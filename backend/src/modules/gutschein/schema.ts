// src/modules/gutschein/schema.ts
import {
  mysqlTable,
  char,
  varchar,
  decimal,
  mysqlEnum,
  datetime,
  tinyint,
  int,
  text,
  index,
  foreignKey,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from '@vps/shared-backend/modules/auth/schema';

// ── 1. Gutschein Products (Vorlagen / Wertklassen) ───────────────────────────
export const gutscheinProducts = mysqlTable(
  'gutschein_products',
  {
    id:            char('id', { length: 36 }).primaryKey().notNull(),
    name:          varchar('name', { length: 255 }).notNull(),
    value:         decimal('value', { precision: 10, scale: 2 }).notNull(),
    currency:      varchar('currency', { length: 10 }).notNull().default('EUR'),
    validity_days: int('validity_days').notNull().default(365),
    description:   text('description'),
    is_active:     tinyint('is_active').notNull().default(1),
    display_order: int('display_order').notNull().default(0),
    created_at:    datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at:    datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('gutschein_products_active_order_idx').on(t.is_active, t.display_order),
  ],
);

// ── 2. Individual Gift Cards ─────────────────────────────────────────────────
export const gutscheins = mysqlTable(
  'gutscheins',
  {
    id:   char('id', { length: 36 }).primaryKey().notNull(),
    code: varchar('code', { length: 30 }).notNull(), // e.g. KM-ABCD-EFGH

    product_id: char('product_id', { length: 36 }), // null für manuell erstellte
    value:      decimal('value', { precision: 10, scale: 2 }).notNull(),
    currency:   varchar('currency', { length: 10 }).notNull().default('EUR'),

    status: mysqlEnum('status', ['pending', 'active', 'redeemed', 'expired', 'cancelled'])
      .notNull()
      .default('pending'),

    // ── Käufer ───────────────────────────────────────────────────────────────
    purchaser_user_id: char('purchaser_user_id', { length: 36 }),
    purchaser_email:   varchar('purchaser_email', { length: 255 }).notNull(),
    purchaser_name:    varchar('purchaser_name', { length: 255 }).notNull(),

    // ── Empfänger ────────────────────────────────────────────────────────────
    recipient_email:    varchar('recipient_email', { length: 255 }),
    recipient_name:     varchar('recipient_name', { length: 255 }),
    personal_message:   text('personal_message'),

    // ── Lebenszyklus ─────────────────────────────────────────────────────────
    issued_at:  datetime('issued_at', { fsp: 3 }),
    expires_at: datetime('expires_at', { fsp: 3 }),

    redeemed_at:           datetime('redeemed_at', { fsp: 3 }),
    redeemed_by_user_id:   char('redeemed_by_user_id', { length: 36 }),
    redeemed_booking_id:   char('redeemed_booking_id', { length: 36 }),

    // ── Zahlung ──────────────────────────────────────────────────────────────
    payment_status:         mysqlEnum('payment_status', ['pending', 'paid', 'failed', 'refunded'])
      .notNull()
      .default('pending'),
    payment_transaction_id: varchar('payment_transaction_id', { length: 255 }),
    order_ref:              varchar('order_ref', { length: 100 }), // Bestellnummer (kein FK)

    // ── Admin ────────────────────────────────────────────────────────────────
    is_admin_created: tinyint('is_admin_created').notNull().default(0),
    admin_note:       text('admin_note'),

    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('gutscheins_code_unique').on(t.code),
    index('gutscheins_status_idx').on(t.status),
    index('gutscheins_purchaser_email_idx').on(t.purchaser_email),
    index('gutscheins_purchaser_user_id_idx').on(t.purchaser_user_id),
    index('gutscheins_expires_at_idx').on(t.expires_at),
    foreignKey({
      columns: [t.product_id],
      foreignColumns: [gutscheinProducts.id],
      name: 'fk_gutscheins_product',
    }).onDelete('set null').onUpdate('cascade'),
    foreignKey({
      columns: [t.purchaser_user_id],
      foreignColumns: [users.id],
      name: 'fk_gutscheins_purchaser',
    }).onDelete('set null').onUpdate('cascade'),
    foreignKey({
      columns: [t.redeemed_by_user_id],
      foreignColumns: [users.id],
      name: 'fk_gutscheins_redeemer',
    }).onDelete('set null').onUpdate('cascade'),
  ],
);

export type GutscheinProduct = typeof gutscheinProducts.$inferSelect;
export type NewGutscheinProduct = typeof gutscheinProducts.$inferInsert;
export type Gutschein = typeof gutscheins.$inferSelect;
export type NewGutschein = typeof gutscheins.$inferInsert;
