import {
  mysqlTable,
  char,
  varchar,
  text,
  json,
  int,
  mysqlEnum,
  datetime,
  index,
  foreignKey,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from '../auth/schema';

export const consultantApplications = mysqlTable(
  'consultant_applications',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    user_id: char('user_id', { length: 36 }),
    email: varchar('email', { length: 255 }).notNull(),
    full_name: varchar('full_name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 40 }),
    bio: text('bio'),
    expertise: json('expertise').$type<string[]>(),
    languages: json('languages').$type<string[]>(),
    experience_years: int('experience_years'),
    certifications: text('certifications'),
    cv_url: varchar('cv_url', { length: 500 }),
    sample_chart_url: varchar('sample_chart_url', { length: 500 }),
    status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending'),
    rejection_reason: text('rejection_reason'),
    reviewed_by: char('reviewed_by', { length: 36 }),
    reviewed_at: datetime('reviewed_at', { fsp: 3 }),
    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('idx_status').on(t.status),
    index('idx_email').on(t.email),
    foreignKey({
      columns: [t.user_id],
      foreignColumns: [users.id],
      name: 'fk_app_user',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
    foreignKey({
      columns: [t.reviewed_by],
      foreignColumns: [users.id],
      name: 'fk_app_reviewer',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  ],
);

export type ConsultantApplication = typeof consultantApplications.$inferSelect;
export type NewConsultantApplication = typeof consultantApplications.$inferInsert;
