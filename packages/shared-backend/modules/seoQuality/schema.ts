import { sql } from 'drizzle-orm';
import {
  char,
  datetime,
  index,
  int,
  json,
  mysqlTable,
  tinyint,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

export const seoQualityScores = mysqlTable(
  'seo_quality_scores',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    entity_type: varchar('entity_type', { length: 24 }).notNull(),
    entity_id: varchar('entity_id', { length: 191 }).notNull(),
    locale: varchar('locale', { length: 8 }).notNull(),
    url: varchar('url', { length: 512 }),
    meta_score: tinyint('meta_score').notNull().default(0),
    content_score: tinyint('content_score').notNull().default(0),
    heading_score: tinyint('heading_score').notNull().default(0),
    media_score: tinyint('media_score').notNull().default(0),
    schema_score: tinyint('schema_score').notNull().default(0),
    link_score: tinyint('link_score').notNull().default(0),
    overall_score: tinyint('overall_score').notNull().default(0),
    word_count: int('word_count').notNull().default(0),
    heading_count: int('heading_count').notNull().default(0),
    image_count: int('image_count').notNull().default(0),
    has_meta_title: tinyint('has_meta_title').notNull().default(0),
    has_meta_description: tinyint('has_meta_description').notNull().default(0),
    has_h1: tinyint('has_h1').notNull().default(0),
    has_schema: tinyint('has_schema').notNull().default(0),
    is_thin_content: tinyint('is_thin_content').notNull().default(0),
    adsense_ready: tinyint('adsense_ready').notNull().default(0),
    index_ready: tinyint('index_ready').notNull().default(0),
    breakdown: json('breakdown').$type<unknown[]>(),
    calculated_at: datetime('calculated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex('seo_quality_entity_uq').on(t.entity_type, t.entity_id, t.locale),
    index('seo_quality_overall_idx').on(t.overall_score),
    index('seo_quality_type_idx').on(t.entity_type),
    index('seo_quality_adsense_idx').on(t.adsense_ready),
  ],
);

export type SeoQualityScoreRow = typeof seoQualityScores.$inferSelect;
export type NewSeoQualityScoreRow = typeof seoQualityScores.$inferInsert;
