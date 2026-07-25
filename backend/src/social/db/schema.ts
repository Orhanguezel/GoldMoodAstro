import {
  mysqlTable,
  int,
  varchar,
  text,
  datetime,
  tinyint,
  mysqlEnum,
  char,
  decimal,
  date,
  json,
  bigint,
  uniqueIndex,
  index,
  foreignKey,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// ─── storage_assets (inline — @sosial/shared-backend bagimliligi olmadan) ──────
export const storageAssets = mysqlTable(
  "storage_assets",
  {
    id: char("id", { length: 36 }).notNull().primaryKey(),
    user_id: char("user_id", { length: 36 }),
    name: varchar("name", { length: 255 }).notNull(),
    bucket: varchar("bucket", { length: 64 }).notNull(),
    path: varchar("path", { length: 512 }).notNull(),
    folder: varchar("folder", { length: 255 }),
    mime: varchar("mime", { length: 127 }).notNull(),
    size: bigint("size", { mode: "number", unsigned: true }).notNull(),
    width: int("width", { unsigned: true }),
    height: int("height", { unsigned: true }),
    url: text("url"),
    hash: varchar("hash", { length: 64 }),
    provider: varchar("provider", { length: 16 }).notNull().default("cloudinary"),
    provider_id: varchar("provider_id", { length: 255 }),
    provider_public_id: varchar("provider_public_id", { length: 255 }),
    provider_resource_type: varchar("provider_resource_type", { length: 16 }),
    provider_format: varchar("provider_format", { length: 32 }),
    provider_version: int("provider_version", { unsigned: true }),
    etag: varchar("etag", { length: 64 }),
    metadata: json("metadata").$type<Record<string, string> | null>().default(null),
    created_at: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
    ),
  },
  (t) => [
    index("storage_assets_bucket_idx").on(t.bucket),
    index("storage_assets_provider_idx").on(t.provider),
  ]
);

// ─── site_settings (inline — @sosial/shared-backend bagimliligi olmadan) ───────
export const siteSettings = mysqlTable(
  "site_settings",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    key: varchar("key", { length: 100 }).notNull(),
    locale: varchar("locale", { length: 8 }).notNull(),
    value: text("value").notNull(),
    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("site_settings_key_locale_uq").on(t.key, t.locale),
    index("site_settings_key_idx").on(t.key),
    index("site_settings_locale_idx").on(t.locale),
  ]
);

// ─── x_api_usage ────────────────────────────────────────────
export const xApiUsage = mysqlTable(
  "x_api_usage",
  {
    id: int("id").autoincrement().primaryKey(),
    usageMonth: char("usage_month", { length: 7 }).notNull(),
    operation: mysqlEnum("operation", ["write", "read"]).notNull(),
    count: int("count").notNull().default(0),
    createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime("updated_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
    ),
  },
  (table) => [
    uniqueIndex("uk_x_api_usage_month_operation").on(table.usageMonth, table.operation),
  ]
);

