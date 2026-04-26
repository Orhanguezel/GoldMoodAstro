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
('01000000-0000-4000-8000-000000000001', 'app.name',               '*', 'Platform'),
-- Agora (app_id non-secret — mobil uygulamaya iletilir; certificate .env'de kalır)
('01000000-0000-4000-8000-000000000002', 'agora.app_id',           '*', ''),
('01000000-0000-4000-8000-000000000003', 'agora.enabled',          '*', '1'),
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
-- Design tokens (public, consumed by frontend and mobile)
('01000000-0000-4000-8000-000000000012', 'design_tokens',          '*', '{"version":"1","colors":{"brand_primary":"#7B5EA7","brand_primary_dark":"#5C4480","brand_primary_light":"#9B7EC8","brand_secondary":"#D4AF37","brand_secondary_dim":"#B8962E","brand_secondary_light":"#F0CF6B","brand_accent":"#5A4E87","bg_base":"#0D0B1E","bg_deep":"#1A1630","bg_surface":"#241E3D","bg_surface_high":"#2E2850","text_primary":"#F0E6FF","text_secondary":"#C9B8E8","text_muted":"#7A6DA0","text_muted_soft":"#4D4570","border":"rgba(201,184,232,0.14)","border_soft":"rgba(201,184,232,0.07)","success":"#4CAF6E","warning":"#F0A030","error":"#E55B4D","info":"#5B9BD5"},"typography":{"font_display":"Fraunces, serif","font_sans":"InterTight, system-ui, sans-serif","font_mono":"JetBrains Mono, monospace","base_size":"16px"},"radius":{"xs":"4px","sm":"8px","md":"12px","lg":"16px","xl":"24px","pill":"9999px"},"shadows":{"soft":"0 2px 20px rgba(0,0,0,0.3)","card":"0 4px 24px rgba(0,0,0,0.4)","glow_primary":"0 0 30px rgba(123,94,167,0.3)","glow_gold":"0 0 30px rgba(212,175,55,0.2)"},"branding":{"app_name":"GoldMoodAstro","tagline":"Ruhsal danismanlik platformu","tagline_en":"Your spiritual guidance platform","logo_url":"","favicon_url":"","theme_color":"#7B5EA7","og_image_url":""}}')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- Design Tokens (frontend + mobile tema renkleri — admin panelden düzenlenebilir)
INSERT INTO site_settings (id, `key`, locale, value) VALUES
('01000000-0000-4000-8000-000000000012', 'design_tokens', '*',
 '{"version":"1","colors":{"brand_primary":"#7B5EA7","brand_primary_dark":"#5C4480","brand_primary_light":"#9B7EC8","brand_secondary":"#D4AF37","brand_secondary_dim":"#B8962E","brand_secondary_light":"#F0CF6B","brand_accent":"#5A4E87","bg_base":"#0D0B1E","bg_deep":"#1A1630","bg_surface":"#241E3D","bg_surface_high":"#2E2850","text_primary":"#F0E6FF","text_secondary":"#C9B8E8","text_muted":"#7A6DA0","text_muted_soft":"#4D4570","border":"rgba(201,184,232,0.14)","border_soft":"rgba(201,184,232,0.07)","success":"#4CAF6E","warning":"#F0A030","error":"#E55B4D","info":"#5B9BD5"},"typography":{"font_display":"Fraunces, serif","font_sans":"InterTight, system-ui, sans-serif","font_mono":"JetBrains Mono, monospace","base_size":"16px"},"radius":{"xs":"4px","sm":"8px","md":"12px","lg":"16px","xl":"24px","pill":"9999px"},"shadows":{"soft":"0 2px 20px rgba(0,0,0,0.3)","card":"0 4px 24px rgba(0,0,0,0.4)","glow_primary":"0 0 30px rgba(123,94,167,0.3)","glow_gold":"0 0 30px rgba(212,175,55,0.2)"},"branding":{"app_name":"GoldMoodAstro","tagline":"Ruhsal danışmanlık platformu","tagline_en":"Your spiritual guidance platform","logo_url":"","favicon_url":"","theme_color":"#7B5EA7","og_image_url":""}}')
ON DUPLICATE KEY UPDATE value = VALUES(value);
