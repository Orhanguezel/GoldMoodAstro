CREATE TABLE IF NOT EXISTS site_settings (
  id CHAR(36) PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL,
  locale VARCHAR(8) NOT NULL,
  value TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY site_settings_key_locale_uq (`key`, locale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO site_settings (id, `key`, locale, value) VALUES
-- Temel
('01000000-0000-4000-8000-000000000001', 'app.name',               '*', 'GoldMoodAstro'),
-- LiveKit (url non-secret — mobil/web client'a iletilir; api key/secret .env'de kalır)
('01000000-0000-4000-8000-000000000002', 'livekit.url',            '*', 'wss://goldmoodastro-j03iq312.livekit.cloud'),
('01000000-0000-4000-8000-000000000003', 'livekit.enabled',        '*', '1'),
-- Iyzipay (api_key/secret .env'de kalır; bu key'ler çevre seçimi için)
('01000000-0000-4000-8000-000000000004', 'iyzipay.base_url',       '*', 'https://sandbox-api.iyzipay.com'),
('01000000-0000-4000-8000-000000000005', 'iyzipay.enabled',        '*', '1'),
-- Firebase (proje ID non-secret; credentials .env'de kalır)
('01000000-0000-4000-8000-000000000006', 'firebase.project_id',    '*', ''),
('01000000-0000-4000-8000-000000000007', 'firebase.enabled',       '*', '1'),
-- Storage
('01000000-0000-4000-8000-000000000008', 'storage.driver',         '*', 'cloudinary'),
-- Session
('01000000-0000-4000-8000-000000000009', 'session.price_currency', '*', 'TRY'),
('01000000-0000-4000-8000-000000000010', 'session.min_duration',   '*', '30'),
('01000000-0000-4000-8000-000000000011', 'session.max_duration',   '*', '120'),
-- Feature flags (FAZ 11 video toggle, FAZ 8 birth chart, FAZ 9 daily reading)
-- NOT: 'feature.video_call' legacy key kaldırıldı; tek key 'feature_video_enabled' kullanılır
-- (admin paneldeki LiveKit tab + bookings + livekit/repository.ts hepsi bu key'i okur).
('01000000-0000-4000-8000-000000000016', 'feature_video_enabled',  '*', 'false'),
('01000000-0000-4000-8000-000000000014', 'feature.birth_chart',    '*', '1'),
('01000000-0000-4000-8000-000000000015', 'feature.daily_reading',  '*', '1'),
-- Design tokens (public, consumed by frontend + admin panel + mobile)
-- 2026-04-27 vizyon revizyonu: Gold (#C9A961) + Cream (#FAF6EF) + Ink (#2A2620) + Plum (#3D2E47)
-- Frontend'in beklediği boş default kayıtlar (404 yerine 200 boş döndürmek için).
-- Admin panelden doldurulabilir.
('01000000-0000-4000-8000-000000000020', 'gtm_container_id',         '*', ''),
('01000000-0000-4000-8000-000000000021', 'google_site_verification', '*', ''),
('01000000-0000-4000-8000-000000000022', 'site_logo_light',          '*', ''),
('01000000-0000-4000-8000-000000000023', 'site_logo_dark',           '*', ''),
('01000000-0000-4000-8000-000000000024', 'site_favicon',             '*', ''),
('01000000-0000-4000-8000-000000000025', 'contact_info',             '*', '{"email":"","phone":"","address":""}'),
('01000000-0000-4000-8000-000000000026', 'company_brand',            '*', '{"name":"GoldMoodAstro","slogan":"Yıldızlarla tanışan modern astroloji"}'),
('01000000-0000-4000-8000-000000000027', 'cookie_consent',           '*', '{"enabled":false}'),
('01000000-0000-4000-8000-000000000028', 'socials',                  '*', '{"instagram":"","twitter":"","facebook":"","linkedin":""}'),
('01000000-0000-4000-8000-000000000029', 'chat_ai_welcome_message',  '*', ''),
('01000000-0000-4000-8000-00000000002a', 'site_seo',                 '*', '{"title":"GoldMoodAstro","description":"Yıldızlarla tanışan modern astroloji"}'),
('01000000-0000-4000-8000-00000000002b', 'ui_about',                 '*', '{}'),
('01000000-0000-4000-8000-00000000002c', 'ui_home',                  '*', '{}'),
('01000000-0000-4000-8000-00000000002d', 'ui_chat',                  '*', '{}'),
('01000000-0000-4000-8000-00000000002e', 'seo',                      '*', '{}'),
-- Design tokens (public, consumed by frontend + admin panel + mobile)
-- 2026-04-27 vizyon revizyonu: Gold (#C9A961) + Cream (#FAF6EF) + Ink (#2A2620) + Plum (#3D2E47)
('01000000-0000-4000-8000-000000000012', 'design_tokens',          '*', '{"version":"2","colors":{"brand_primary":"#C9A961","brand_primary_dark":"#A8884A","brand_primary_light":"#D4BB7A","brand_secondary":"#C9A961","brand_secondary_dim":"#B89651","brand_secondary_light":"#E5D0A0","brand_accent":"#3D2E47","gold_50":"#FCF8ED","gold_100":"#F7EFD5","gold_200":"#EEDDAA","gold_300":"#E2C877","gold_400":"#D4B554","gold_500":"#C9A961","gold_600":"#A8884A","gold_700":"#856B3A","gold_800":"#5F4E2F","gold_900":"#3F3524","sand_50":"#FFFCF7","sand_100":"#FAF6EF","sand_200":"#F2EBDD","sand_300":"#E8DDC8","sand_400":"#D8C7A8","sand_500":"#C4AF8B","sand_600":"#A18C6B","sand_700":"#78684F","sand_800":"#534839","sand_900":"#2A2620","bg_base":"#FAF6EF","bg_deep":"#F2EBDD","bg_surface":"#FFFFFF","bg_surface_high":"#F7F1E4","text_primary":"#2A2620","text_secondary":"#4A4238","text_muted":"#8A8276","text_muted_soft":"#6B6358","border":"rgba(168,136,74,0.25)","border_soft":"rgba(168,136,74,0.15)","success":"#4CAF6E","warning":"#F0A030","error":"#E55B4D","info":"#5B9BD5","bg_base_dark":"#2A2620","bg_deep_dark":"#1A1715","bg_surface_dark":"#3D362D","bg_surface_high_dark":"#4A4238","text_primary_dark":"#FAF6EF","text_secondary_dark":"#E5DCC8","text_muted_dark":"#A09888"},"typography":{"font_display":"Cinzel, Georgia, serif","font_serif":"Fraunces, Georgia, serif","font_sans":"Manrope, system-ui, -apple-system, sans-serif","font_mono":"JetBrains Mono, monospace","base_size":"16px"},"radius":{"xs":"4px","sm":"8px","md":"12px","lg":"16px","xl":"24px","pill":"9999px"},"shadows":{"soft":"0 2px 20px rgba(45,37,32,0.06)","card":"0 8px 40px rgba(45,37,32,0.10)","glow_primary":"0 0 60px rgba(201,169,97,0.18)","glow_gold":"0 0 30px rgba(201,169,97,0.22)"},"branding":{"app_name":"GoldMoodAstro","tagline":"Yıldızlarla tanışan modern astroloji","tagline_en":"Modern astrology meets the stars","logo_url":"","favicon_url":"","theme_color":"#C9A961","theme_color_dark":"#2A2620","og_image_url":""}}')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- UI Dynamic Assets
INSERT INTO site_settings (id, `key`, locale, value) VALUES
('01000000-0000-4000-8000-000000000100', 'ui_feature_natal_image', '*', '/uploads/features/natal_chart.png'),
('01000000-0000-4000-8000-000000000101', 'ui_feature_daily_image', '*', '/uploads/features/daily_reading.png'),
('01000000-0000-4000-8000-000000000102', 'ui_feature_synastry_image', '*', '/uploads/features/synastry_chart.png'),
('01000000-0000-4000-8000-000000000103', 'ui_support_ai_image', '*', '/uploads/support/support_ai.png')
ON DUPLICATE KEY UPDATE value = VALUES(value);
