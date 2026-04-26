import {
  mysqlTable, char, varchar, decimal, text, datetime, index, foreignKey, tinyint,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { users } from "@goldmood/shared-backend/modules/auth/schema";

// Payment Gateways (Iyzipay config stored here)
export const paymentGateways = mysqlTable(
  "payment_gateways",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    is_active: tinyint("is_active").notNull().default(1),
    is_test_mode: tinyint("is_test_mode").notNull().default(1),
    config: text("config"), // JSON: api_key, secret_key etc.
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [index("payment_gateways_slug_unique").on(t.slug)],
);

// User Addresses (required by Iyzipay billing)
export const userAddresses = mysqlTable(
  "user_addresses",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    user_id: char("user_id", { length: 36 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    full_name: varchar("full_name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    email: varchar("email", { length: 255 }),
    address_line: text("address_line").notNull(),
    city: varchar("city", { length: 128 }).notNull(),
    district: varchar("district", { length: 128 }).notNull(),
    postal_code: varchar("postal_code", { length: 32 }),
    is_default: tinyint("is_default").notNull().default(0),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("user_addresses_user_id_idx").on(t.user_id),
    foreignKey({
      columns: [t.user_id],
      foreignColumns: [users.id],
      name: "fk_user_addresses_user",
    }).onDelete("cascade").onUpdate("cascade"),
  ],
);

// Orders — one order per booking session
export const orders = mysqlTable(
  "orders",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    user_id: char("user_id", { length: 36 }).notNull(),
    booking_id: char("booking_id", { length: 36 }),
    order_number: varchar("order_number", { length: 50 }).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    total_amount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("TRY"),
    billing_address_id: char("billing_address_id", { length: 36 }),
    payment_gateway_id: char("payment_gateway_id", { length: 36 }),
    payment_status: varchar("payment_status", { length: 50 }).notNull().default("unpaid"),
    notes: text("notes"),
    transaction_id: varchar("transaction_id", { length: 255 }),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("orders_number_unique").on(t.order_number),
    index("orders_user_id_idx").on(t.user_id),
    index("orders_booking_idx").on(t.booking_id),
    foreignKey({
      columns: [t.user_id],
      foreignColumns: [users.id],
      name: "fk_orders_user",
    }).onDelete("cascade").onUpdate("cascade"),
    foreignKey({
      columns: [t.payment_gateway_id],
      foreignColumns: [paymentGateways.id],
      name: "fk_orders_gateway",
    }).onDelete("set null").onUpdate("cascade"),
  ],
);

// Payments — Iyzipay transaction records
export const payments = mysqlTable(
  "payments",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    order_id: char("order_id", { length: 36 }).notNull(),
    gateway_id: char("gateway_id", { length: 36 }).notNull(),
    transaction_id: varchar("transaction_id", { length: 255 }),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("TRY"),
    status: varchar("status", { length: 50 }).notNull(),
    raw_response: text("raw_response"), // JSON
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("payments_order_id_idx").on(t.order_id),
    foreignKey({
      columns: [t.order_id],
      foreignColumns: [orders.id],
      name: "fk_payments_order",
    }).onDelete("cascade").onUpdate("cascade"),
    foreignKey({
      columns: [t.gateway_id],
      foreignColumns: [paymentGateways.id],
      name: "fk_payments_gateway",
    }).onDelete("cascade").onUpdate("cascade"),
  ],
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Payment = typeof payments.$inferSelect;
