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
    'home_mid_1','home_mid_2','home_mid_3',
    'consultant_detail_top','consultant_detail_bottom',
    'dashboard_top','blog_sidebar','blog_inline',
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

CREATE TABLE IF NOT EXISTS banner_i18n (
  id CHAR(36) PRIMARY KEY,
  banner_id CHAR(36) NOT NULL,
  locale CHAR(8) NOT NULL,
  title VARCHAR(255),
  subtitle VARCHAR(500),
  cta_label VARCHAR(100),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY banner_i18n_uq (banner_id, locale),
  KEY banner_i18n_locale_idx (locale),
  CONSTRAINT fk_banner_i18n_banner FOREIGN KEY (banner_id) REFERENCES banners(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────────────────────
-- Seed: house-promo banner'ları — admin sonradan editler veya devre dışı
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO banners (id, code, title_tr, title_en, subtitle_tr, subtitle_en, image_url, link_url, cta_label_tr, cta_label_en, placement, locale, target_segment, campaign_id, priority, is_active) VALUES
-- Hero
('b0000000-0000-4000-8000-000000000001', 'launch_welcome',
 'GoldMoodAstro''ya Hoş Geldiniz', 'Welcome to GoldMoodAstro',
 'Yıldızlarla tanışan modern astroloji.', 'Modern astrology meets the stars.',
 '/banners/launch.svg', '/tr/consultants', 'Danışmanları Keşfet', 'Discover Consultants',
 'home_hero', '*', 'all', NULL, 100, 1),
-- Slim (içerik arası reklamlar)
('b0000000-0000-4000-8000-000000000010', 'mid_birth_chart',
 'Doğum Haritan Hazır',  'Your Birth Chart Is Ready',
 'Saniyeler içinde detaylı analiz.',  'Detailed analysis in seconds.',
 '/banners/slim_birth_chart.svg', '/tr/birth-chart', 'Haritamı Oluştur', 'Create Chart',
 'home_mid_1', '*', 'all', NULL, 50, 1),
('b0000000-0000-4000-8000-000000000011', 'mid_premium',
 'Reklamsız Premium Deneyim',  'Ad-Free Premium Experience',
 'Premium içerikler, öncelikli özellikler ve reklamsız kullanım.', 'Premium content, priority features and an ad-free experience.',
 '/banners/slim_premium.svg', '/tr/pricing', 'Üye Ol', 'Upgrade',
 'home_mid_2', '*', 'free', NULL, 80, 1),
('b0000000-0000-4000-8000-000000000012', 'mid_welcome20',
 'WELCOME20 ile İlk Ay Avantajı',  'Start with WELCOME20',
 'Premium üyeliğe başlarken %20 indirim kodunu kullan.',  'Use 20% off when starting Premium.',
 '/banners/slim_first_session.svg', '/tr/pricing?coupon=WELCOME20', 'Kodu Kullan', 'Use Code',
 'home_mid_3', '*', 'free', 'c0000000-0000-4000-8000-000000000001', 70, 1),
('b0000000-0000-4000-8000-000000000013', 'mid_first_session',
 'İlk Seansa Özel İndirim',  'First Session Discount',
 'Yeni üyelere %20 — danışmanını seç.',  '20% off for new members.',
 '/banners/slim_first_session.svg', '/tr/consultants', 'Hemen Başla', 'Get Started',
 'consultant_list', '*', 'free', 'c0000000-0000-4000-8000-000000000001', 60, 1),
('b0000000-0000-4000-8000-000000000014', 'mobile_ad_free_premium',
 'Reklamsız Kullanım', 'Ad-Free Experience',
 'Premium üyelikle house-promo bannerlarını kapat.', 'Upgrade to hide house-promo banners.',
 '/banners/slim_premium.svg', '/tr/pricing', 'Premium''a Geç', 'Go Premium',
 'mobile_home', '*', 'free', NULL, 80, 1),
('b0000000-0000-4000-8000-000000000020', 'upsell_consultant',
 'Yapay Zeka Yorumu Yetmez Mi?', 'AI Reading Not Enough?',
 'Onaylı uzmanlarımızla canlı sesli veya görüntülü görüşme yaparak derinlemesine analiz al.', 'Get deep analysis with a live voice or video session with our verified experts.',
 '/banners/upsell_expert.svg', '/tr/consultants', 'Bir Uzmanla Görüş', 'Talk to an Expert',
 'home_mid_1', '*', 'all', NULL, 110, 1)
ON DUPLICATE KEY UPDATE
  code = VALUES(code),
  title_tr = VALUES(title_tr),
  title_en = VALUES(title_en),
  subtitle_tr = VALUES(subtitle_tr),
  subtitle_en = VALUES(subtitle_en),
  image_url = VALUES(image_url),
  link_url = VALUES(link_url),
  cta_label_tr = VALUES(cta_label_tr),
  cta_label_en = VALUES(cta_label_en),
  placement = VALUES(placement),
  locale = VALUES(locale),
  target_segment = VALUES(target_segment),
  campaign_id = VALUES(campaign_id),
  priority = VALUES(priority),
  is_active = VALUES(is_active);

INSERT INTO banner_i18n (id, banner_id, locale, title, subtitle, cta_label) VALUES
('b0010000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'tr', 'GoldMoodAstro''ya Hoş Geldiniz', 'Yıldızlarla tanışan modern astroloji.', 'Danışmanları Keşfet'),
('b0010000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'en', 'Welcome to GoldMoodAstro', 'Modern astrology meets the stars.', 'Discover Consultants'),
('b0010000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'de', 'Willkommen bei GoldMoodAstro', 'Moderne Astrologie trifft auf die Sterne.', 'Berater entdecken'),
('b0010000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000010', 'tr', 'Doğum Haritan Hazır', 'Saniyeler içinde detaylı analiz.', 'Haritamı Oluştur'),
('b0010000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000010', 'en', 'Your Birth Chart Is Ready', 'Detailed analysis in seconds.', 'Create Chart'),
('b0010000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000010', 'de', 'Dein Geburtshoroskop ist bereit', 'Detaillierte Analyse in wenigen Sekunden.', 'Horoskop erstellen'),
('b0010000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000011', 'tr', 'Reklamsız Premium Deneyim', 'Premium içerikler, öncelikli özellikler ve reklamsız kullanım.', 'Üye Ol'),
('b0010000-0000-4000-8000-000000000008', 'b0000000-0000-4000-8000-000000000011', 'en', 'Ad-Free Premium Experience', 'Premium content, priority features and an ad-free experience.', 'Upgrade'),
('b0010000-0000-4000-8000-000000000009', 'b0000000-0000-4000-8000-000000000011', 'de', 'Werbefreies Premium-Erlebnis', 'Premium-Inhalte, bevorzugte Funktionen und Nutzung ohne Werbung.', 'Upgrade'),
('b0010000-0000-4000-8000-000000000010', 'b0000000-0000-4000-8000-000000000012', 'tr', 'WELCOME20 ile İlk Ay Avantajı', 'Premium üyeliğe başlarken %20 indirim kodunu kullan.', 'Kodu Kullan'),
('b0010000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-000000000012', 'en', 'Start with WELCOME20', 'Use 20% off when starting Premium.', 'Use Code'),
('b0010000-0000-4000-8000-000000000012', 'b0000000-0000-4000-8000-000000000012', 'de', 'Mit WELCOME20 starten', 'Nutze 20 % Rabatt beim Start von Premium.', 'Code nutzen'),
('b0010000-0000-4000-8000-000000000013', 'b0000000-0000-4000-8000-000000000013', 'tr', 'İlk Seansa Özel İndirim', 'Yeni üyelere %20 — danışmanını seç.', 'Hemen Başla'),
('b0010000-0000-4000-8000-000000000014', 'b0000000-0000-4000-8000-000000000013', 'en', 'First Session Discount', '20% off for new members.', 'Get Started'),
('b0010000-0000-4000-8000-000000000015', 'b0000000-0000-4000-8000-000000000013', 'de', 'Rabatt auf die erste Sitzung', '20 % Rabatt für neue Mitglieder.', 'Jetzt starten'),
('b0010000-0000-4000-8000-000000000016', 'b0000000-0000-4000-8000-000000000014', 'tr', 'Reklamsız Kullanım', 'Premium üyelikle house-promo bannerlarını kapat.', 'Premium''a Geç'),
('b0010000-0000-4000-8000-000000000017', 'b0000000-0000-4000-8000-000000000014', 'en', 'Ad-Free Experience', 'Upgrade to hide house-promo banners.', 'Go Premium'),
('b0010000-0000-4000-8000-000000000018', 'b0000000-0000-4000-8000-000000000014', 'de', 'Werbefreie Nutzung', 'Mit Premium blendest du House-Promo-Banner aus.', 'Zu Premium wechseln'),
('b0010000-0000-4000-8000-000000000019', 'b0000000-0000-4000-8000-000000000020', 'tr', 'Yapay Zeka Yorumu Yetmez Mi?', 'Onaylı uzmanlarımızla canlı sesli veya görüntülü görüşme yaparak derinlemesine analiz al.', 'Bir Uzmanla Görüş'),
('b0010000-0000-4000-8000-000000000020', 'b0000000-0000-4000-8000-000000000020', 'en', 'AI Reading Not Enough?', 'Get deep analysis with a live voice or video session with our verified experts.', 'Talk to an Expert'),
('b0010000-0000-4000-8000-000000000021', 'b0000000-0000-4000-8000-000000000020', 'de', 'Reicht eine KI-Deutung nicht?', 'Erhalte eine tiefere Analyse in einer Live-Sprach- oder Videositzung mit geprüften Experten.', 'Mit Experten sprechen')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  subtitle = VALUES(subtitle),
  cta_label = VALUES(cta_label);
