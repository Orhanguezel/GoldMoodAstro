import {
  mysqlTable,
  char,
  varchar,
  text,
  json,
  decimal,
  int,
  mysqlEnum,
  tinyint,
  datetime,
  index,
  uniqueIndex,
  foreignKey,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from '@goldmood/shared-backend/modules/auth/schema';

export const consultants = mysqlTable(
  'consultants',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    user_id: char('user_id', { length: 36 }).notNull(),
    slug: varchar('slug', { length: 100 }),
    bio: text('bio'),
    expertise: json('expertise').$type<string[]>(),
    languages: json('languages').$type<string[]>(),
    meeting_platforms: json('meeting_platforms').$type<string[]>(),
    social_links: json('social_links').$type<Record<string, string>>(),
    bank_name: varchar('bank_name', { length: 120 }),
    bank_iban: varchar('bank_iban', { length: 64 }),
    bank_account_holder: varchar('bank_account_holder', { length: 160 }),
    account_type: mysqlEnum('account_type', ['individual', 'company']),
    identity_number: varchar('identity_number', { length: 11 }),
    tax_number: varchar('tax_number', { length: 11 }),
    tax_office: varchar('tax_office', { length: 120 }),
    company_name: varchar('company_name', { length: 200 }),
    billing_address: text('billing_address'),
    kyc_status: mysqlEnum('kyc_status', ['none', 'pending', 'approved', 'rejected']).default('none'),
    kyc_submitted_at: datetime('kyc_submitted_at', { fsp: 3 }),
    kyc_reviewed_at: datetime('kyc_reviewed_at', { fsp: 3 }),
    kyc_rejection_reason: text('kyc_rejection_reason'),
    kyc_documents: json('kyc_documents').$type<Array<Record<string, unknown>>>(),
    agreement_accepted_at: datetime('agreement_accepted_at', { fsp: 3 }),
    commission_change_announcement_sent_at: datetime('commission_change_announcement_sent_at', { fsp: 3 }),
    session_price: decimal('session_price', { precision: 10, scale: 2 }).notNull(),
    session_duration: int('session_duration').notNull().default(30),
    supports_video: tinyint('supports_video').default(0),
    video_session_price: decimal('video_session_price', { precision: 10, scale: 2 }),
    currency: char('currency', { length: 3 }).default('TRY'),
    approval_status: mysqlEnum('approval_status', ['pending', 'approved', 'rejected']).default(
      'pending',
    ),
    rejection_reason: text('rejection_reason'),
    is_available: tinyint('is_available').default(1),
    rating_avg: decimal('rating_avg', { precision: 3, scale: 2 }).default('0.00'),
    rating_count: int('rating_count').default(0),
    total_sessions: int('total_sessions').default(0),
    created_at: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: datetime('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('consultants_user_id_unique').on(t.user_id),
    uniqueIndex('consultants_slug_unique').on(t.slug),
    index('consultants_approval_idx').on(t.approval_status),
    index('consultants_available_idx').on(t.is_available),
    foreignKey({
      columns: [t.user_id],
      foreignColumns: [users.id],
      name: 'fk_consultants_user',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

export const consultantI18n = mysqlTable(
  'consultant_i18n',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    consultant_id: char('consultant_id', { length: 36 }).notNull(),
    locale: char('locale', { length: 8 }).notNull(),
    headline: varchar('headline', { length: 255 }),
    bio: text('bio'),
    created_at: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: datetime('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('ux_consultant_i18n_consultant_locale').on(t.consultant_id, t.locale),
    index('consultant_i18n_locale_idx').on(t.locale),
    foreignKey({
      columns: [t.consultant_id],
      foreignColumns: [consultants.id],
      name: 'fk_consultant_i18n_consultant',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

export type ConsultantRow = typeof consultants.$inferSelect;
export type NewConsultantRow = typeof consultants.$inferInsert;
export type ConsultantI18nRow = typeof consultantI18n.$inferSelect;
export type NewConsultantI18nRow = typeof consultantI18n.$inferInsert;
