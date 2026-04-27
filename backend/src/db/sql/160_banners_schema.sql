-- ============================================================================
-- Banners — admin'den yönetilen banner reklam yerleşimleri (FAZ 12 / T12-1)
-- ============================================================================
-- placement: where on site/app to render
-- locale: '*' tüm diller, 'tr', 'en', 'de', vs.
-- schedule: starts_at..ends_at — aktif period
-- target_segment: 'all'|'free'|'paid' (subscription'a göre)
-- view_count + click_count: aktivite sayaçları
-- ============================================================================

CREATE TABLE IF NOT EXISTS banners (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  title_tr VARCHAR(255),
  title_en VARCHAR(255),
  subtitle_tr VARCHAR(500),
  subtitle_en VARCHAR(500),
  image_url VARCHAR(500) NOT NULL,             -- desktop / default
  image_url_mobile VARCHAR(500),               -- opsiyonel mobil-spesifik
  link_url VARCHAR(500),
  cta_label_tr VARCHAR(100),
  cta_label_en VARCHAR(100),
  placement ENUM(
    'home_hero','home_sidebar','home_footer','consultant_list',
    'mobile_welcome','mobile_home','mobile_call_end','admin_dashboard'
  ) NOT NULL,
  locale CHAR(8) NOT NULL DEFAULT '*',
  starts_at DATETIME(3),
  ends_at DATETIME(3),
  target_segment ENUM('all','free','paid','new_user','existing_user') NOT NULL DEFAULT 'all',
  campaign_id CHAR(36),                        -- opsiyonel kampanya bağlantısı (FAZ 13)
  priority INT NOT NULL DEFAULT 0,             -- aynı placement'ta sıralama
  is_active TINYINT NOT NULL DEFAULT 1,
  view_count INT NOT NULL DEFAULT 0,
  click_count INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY banners_placement_idx (placement, is_active, starts_at, ends_at),
  KEY banners_locale_idx (locale, is_active),
  KEY banners_campaign_idx (campaign_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────────────────────
-- Seed: 1 örnek banner (welcome / hero) — admin sonradan editler veya devre dışı
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO banners (id, code, title_tr, title_en, subtitle_tr, subtitle_en, image_url, link_url, cta_label_tr, cta_label_en, placement, locale, target_segment, priority, is_active) VALUES
('b0000000-0000-4000-8000-000000000001', 'launch_welcome',
 'GoldMoodAstro''ya Hoş Geldiniz', 'Welcome to GoldMoodAstro',
 'Yıldızlarla tanışan modern astroloji.', 'Modern astrology meets the stars.',
 '/banners/launch.svg', '/tr/consultants', 'Danışmanları Keşfet', 'Discover Consultants',
 'home_hero', '*', 'all', 100, 1)
ON DUPLICATE KEY UPDATE
  title_tr = VALUES(title_tr),
  title_en = VALUES(title_en),
  subtitle_tr = VALUES(subtitle_tr),
  subtitle_en = VALUES(subtitle_en),
  link_url = VALUES(link_url);
