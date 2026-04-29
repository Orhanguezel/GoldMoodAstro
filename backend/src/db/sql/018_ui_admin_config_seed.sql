-- =============================================================
-- FILE: 018_ui_admin_config_seed.sql
-- Admin panel branding (ui_admin_config) + brand_media tab'in
-- bekledigi eksik media key'leri.
--
-- ui_admin_config:
--   admin_panel/src/app/(main)/admin/(admin)/site-settings/tabs/branding-settings-tab.tsx
--   tab'i bu key altindaki `branding` alt-objesini okur/yazar.
--   SaaS musteri admin paneli icindeki marka kimligini buradan yonetir.
--
-- Media key'leri:
--   admin_panel/.../tabs/brand-media-tab.tsx
--   public site (frontend/mobile) icin. JSON format: {"url":"..."}
--   site_logo_dark + site_favicon zaten 010'da bos string olarak var,
--   burada JSON format'a guncelliyoruz.
-- =============================================================

INSERT INTO site_settings (id, `key`, locale, value) VALUES
-- Admin panel branding (default'lar -- GoldMoodAstro tema)
('01800000-0000-4000-8000-000000000001', 'ui_admin_config', '*',
 '{"branding":{"app_name":"GoldMoodAstro Admin","app_copyright":"GoldMoodAstro","html_lang":"tr","theme_color":"#C9A961","favicon_16":"/favicon/favicon-16.svg","favicon_32":"/favicon/favicon-32.svg","apple_touch_icon":"/favicon/apple-touch-icon.svg","meta":{"title":"GoldMoodAstro Admin","description":"GoldMoodAstro yonetim paneli","og_url":"https://admin.goldmoodastro.com","og_title":"GoldMoodAstro Admin","og_description":"GoldMoodAstro yonetim paneli","og_image":"","twitter_card":"summary_large_image"}}}'),

-- Public site media (brand-media-tab.tsx eksik key'leri)
('01800000-0000-4000-8000-000000000002', 'site_logo',                '*', '{"url":""}'),
('01800000-0000-4000-8000-000000000003', 'site_logo_light',          '*', '{"url":""}'),
('01800000-0000-4000-8000-000000000004', 'site_og_default_image',    '*', '{"url":""}'),
('01800000-0000-4000-8000-000000000005', 'site_appointment_cover',   '*', '{"url":""}'),

-- 010'daki bos string'leri JSON format'a normalize et
('01800000-0000-4000-8000-000000000006', 'site_logo_dark',           '*', '{"url":""}'),
('01800000-0000-4000-8000-000000000007', 'site_favicon',             '*', '{"url":""}')
ON DUPLICATE KEY UPDATE value = VALUES(value);
