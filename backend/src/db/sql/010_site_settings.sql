CREATE TABLE IF NOT EXISTS site_settings (
  id CHAR(36) PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL,
  locale VARCHAR(8) NOT NULL,
  value LONGTEXT NOT NULL,
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
-- gtm_container_id: GTM container WDQ822LF Google'da var ama sitede AKTİF DEĞİL.
-- GTM-öncelikli kod yüzünden dolu olursa direkt gtag yüklenmez; container boş olduğundan
-- GA4'e veri gitmez. Direkt GA4 (gtag) kullanılıyor → boş bırakıldı (2026-06-20).
('01000000-0000-4000-8000-000000000020', 'gtm_container_id',         '*', ''),
('01000000-0000-4000-8000-00000000002f', 'ga4_measurement_id',       '*', 'G-M8FPZB5FFC'),
('01000000-0000-4000-8000-000000000021', 'google_site_verification', '*', ''),
('01000000-0000-4000-8000-0000000000fb', 'facebook_pixel_id',        '*', ''),
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
-- 2026-05-16 canli aktif tema ile hizalama: Amethyst (#9B6FD9) + Gold (#D4AF37)
('01000000-0000-4000-8000-000000000012', 'design_tokens',          '*', '{"version":"2","colors":{"brand_primary":"#9B6FD9","brand_primary_dark":"#7C4FBF","brand_primary_light":"#C7A4F2","brand_secondary":"#D4AF37","brand_secondary_dim":"#B89230","brand_secondary_light":"#E5C868","brand_accent":"#4C1D95","gold_50":"#FDF6E3","gold_100":"#F8E8B8","gold_200":"#F2D685","gold_300":"#E9C24F","gold_400":"#DCB02D","gold_500":"#D4AF37","gold_600":"#A8862A","gold_700":"#7C631F","gold_800":"#544315","gold_900":"#2E250B","sand_50":"#F8F2FF","sand_100":"#EDE2FA","sand_200":"#D9C4F0","sand_300":"#BFA0E5","sand_400":"#A57DD5","sand_500":"#9B6FD9","sand_600":"#7C4FBF","sand_700":"#5C3792","sand_800":"#381F66","sand_900":"#1B0A3D","bg_base":"#F5EFFF","bg_deep":"#EDE2FA","bg_surface":"#FFFFFF","bg_surface_high":"#F8F2FF","text_primary":"#1B0A3D","text_secondary":"#3D2466","text_muted":"#6B559A","text_muted_soft":"#8B7BB8","border":"rgba(155,111,217,0.30)","border_soft":"rgba(155,111,217,0.15)","success":"#4CAF6E","warning":"#F0A030","error":"#E55B4D","info":"#5B9BD5","bg_base_dark":"#2E1065","bg_deep_dark":"#1B0A3D","bg_surface_dark":"#4C1D95","bg_surface_high_dark":"#5B21B6","text_primary_dark":"#F5F3FF","text_secondary_dark":"#DDD6FE","text_muted_dark":"#A88BC9","splash_bg":"#F5EFFF","splash_text":"#1B0A3D","loader_primary":"#9B6FD9"},"typography":{"font_display":"Fraunces, serif","font_serif":"Gabriela, serif","font_sans":"Outfit, sans-serif","font_mono":"JetBrains Mono, monospace","base_size":"16px"},"radius":{"xs":"12px","sm":"20px","md":"32px","lg":"48px","xl":"64px","pill":"9999px"},"shadows":{"soft":"0 10px 40px rgba(46,16,101,0.20)","card":"0 30px 90px rgba(46,16,101,0.30)","glow_primary":"0 0 120px rgba(155,111,217,0.40)","glow_gold":"0 0 60px rgba(212,175,55,0.30)"},"branding":{"app_name":"GoldMoodAstro","tagline":"Yıldızlarla tanışan modern astroloji","tagline_en":"Modern astrology meets the stars","logo_url":"","favicon_url":"","theme_color":"#9B6FD9","theme_color_dark":"#2E1065","og_image_url":""}}')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- UI Dynamic Assets
INSERT INTO site_settings (id, `key`, locale, value) VALUES
('01000000-0000-4000-8000-000000000100', 'ui_feature_natal_image', '*', '/uploads/features/natal_chart.png'),
('01000000-0000-4000-8000-000000000101', 'ui_feature_daily_image', '*', '/uploads/features/daily_reading.png'),
('01000000-0000-4000-8000-000000000102', 'ui_feature_synastry_image', '*', '/uploads/features/synastry_chart.png'),
('01000000-0000-4000-8000-000000000103', 'ui_support_ai_image', '*', '/uploads/support/support_ai.png')
ON DUPLICATE KEY UPDATE value = VALUES(value);
