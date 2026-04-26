// src/modules/availability/schema.ts
// =============================================================
// FINAL — Availability schema (working hours + slots + reservations)
// =============================================================

import {
  mysqlTable,
  char,
  tinyint,
  int,
  datetime,
  date,
  time,
  uniqueIndex,
  index,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const resourceWorkingHours = mysqlTable(
  'resource_working_hours',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    resource_id: char('resource_id', { length: 36 }).notNull(),
    dow: tinyint('dow', { unsigned: true }).notNull(), // 1..7

    start_time: time('start_time').notNull(),
    end_time: time('end_time').notNull(),

    slot_minutes: int('slot_minutes').notNull().default(60),
    break_minutes: int('break_minutes').notNull().default(0),
    capacity: int('capacity').notNull().default(1),

    is_active: tinyint('is_active', { unsigned: true }).notNull().default(1),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('rwh_resource_idx').on(t.resource_id),
    index('rwh_dow_idx').on(t.dow),
    index('rwh_active_idx').on(t.is_active),
    uniqueIndex('ux_rwh_unique').on(t.resource_id, t.dow, t.start_time, t.end_time),
  ],
);

export type ResourceWorkingHourRow = typeof resourceWorkingHours.$inferSelect;
export type NewResourceWorkingHourRow = typeof resourceWorkingHours.$inferInsert;

export const resourceSlots = mysqlTable(
  'resource_slots',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    resource_id: char('resource_id', { length: 36 }).notNull(),
    slot_date: date('slot_date').notNull(),
    slot_time: time('slot_time').notNull(),

    capacity: int('capacity').notNull().default(1),
    is_active: tinyint('is_active', { unsigned: true }).notNull().default(1),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('ux_resource_slots_unique').on(t.resource_id, t.slot_date, t.slot_time),
    index('rs_resource_idx').on(t.resource_id),
    index('rs_date_idx').on(t.slot_date),
    index('rs_active_idx').on(t.is_active),
  ],
);

export type ResourceSlotRow = typeof resourceSlots.$inferSelect;
export type NewResourceSlotRow = typeof resourceSlots.$inferInsert;

export const slotReservations = mysqlTable(
  'slot_reservations',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    slot_id: char('slot_id', { length: 36 }).notNull(),
    reserved_count: int('reserved_count').notNull().default(0),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('ux_slot_res_unique').on(t.slot_id),
    index('slot_res_slot_idx').on(t.slot_id),
  ],
);

export type SlotReservationRow = typeof slotReservations.$inferSelect;
export type NewSlotReservationRow = typeof slotReservations.$inferInsert;
