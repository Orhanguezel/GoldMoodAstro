-- =============================================================
-- 142_storage_landing_seed.sql
-- Landing kapak gorsellerini storage modulune ekler (bucket='landing').
--
-- NEDEN: /admin/storage bu gorselleri listelemiyordu; ayrica custom_pages
-- featured_image relative /img/*.png idi ve admin domain'de 404 veriyordu
-- (220_landing_images.sql absolute SVG'ye cevirir; birlikte calisirlar).
--
-- Absolute URL: admin cross-domain onizleme calissin.
-- Idempotent (ON DUPLICATE KEY UPDATE).
-- =============================================================
INSERT INTO storage_assets (id, user_id, bucket, path, url, mime, size, name, folder, provider, metadata) VALUES
('30000000-0000-4000-8000-000000900001', NULL, 'landing', 'landing/kahve-fali.svg', 'https://goldmoodastro.com/img/landing/kahve-fali.svg', 'image/svg+xml', 2352, 'kahve-fali.svg', 'landing', 'local', JSON_OBJECT('purpose','landing_cover','landing_key','kahve-fali','seed',1)),
('30000000-0000-4000-8000-000000900002', NULL, 'landing', 'landing/ruya-tabiri.svg', 'https://goldmoodastro.com/img/landing/ruya-tabiri.svg', 'image/svg+xml', 1942, 'ruya-tabiri.svg', 'landing', 'local', JSON_OBJECT('purpose','landing_cover','landing_key','ruya-tabiri','seed',1)),
('30000000-0000-4000-8000-000000900003', NULL, 'landing', 'landing/birth-chart.svg', 'https://goldmoodastro.com/img/landing/birth-chart.svg', 'image/svg+xml', 2270, 'birth-chart.svg', 'landing', 'local', JSON_OBJECT('purpose','landing_cover','landing_key','birth-chart','seed',1)),
('30000000-0000-4000-8000-000000900004', NULL, 'landing', 'landing/numeroloji.svg', 'https://goldmoodastro.com/img/landing/numeroloji.svg', 'image/svg+xml', 1950, 'numeroloji.svg', 'landing', 'local', JSON_OBJECT('purpose','landing_cover','landing_key','numeroloji','seed',1)),
('30000000-0000-4000-8000-000000900005', NULL, 'landing', 'landing/yildizname.svg', 'https://goldmoodastro.com/img/landing/yildizname.svg', 'image/svg+xml', 1991, 'yildizname.svg', 'landing', 'local', JSON_OBJECT('purpose','landing_cover','landing_key','yildizname','seed',1)),
('30000000-0000-4000-8000-000000900006', NULL, 'landing', 'landing/tarot.svg', 'https://goldmoodastro.com/img/landing/tarot.svg', 'image/svg+xml', 2196, 'tarot.svg', 'landing', 'local', JSON_OBJECT('purpose','landing_cover','landing_key','tarot','seed',1)),
('30000000-0000-4000-8000-000000900007', NULL, 'landing', 'landing/sinastri.svg', 'https://goldmoodastro.com/img/landing/sinastri.svg', 'image/svg+xml', 2217, 'sinastri.svg', 'landing', 'local', JSON_OBJECT('purpose','landing_cover','landing_key','sinastri','seed',1)),
('30000000-0000-4000-8000-000000900008', NULL, 'landing', 'landing/pricing.svg', 'https://goldmoodastro.com/img/landing/pricing.svg', 'image/svg+xml', 1997, 'pricing.svg', 'landing', 'local', JSON_OBJECT('purpose','landing_cover','landing_key','pricing','seed',1))
ON DUPLICATE KEY UPDATE url = VALUES(url), mime = VALUES(mime), size = VALUES(size), name = VALUES(name);
