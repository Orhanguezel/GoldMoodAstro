// =============================================================
// FILE: src/modules/bookings/schema.ts
// Randevu semasi
// resource_id → consultants tablosundaki consultant'ın resource kaydı
// =============================================================

import {
  mysqlTable, char, varchar, text, tinyint, datetime, index, foreignKey,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from '@goldmood/shared-backend/modules/auth/schema';

export const bookings = mysqlTable(
  'bookings',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),

    // Booking yapan kullanıcı (zorunlu — giriş yapılmış olmalı)
    user_id: char('user_id', { length: 36 }).notNull(),

    name: varchar('name', { length: 120 }).notNull(),
    email: varchar('email', { length: 190 }).notNull(),
    phone: varchar('phone', { length: 32 }).notNull(),
    locale: varchar('locale', { length: 10 }).notNull().default('tr'),
    customer_message: text('customer_message'),

    // Danışman — consultant modülündeki consultant.id (oluşturulacak)
    consultant_id: char('consultant_id', { length: 36 }).notNull(),

    // Ödeme bağlantısı (ödeme tamamlanınca dolar)
    order_id: char('order_id', { length: 36 }),

    // Danışmanın resource_id'si (availability sistemi için)
    service_id: char('service_id', { length: 36 }),
    resource_id: char('resource_id', { length: 36 }).notNull(),
    slot_id: char('slot_id', { length: 36 }),

    appointment_date: varchar('appointment_date', { length: 10 }).notNull(), // YYYY-MM-DD
    appointment_time: varchar('appointment_time', { length: 5 }),            // HH:mm

    // Oturum bilgisi (danışman profil ayarlarından kopyalanır)
    session_duration: tinyint('session_duration').notNull().default(30), // dakika
    session_price: varchar('session_price', { length: 12 }).notNull(),   // snapshot

    // Randevu durumu
    // pending_payment → booked → confirmed → completed | cancelled | no_show
    status: varchar('status', { length: 24 }).notNull().default('pending_payment'),
    is_read: tinyint('is_read', { unsigned: true }).notNull().default(0),

    customer_note: text('customer_note'),
    admin_note: text('admin_note'),
    decision_note: text('decision_note'),
    decided_by: varchar('decided_by', { length: 120 }),

    // Email takibi
    email_last_sent_at: datetime('email_last_sent_at', { fsp: 3 }),
    email_last_template_key: varchar('email_last_template_key', { length: 120 }),
    email_last_to: varchar('email_last_to', { length: 190 }),
    email_last_subject: varchar('email_last_subject', { length: 255 }),
    email_last_error: text('email_last_error'),

    // Hatırlatıcı gönderim takibi (cron)
    reminder_24h_sent: tinyint('reminder_24h_sent').notNull().default(0),
    reminder_2h_sent: tinyint('reminder_2h_sent').notNull().default(0),
    reminder_15m_sent: tinyint('reminder_15m_sent').notNull().default(0),

    decided_at: datetime('decided_at', { fsp: 3 }),

    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('bookings_user_idx').on(t.user_id),
    index('bookings_consultant_idx').on(t.consultant_id),
    index('bookings_resource_idx').on(t.resource_id),
    index('bookings_service_idx').on(t.service_id),
    index('bookings_slot_idx').on(t.slot_id),
    index('bookings_status_idx').on(t.status),
    index('bookings_date_idx').on(t.appointment_date),
    index('bookings_resource_date_idx').on(t.resource_id, t.appointment_date, t.appointment_time),
    foreignKey({
      columns: [t.user_id],
      foreignColumns: [users.id],
      name: 'fk_bookings_user',
    }).onDelete('cascade').onUpdate('cascade'),
  ],
);

export type BookingRow = typeof bookings.$inferSelect;
export type NewBookingRow = typeof bookings.$inferInsert;
