-- =============================================================
-- 014_brand_seed.sql
-- FAZ 33: Marka kimligi site_settings uzerinden yonetilir.
-- Kod icinde marka/domain/iletisim literal'i kalmamasi icin fallback seed.
-- =============================================================

INSERT INTO site_settings (id, `key`, locale, value) VALUES
('01000000-0000-4000-8000-000000000030', 'brand.name',          '*', 'GoldMoodAstro'),
('01000000-0000-4000-8000-000000000031', 'brand.legal_name',    '*', 'GoldMoodAstro'),
('01000000-0000-4000-8000-000000000032', 'brand.domain',        '*', 'goldmoodastro.com'),
('01000000-0000-4000-8000-000000000033', 'brand.public_url',    '*', 'https://goldmoodastro.com'),
('01000000-0000-4000-8000-000000000034', 'brand.logo_light',    '*', ''),
('01000000-0000-4000-8000-000000000035', 'brand.logo_dark',     '*', ''),
('01000000-0000-4000-8000-000000000036', 'brand.favicon',       '*', ''),
('01000000-0000-4000-8000-000000000037', 'brand.og_image',      '*', ''),
('01000000-0000-4000-8000-000000000038', 'brand.theme_color',   '*', '#C9A961'),
('01000000-0000-4000-8000-000000000039', 'brand.contact',       '*', '{"email":"","phone":"","address":""}'),
('01000000-0000-4000-8000-00000000003a', 'brand.social',        '*', '{"instagram":"","twitter":"","facebook":"","linkedin":"","youtube":""}'),
('01000000-0000-4000-8000-00000000003b', 'brand.assets',        '*', '{}')
ON DUPLICATE KEY UPDATE value = VALUES(value);