// ─── social_posts ───────────────────────────────────────────
export const socialPosts = mysqlTable(
  "social_posts",
  {
    id: int("id").autoincrement().primaryKey(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    // Icerik
    postType: mysqlEnum("post_type", [
      "haber",
      "etkilesim",
      "ilan",
      "nostalji",
      "tanitim",
      "kampanya",
    ]).notNull(),
    // subType = tenantKey olarak kullanilir (geriye donuk uyumluluk)
    subType: varchar("sub_type", { length: 50 }),
    title: varchar("title", { length: 255 }),
    caption: text("caption").notNull(),
    hashtags: varchar("hashtags", { length: 500 }),
    imageUrl: varchar("image_url", { length: 1000 }),
    imageLocal: varchar("image_local", { length: 500 }),
    linkUrl: varchar("link_url", { length: 1000 }),
    linkText: varchar("link_text", { length: 255 }),

    // Platform
    platform: mysqlEnum("platform", [
      "facebook",
      "instagram",
      "both",
      "linkedin",
      "x",
      "telegram",
      "all",
      "youtube",
    ])
      .notNull()
      .default("both"),
    fbPageId: varchar("fb_page_id", { length: 100 }),
    igAccountId: varchar("ig_account_id", { length: 100 }),

    // Zamanlama
    scheduledAt: datetime("scheduled_at"),
    postedAt: datetime("posted_at"),
    status: mysqlEnum("status", [
      "draft",
      "scheduled",
      "publishing",
      "manual_pending",
      "posted",
      "failed",
      "cancelled",
    ])
      .notNull()
      .default("draft"),
    errorMessage: varchar("error_message", { length: 1000 }),

    // Platform yanitlari
    fbPostId: varchar("fb_post_id", { length: 255 }),
    igMediaId: varchar("ig_media_id", { length: 255 }),
    xTweetId: varchar("x_tweet_id", { length: 64 }),
    youtubeVideoId: varchar("youtube_video_id", { length: 64 }),
    postproxyPostId: varchar("postproxy_post_id", { length: 64 }),
    xThreadGroup: char("x_thread_group", { length: 36 }),
    xThreadOrder: int("x_thread_order"),
    xReplyToTweetId: varchar("x_reply_to_tweet_id", { length: 64 }),
    mediaUrls: json("media_urls").$type<string[] | null>(),
    autoEditJobId: varchar("auto_edit_job_id", { length: 64 }),
    autoEditStatus: mysqlEnum("auto_edit_status", [
      "queued",
      "processing",
      "done",
      "failed",
      "approved",
    ]),
    autoEditTranscript: text("auto_edit_transcript"),
    autoEditSegments: json("auto_edit_segments").$type<unknown[] | null>(),
    autoEditError: text("auto_edit_error"),

    // Kaynak
    sourceType: mysqlEnum("source_type", ["manual", "news", "ai", "template"])
      .notNull()
      .default("manual"),
    sourceRef: varchar("source_ref", { length: 255 }),

    // AI
    aiGenerated: tinyint("ai_generated").default(0),
    aiModel: varchar("ai_model", { length: 100 }),
    aiPromptUsed: text("ai_prompt_used"),

    // Meta
    createdBy: varchar("created_by", { length: 100 }).default("system"),
    notes: text("notes"),
    createdAt: datetime("created_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3)`
    ),
    updatedAt: datetime("updated_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
    ),
  },
  (table) => [
    index("idx_status").on(table.status),
    index("idx_scheduled").on(table.scheduledAt),
    index("idx_platform").on(table.platform),
    index("idx_post_type").on(table.postType),
    index("idx_source").on(table.sourceType),
    index("idx_youtube_video_id").on(table.youtubeVideoId),
    index("idx_x_thread").on(table.xThreadGroup),
  ]
);

// ─── content_templates ──────────────────────────────────────
export const contentTemplates = mysqlTable(
  "content_templates",
  {
    id: int("id").autoincrement().primaryKey(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    tenantKey: varchar("tenant_key", { length: 100 }),
    name: varchar("name", { length: 255 }).notNull(),
    postType: mysqlEnum("post_type", [
      "haber",
      "etkilesim",
      "ilan",
      "nostalji",
      "tanitim",
      "kampanya",
    ]).notNull(),
    platform: mysqlEnum("platform", [
      "facebook",
      "instagram",
      "both",
      "linkedin",
      "x",
      "telegram",
      "all",
      "youtube",
    ])
      .notNull()
      .default("both"),

    captionTemplate: text("caption_template").notNull(),
    hashtags: varchar("hashtags", { length: 500 }),
    imagePrompt: varchar("image_prompt", { length: 500 }),
    variables: json("variables"),

    isActive: tinyint("is_active").default(1),
    usageCount: int("usage_count").default(0),
    lastUsedAt: datetime("last_used_at"),

    createdAt: datetime("created_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3)`
    ),
    updatedAt: datetime("updated_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
    ),
  },
  (table) => [
    index("idx_type").on(table.postType),
    index("idx_active").on(table.isActive),
    index("idx_tmpl_tenant").on(table.tenantKey),
  ]
);

// ─── campaign_calendar ──────────────────────────────────────
export const campaignCalendar = mysqlTable(
  "campaign_calendar",
  {
    id: int("id").autoincrement().primaryKey(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    tenantKey: varchar("tenant_key", { length: 100 }).notNull().default("default"),
    date: date("date").notNull(),
    timeSlot: mysqlEnum("time_slot", ["morning", "afternoon", "evening"])
      .notNull()
      .default("morning"),

    postType: mysqlEnum("post_type", [
      "haber",
      "etkilesim",
      "ilan",
      "nostalji",
      "tanitim",
      "kampanya",
    ]).notNull(),
    platform: mysqlEnum("platform", [
      "facebook",
      "instagram",
      "both",
      "linkedin",
      "x",
      "telegram",
      "all",
      "youtube",
    ])
      .notNull()
      .default("both"),
    notes: text("notes"),
    templateId: int("template_id").references(() => contentTemplates.id, {
      onDelete: "set null",
    }),

    postId: int("post_id").references(() => socialPosts.id, {
      onDelete: "set null",
    }),
    status: mysqlEnum("status", [
      "planned",
      "content_ready",
      "scheduled",
      "published",
      "skipped",
    ]).default("planned"),

    createdAt: datetime("created_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3)`
    ),
    updatedAt: datetime("updated_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
    ),
  },
  (table) => [
    index("idx_date").on(table.date),
    index("idx_cal_status").on(table.status),
    index("idx_cal_tenant").on(table.tenantKey),
    // tenant dahil edildi — farkli tenant'lar ayni tarih/slot/platform planlayabilir
    uniqueIndex("uk_tenant_date_slot").on(table.tenantKey, table.date, table.timeSlot, table.platform),
  ]
);

// ─── post_analytics ─────────────────────────────────────────
export const postAnalytics = mysqlTable(
  "post_analytics",
  {
    id: int("id").autoincrement().primaryKey(),

    postId: int("post_id")
      .notNull()
      .references(() => socialPosts.id, { onDelete: "cascade" }),
    platform: mysqlEnum("platform", ["facebook", "instagram", "x", "youtube"]).notNull(),

    likes: int("likes").default(0),
    comments: int("comments").default(0),
    shares: int("shares").default(0),
    saves: int("saves").default(0),
    reach: int("reach").default(0),
    impressions: int("impressions").default(0),
    clicks: int("clicks").default(0),
    engagementRate: decimal("engagement_rate", {
      precision: 5,
      scale: 2,
    }).default("0"),

    fetchedAt: datetime("fetched_at", { fsp: 3 }).notNull(),
  },
  (table) => [
    index("idx_post").on(table.postId),
    index("idx_analytics_platform").on(table.platform),
    index("idx_fetched").on(table.fetchedAt),
  ]
);

// ─── post_comments ──────────────────────────────────────────
export const postComments = mysqlTable(
  "post_comments",
  {
    id: int("id").autoincrement().primaryKey(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    postId: int("post_id")
      .notNull()
      .references(() => socialPosts.id, { onDelete: "cascade" }),
    platform: mysqlEnum("platform", ["facebook", "instagram", "x"]).notNull(),
    externalCommentId: varchar("external_comment_id", { length: 255 }).notNull(),
    parentCommentId: varchar("parent_comment_id", { length: 255 }),

    authorName: varchar("author_name", { length: 255 }),
    authorId: varchar("author_id", { length: 255 }),
    message: text("message").notNull(),
    aiReplyDraft: text("ai_reply_draft"),
    aiReplyStatus: mysqlEnum("ai_reply_status", ["pending", "approved", "rejected", "sent"]),
    aiReplyModel: varchar("ai_reply_model", { length: 100 }),
    aiReplyProvider: varchar("ai_reply_provider", { length: 100 }),
    aiRepliedTweetId: varchar("ai_replied_tweet_id", { length: 64 }),
    likeCount: int("like_count").default(0),
    createdTime: datetime("created_time", { fsp: 3 }),
    fetchedAt: datetime("fetched_at", { fsp: 3 }).notNull(),

    createdAt: datetime("created_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3)`
    ),
    updatedAt: datetime("updated_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
    ),
  },
  (table) => [
    uniqueIndex("uk_post_platform_comment").on(
      table.postId,
      table.platform,
      table.externalCommentId,
    ),
    index("idx_comment_post").on(table.postId),
    index("idx_comment_platform").on(table.platform),
    index("idx_comment_created").on(table.createdTime),
  ]
);

// ─── platform_accounts ──────────────────────────────────────
export const platformAccounts = mysqlTable(
  "platform_accounts",
  {
    id: int("id").autoincrement().primaryKey(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    platform: mysqlEnum("platform", [
      "facebook",
      "instagram",
      "telegram",
      "linkedin",
      "x",
      "youtube",
    ]).notNull(),
    tenantKey: varchar("tenant_key", { length: 100 }).notNull().default("default"),
    accountName: varchar("account_name", { length: 255 }).notNull(),
    accountId: varchar("account_id", { length: 255 }),

    accessToken: text("access_token"),
    tokenExpires: datetime("token_expires"),
    refreshToken: text("refresh_token"),
    pageId: varchar("page_id", { length: 255 }),
    pageToken: text("page_token"),

    isActive: tinyint("is_active").default(1),
    lastPostAt: datetime("last_post_at"),
    errorCount: int("error_count").default(0),
    lastError: varchar("last_error", { length: 500 }),

    meta: json("meta"),
    createdAt: datetime("created_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3)`
    ),
    updatedAt: datetime("updated_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
    ),
  },
  (table) => [
    index("idx_pa_platform").on(table.platform),
    index("idx_pa_active").on(table.isActive),
    index("idx_pa_tenant").on(table.tenantKey),
  ]
);

// ─── tenant_oauth_clients ───────────────────────────────────
export const tenantOauthClients = mysqlTable(
  "tenant_oauth_clients",
  {
    id: int("id").autoincrement().primaryKey(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),

    tenantKey: varchar("tenant_key", { length: 100 }).notNull(),
    platform: mysqlEnum("platform", [
      "youtube",
      "google",
      "facebook",
      "instagram",
      "linkedin",
      "x",
    ]).notNull(),
    clientId: varchar("client_id", { length: 255 }).notNull(),
    clientSecretEncrypted: text("client_secret_encrypted").notNull(),
    redirectUri: varchar("redirect_uri", { length: 500 }).notNull(),

    isActive: tinyint("is_active").default(1),
    createdAt: datetime("created_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3)`
    ),
    updatedAt: datetime("updated_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
    ),
  },
  (table) => [
    uniqueIndex("uk_tenant_oauth_platform").on(table.tenantKey, table.platform),
    index("idx_tenant_oauth_tenant").on(table.tenantKey),
    index("idx_tenant_oauth_platform").on(table.platform),
  ]
);

// ─── tenant_settings (per-tenant entegrasyon ayarlari) ──────
// Her tenant icin GSC/GTM/GA4/Ads/Telegram/Meta vb. ayarlar.
// Secret olmayan degerler `value` (JSON) icinde plaintext;
// secret degerler `valueEncrypted` icinde AES-256-GCM (core/crypto.ts) ile sifreli.
// Sosyal yayin token'lari platform_accounts'ta kalir; burasi Google + Telegram +
// Meta + ucuncu-parti API anahtarlari icindir.
export const tenantSettings = mysqlTable(
  "tenant_settings",
  {
    id: int("id").autoincrement().primaryKey(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    tenantKey: varchar("tenant_key", { length: 100 }).notNull(),
    /** "google" | "gsc" | "gtm" | "ga4" | "google_ads" | "telegram" | "meta" | "dataforseo" ... */
    namespace: varchar("namespace", { length: 50 }).notNull(),
    settingKey: varchar("setting_key", { length: 120 }).notNull(),
    /** Secret olmayan deger (JSON). Secret ise null. */
    value: json("value"),
    /** Secret deger (encryptSecret ciktisi). Secret degilse null. */
    valueEncrypted: text("value_encrypted"),
    isSecret: tinyint("is_secret").notNull().default(0),
    updatedBy: varchar("updated_by", { length: 100 }),
    createdAt: datetime("created_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3)`
    ),
    updatedAt: datetime("updated_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
    ),
  },
  (table) => [
    uniqueIndex("uk_tenant_setting").on(
      table.tenantKey,
      table.namespace,
      table.settingKey,
    ),
    index("idx_ts_tenant").on(table.tenantKey),
    index("idx_ts_namespace").on(table.tenantKey, table.namespace),
  ]
);

// ─── x_watch_targets ────────────────────────────────────────
export const xWatchTargets = mysqlTable(
  "x_watch_targets",
  {
    id: int("id").autoincrement().primaryKey(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    tenantKey: varchar("tenant_key", { length: 100 }).notNull().default("default"),
    type: mysqlEnum("type", ["user", "keyword", "hashtag"]).notNull(),
    label: varchar("label", { length: 255 }).notNull(),
    query: varchar("query", { length: 500 }).notNull(),
    userId: varchar("user_id", { length: 64 }),
    sinceId: varchar("since_id", { length: 64 }),
    isActive: tinyint("is_active").default(1),
    lastSyncedAt: datetime("last_synced_at", { fsp: 3 }),
    lastError: varchar("last_error", { length: 500 }),
    createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime("updated_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
    ),
  },
  (table) => [
    index("idx_x_watch_tenant").on(table.tenantKey),
    index("idx_x_watch_active").on(table.isActive),
    index("idx_x_watch_type").on(table.type),
  ]
);

// ─── x_observed_tweets ──────────────────────────────────────
export const xObservedTweets = mysqlTable(
  "x_observed_tweets",
  {
    id: int("id").autoincrement().primaryKey(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    targetId: int("target_id")
      .notNull()
      .references(() => xWatchTargets.id, { onDelete: "cascade" }),
    tweetId: varchar("tweet_id", { length: 64 }).notNull(),
    authorId: varchar("author_id", { length: 64 }),
    authorUsername: varchar("author_username", { length: 255 }),
    authorName: varchar("author_name", { length: 255 }),
    text: text("text").notNull(),
    tweetUrl: varchar("tweet_url", { length: 500 }),
    likeCount: int("like_count").default(0),
    replyCount: int("reply_count").default(0),
    retweetCount: int("retweet_count").default(0),
    quoteCount: int("quote_count").default(0),
    impressionCount: int("impression_count").default(0),
    createdTime: datetime("created_time", { fsp: 3 }),
    observedAt: datetime("observed_at", { fsp: 3 }).notNull(),
    createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime("updated_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
    ),
  },
  (table) => [
    uniqueIndex("uk_x_observed_target_tweet").on(table.targetId, table.tweetId),
    index("idx_x_observed_target").on(table.targetId),
    index("idx_x_observed_tweet").on(table.tweetId),
    index("idx_x_observed_created").on(table.createdTime),
    index("idx_x_observed_engagement").on(
      table.likeCount,
      table.replyCount,
      table.retweetCount,
      table.quoteCount,
    ),
  ]
);

// ─── social_projects (tenant registry) ──────────────────────
export const socialProjects = mysqlTable(
  "social_projects",
  {
    id: int("id").autoincrement().primaryKey(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    key: varchar("project_key", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    websiteUrl: varchar("website_url", { length: 500 }),
    gtmContainerId: varchar("gtm_container_id", { length: 64 }),
    ga4MeasurementId: varchar("ga4_measurement_id", { length: 64 }),
    /** Analytics Data API: sayisal mulk ID (ornek: 123456789) */
    ga4PropertyId: varchar("ga4_property_id", { length: 32 }),
    googleAdsCustomerId: varchar("google_ads_customer_id", { length: 64 }),
    googleAdsManagerId: varchar("google_ads_manager_id", { length: 64 }),
    searchConsoleSiteUrl: varchar("search_console_site_url", { length: 500 }),
    siteSettingsApiUrl: varchar("site_settings_api_url", { length: 500 }),
    /** Icerik senkronizasyonu icin kaynak API URL (opsiyonel) */
    contentSourceUrl: varchar("content_source_url", { length: 500 }),
    /** Kaynak tipi: "bereketfide" | "wordpress" | "rss" | null */
    contentSourceType: varchar("content_source_type", { length: 50 }),
    marketingJson: json("marketing_json"),
    emailSettings: json("email_settings"),
    /** Tenant'a ozel dis kaynak DB baglantisi (host/port/user/password/database/enabled). Env yerine bu kullanilir. */
    sourceDb: json("source_db").$type<{
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
      enabled: boolean;
    } | null>().default(null),
    isActive: tinyint("is_active").notNull().default(1),
    createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime("updated_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
    ),
  },
  (table) => [index("idx_social_projects_active").on(table.isActive)]
);

// ─── google_ads_change_sets ─────────────────────────────────
export const googleAdsChangeSets = mysqlTable(
  "google_ads_change_sets",
  {
    id: int("id").autoincrement().primaryKey(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    tenantKey: varchar("tenant_key", { length: 100 }).notNull(),
    customerId: varchar("customer_id", { length: 64 }).notNull(),
    managerId: varchar("manager_id", { length: 64 }),
    campaignId: varchar("campaign_id", { length: 64 }),
    campaignName: varchar("campaign_name", { length: 255 }),
    title: varchar("title", { length: 255 }).notNull(),
    status: mysqlEnum("status", [
      "draft",
      "validated",
      "validation_failed",
      "applied",
      "failed",
      "cancelled",
    ])
      .notNull()
      .default("draft"),
    source: varchar("source", { length: 50 }).notNull().default("manual"),
    payload: json("payload").notNull(),
    validationResult: json("validation_result"),
    appliedResult: json("applied_result"),
    createdBy: varchar("created_by", { length: 100 }).default("system"),
    createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime("updated_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
    ),
  },
  (table) => [
    index("idx_ads_change_tenant").on(table.tenantKey),
    index("idx_ads_change_status").on(table.status),
    index("idx_ads_change_campaign").on(table.campaignId),
  ]
);

// ─── marketing_change_sets (platform-agnostic) ──────────────
export const marketingChangeSets = mysqlTable(
  "marketing_change_sets",
  {
    id: int("id").autoincrement().primaryKey(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    tenantKey: varchar("tenant_key", { length: 100 }).notNull(),
    platform: mysqlEnum("platform", ["google_ads", "gtm", "ga4", "gsc", "merchant", "meta"]).notNull(),
    targetRef: varchar("target_ref", { length: 255 }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", [
      "draft",
      "validated",
      "validation_failed",
      "applied",
      "failed",
      "cancelled",
    ])
      .notNull()
      .default("draft"),
    source: mysqlEnum("source", ["manual", "automation", "ai", "recommendation"]).notNull().default("manual"),
    payload: json("payload").notNull(),
    validationResult: json("validation_result"),
    appliedResult: json("applied_result"),
    createdBy: varchar("created_by", { length: 100 }).default("system"),
    createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime("updated_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
    ),
  },
  (table) => [
    index("idx_mcs_tenant").on(table.tenantKey),
    index("idx_mcs_platform").on(table.tenantKey, table.platform),
    index("idx_mcs_status").on(table.status),
  ]
);

// ─── gsc_url_index (Search Console URL inspection cache) ────
export const gscUrlIndex = mysqlTable(
  "gsc_url_index",
  {
    id: int("id").autoincrement().primaryKey(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    tenantKey: varchar("tenant_key", { length: 100 }).notNull(),
    url: varchar("url", { length: 1000 }).notNull(),
    verdict: varchar("verdict", { length: 64 }),
    coverageState: varchar("coverage_state", { length: 255 }),
    lastCrawlTime: datetime("last_crawl_time", { fsp: 3 }),
    robotsTxtState: varchar("robots_txt_state", { length: 64 }),
    indexingState: varchar("indexing_state", { length: 64 }),
    pageFetchState: varchar("page_fetch_state", { length: 64 }),
    googleCanonical: varchar("google_canonical", { length: 1000 }),
    userCanonical: varchar("user_canonical", { length: 1000 }),
    statusText: varchar("status_text", { length: 255 }),
    recommendation: text("recommendation"),
    rawResult: json("raw_result"),
    checkedAt: datetime("checked_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    createdAt: datetime("created_at", { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime("updated_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
    ),
  },
  (table) => [
    uniqueIndex("uk_gsc_url_index_tenant_url").on(table.tenantKey, table.url),
    index("idx_gsc_url_index_tenant").on(table.tenantKey),
    index("idx_gsc_url_index_verdict").on(table.tenantKey, table.verdict),
    index("idx_gsc_url_index_checked").on(table.checkedAt),
  ]
);

// ─── users ────────────────────────────────────────────────
export const users = mysqlTable(
  "users",
  {
    id: char("id", { length: 36 }).primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    fullName: varchar("full_name", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    ecosystemId: char("ecosystem_id", { length: 36 }),
    role: mysqlEnum("role", ["admin", "editor"]).notNull().default("editor"),
    isActive: tinyint("is_active").default(1),
    emailVerified: tinyint("email_verified").notNull().default(0),
    resetToken: varchar("reset_token", { length: 255 }),
    resetTokenExpires: datetime("reset_token_expires", { fsp: 3 }),
    rulesAcceptedAt: datetime("rules_accepted_at", { fsp: 3 }),
    lastSignInAt: datetime("last_sign_in_at", { fsp: 3 }),
    createdAt: datetime("created_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3)`
    ),
    updatedAt: datetime("updated_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
    ),
  },
  (table) => [
    index("idx_user_email").on(table.email),
    index("idx_user_active").on(table.isActive),
  ]
);

// ─── refresh_tokens ───────────────────────────────────────
export const refreshTokens = mysqlTable(
  "refresh_tokens",
  {
    id: char("id", { length: 36 }).primaryKey(), // jti
    userId: char("user_id", { length: 36 }).notNull(),
    tokenHash: varchar("token_hash", { length: 255 }).notNull(),
    createdAt: datetime("created_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3)`
    ),
    expiresAt: datetime("expires_at", { fsp: 3 }).notNull(),
    revokedAt: datetime("revoked_at", { fsp: 3 }),
    replacedBy: char("replaced_by", { length: 36 }),
  },
  (table) => [
    index("idx_rt_user").on(table.userId),
    index("idx_rt_expires").on(table.expiresAt),
  ]
);

// ─── profiles (shared auth compatibility) ───────────────────
export const profiles = mysqlTable(
  "profiles",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    fullName: text("full_name"),
    phone: varchar("phone", { length: 64 }),
    avatarUrl: text("avatar_url"),
    addressLine1: varchar("address_line1", { length: 255 }),
    addressLine2: varchar("address_line2", { length: 255 }),
    city: varchar("city", { length: 128 }),
    country: varchar("country", { length: 128 }),
    postalCode: varchar("postal_code", { length: 32 }),
    createdAt: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (table) => [
    foreignKey({
      columns: [table.id],
      foreignColumns: [users.id],
      name: "fk_profiles_id_users_id",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

// ─── user_roles (shared auth compatibility) ─────────────────
export const userRoles = mysqlTable(
  "user_roles",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    userId: char("user_id", { length: 36 }).notNull(),
    role: mysqlEnum("role", ["admin", "editor", "carrier", "customer", "dealer"])
      .notNull()
      .default("customer"),
    createdAt: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "fk_user_roles_user_id_users_id",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    uniqueIndex("user_roles_user_id_role_unique").on(table.userId, table.role),
    index("user_roles_user_id_idx").on(table.userId),
    index("user_roles_role_idx").on(table.role),
  ]
);

// ─── tenant_user_roles (multi-tenant RBAC) ─────────────────
export const tenantUserRoles = mysqlTable(
  "tenant_user_roles",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    userId: char("user_id", { length: 36 }).notNull(),
    tenantKey: varchar("tenant_key", { length: 100 }).notNull(),
    role: mysqlEnum("role", ["tenant_admin", "tenant_editor"]).notNull().default("tenant_editor"),
    createdAt: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => [
    uniqueIndex("tenant_user_roles_unique").on(table.userId, table.tenantKey),
    index("tenant_user_roles_user_idx").on(table.userId),
    index("tenant_user_roles_tenant_idx").on(table.tenantKey),
  ]
);

// ─── hashtag_groups ─────────────────────────────────────────
export const hashtagGroups = mysqlTable(
  "hashtag_groups",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantKey: varchar("tenant_key", { length: 100 }),
    name: varchar("name", { length: 100 }).notNull(),
    hashtags: text("hashtags").notNull(),
    postType: mysqlEnum("post_type", [
      "haber",
      "etkilesim",
      "ilan",
      "nostalji",
      "tanitim",
      "kampanya",
      "genel",
    ]).default("genel"),
    isDefault: tinyint("is_default").default(0),
    createdAt: datetime("created_at", { fsp: 3 }).default(
      sql`CURRENT_TIMESTAMP(3)`
    ),
  },
  (table) => [index("idx_htag_tenant").on(table.tenantKey)]
);
