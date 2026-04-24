-- ============================================================
-- FILE: 171_menu_items_seed.sql (Energetische Massage — FINAL)
-- menu_items + menu_items_i18n (tr, en, de)
-- Header: Home, About (submenu: About + FAQs), Treatments (single link), Blog, Appointment
-- Footer: Quick Access, Treatments (1), Legal, Social
-- Standard:
--  ✅ NO SET @... constants
--  ✅ menu_items_i18n.id => UUID() (CHAR(36))
--  ✅ UPSERT relies on UNIQUE(menu_item_id, locale)
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

-- ============================================================
-- 0) CLEANUP — remove old items that no longer exist
-- ============================================================

-- Remove old CONTACT header/footer items
DELETE FROM menu_items_i18n
WHERE menu_item_id IN (
  '455c6ddf-658b-4c0f-8a9e-0b104708dd07', -- HEADER Contact (old)
  'b0d7d0c1-2c5d-4a9c-9d7f-0e2a6c6f1117'  -- FOOTER Contact (old)
);

DELETE FROM menu_items
WHERE id IN (
  '455c6ddf-658b-4c0f-8a9e-0b104708dd07',
  'b0d7d0c1-2c5d-4a9c-9d7f-0e2a6c6f1117'
);

-- Remove old treatment sub-items from header (dropdown no longer exists)
DELETE FROM menu_items_i18n
WHERE menu_item_id IN (
  '5a000001-1111-4111-8111-5a0000000001',
  '5a000002-1111-4111-8111-5a0000000002',
  '5a000003-1111-4111-8111-5a0000000003',
  '5a000004-1111-4111-8111-5a0000000004',
  '5a000005-1111-4111-8111-5a0000000005',
  '5a000006-1111-4111-8111-5a0000000006'
);

DELETE FROM menu_items
WHERE id IN (
  '5a000001-1111-4111-8111-5a0000000001',
  '5a000002-1111-4111-8111-5a0000000002',
  '5a000003-1111-4111-8111-5a0000000003',
  '5a000004-1111-4111-8111-5a0000000004',
  '5a000005-1111-4111-8111-5a0000000005',
  '5a000006-1111-4111-8111-5a0000000006'
);

-- Remove old footer treatment items (keep only 01, remove 02-06)
DELETE FROM menu_items_i18n
WHERE menu_item_id IN (
  'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111102',
  'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111103',
  'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111104',
  'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111105',
  'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111106'
);

DELETE FROM menu_items
WHERE id IN (
  'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111102',
  'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111103',
  'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111104',
  'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111105',
  'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111106'
);

-- ============================================================
-- 1) PARENT (menu_items)
-- ============================================================
INSERT INTO `menu_items`
(`id`, `parent_id`, `location`, `section_id`, `type`, `page_id`, `icon`, `order_num`, `is_active`)
VALUES
-- ------------------------
-- HEADER ROOT
-- ------------------------
('fe8120b3-919a-49b8-8035-df6fd2a2433f', NULL, 'header', NULL, 'custom', NULL, NULL, 0, 1), -- Home
('25740da6-c0f2-4c1d-b131-998018699bfd', NULL, 'header', NULL, 'custom', NULL, NULL, 1, 1), -- About (dropdown parent)
('c47a1c3f-cea1-4780-9381-77336bc8ac59', NULL, 'header', NULL, 'custom', NULL, NULL, 2, 1), -- Treatments (single link, no dropdown)
('555c6ddf-658b-4c0f-8a9e-0b104708dd01', NULL, 'header', NULL, 'custom', NULL, NULL, 3, 1), -- Blog
('8a2a7c1a-1111-4a11-8a11-8a2a7c1a0001', NULL, 'header', NULL, 'custom', NULL, NULL, 4, 1), -- Appointment

-- ------------------------
-- ABOUT SUBMENUS (About + FAQs)
-- ------------------------
('aaaa1111-2222-3333-4444-555555555555', '25740da6-c0f2-4c1d-b131-998018699bfd', 'header', NULL, 'custom', NULL, NULL, 0, 1), -- About
('aaaa1111-2222-3333-4444-999999999999', '25740da6-c0f2-4c1d-b131-998018699bfd', 'header', NULL, 'custom', NULL, NULL, 1, 1), -- FAQs

-- ------------------------
-- FOOTER: QUICK ACCESS
-- section_id = Quick Access (5958...)
-- ------------------------
('6a4f6b37-ed99-4d98-8c54-d658096aacde', NULL, 'footer', '59583ef1-0ba1-4c7c-b806-84fd204b52b9', 'custom', NULL, NULL, 0, 1), -- FAQs
('b0d7d0c1-2c5d-4a9c-9d7f-0e2a6c6f1111', NULL, 'footer', '59583ef1-0ba1-4c7c-b806-84fd204b52b9', 'custom', NULL, NULL, 1, 1), -- About
('8a2a7c1a-1111-4a11-8a11-8a2a7c1a0002', NULL, 'footer', '59583ef1-0ba1-4c7c-b806-84fd204b52b9', 'custom', NULL, NULL, 2, 1), -- Appointment
('555c6ddf-658b-4c0f-8a9e-0b104708dd02', NULL, 'footer', '59583ef1-0ba1-4c7c-b806-84fd204b52b9', 'custom', NULL, NULL, 3, 1), -- Blog
('b0d7d0c1-2c5d-4a9c-9d7f-0e2a6c6f1112', NULL, 'footer', '59583ef1-0ba1-4c7c-b806-84fd204b52b9', 'custom', NULL, NULL, 4, 1), -- Contact

-- ------------------------
-- FOOTER: TREATMENTS (single link)
-- section_id = Treatments (a0e2...)
-- ------------------------
('c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111101', NULL, 'footer', 'a0e2b2a9-7f0d-4f30-9a64-3ed7bd1d3c10', 'custom', NULL, NULL, 0, 1),

-- ------------------------
-- FOOTER: LEGAL
-- section_id = Legal (f942...)
-- ------------------------
('71c28444-7b6e-47ae-92be-f59206a1b820', NULL, 'footer', 'f942a930-6743-4ecc-b4b3-1fd6b77f9d77', 'custom', NULL, NULL, 0, 1), -- Privacy Policy
('24c49639-01d0-4274-8fb9-c31ed64d0726', NULL, 'footer', 'f942a930-6743-4ecc-b4b3-1fd6b77f9d77', 'custom', NULL, NULL, 1, 1), -- Terms
('c3d4e5f6-a7b8-4c9d-8012-impressum001', NULL, 'footer', 'f942a930-6743-4ecc-b4b3-1fd6b77f9d77', 'custom', NULL, NULL, 2, 1), -- Impressum
('c3d4e5f6-a7b8-4c9d-8012-cookiepol001', NULL, 'footer', 'f942a930-6743-4ecc-b4b3-1fd6b77f9d77', 'custom', NULL, NULL, 3, 1), -- Cookie Policy

-- ------------------------
-- FOOTER: SOCIAL
-- section_id = Social (b3b7...)
-- ------------------------
('a9b1c2d3-e4f5-4a66-8b11-111111111111', NULL, 'footer', 'b3b7e7b2-7d75-4c5f-9b9d-8f0d3c1a0d77', 'custom', NULL, 'instagram', 0, 1),
('a9b1c2d3-e4f5-4a66-8b11-333333333333', NULL, 'footer', 'b3b7e7b2-7d75-4c5f-9b9d-8f0d3c1a0d77', 'custom', NULL, 'youtube', 1, 1)
ON DUPLICATE KEY UPDATE
  `parent_id`  = VALUES(`parent_id`),
  `location`   = VALUES(`location`),
  `section_id` = VALUES(`section_id`),
  `type`       = VALUES(`type`),
  `page_id`    = VALUES(`page_id`),
  `icon`       = VALUES(`icon`),
  `order_num`  = VALUES(`order_num`),
  `is_active`  = VALUES(`is_active`),
  `updated_at` = CURRENT_TIMESTAMP(3);

-- ============================================================
-- 2) I18N (tr)
-- ============================================================
INSERT INTO `menu_items_i18n`
(`id`, `menu_item_id`, `locale`, `title`, `url`, `created_at`, `updated_at`)
VALUES
-- HEADER ROOT
(UUID(),'fe8120b3-919a-49b8-8035-df6fd2a2433f','tr','Anasayfa','/','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'25740da6-c0f2-4c1d-b131-998018699bfd','tr','Hakkımda','/about','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c47a1c3f-cea1-4780-9381-77336bc8ac59','tr','Masaj','/services/enerjetik-rahatlama-masaji','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'555c6ddf-658b-4c0f-8a9e-0b104708dd01','tr','Blog','/blog','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'8a2a7c1a-1111-4a11-8a11-8a2a7c1a0001','tr','Randevu','/appointment','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- ABOUT SUBMENU
(UUID(),'aaaa1111-2222-3333-4444-555555555555','tr','Hakkımda','/about','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'aaaa1111-2222-3333-4444-999999999999','tr','Sıkça Sorulan Sorular','/faqs','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: QUICK ACCESS (TR)
(UUID(),'6a4f6b37-ed99-4d98-8c54-d658096aacde','tr','SSS','/faqs','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'b0d7d0c1-2c5d-4a9c-9d7f-0e2a6c6f1111','tr','Hakkımda','/about','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'8a2a7c1a-1111-4a11-8a11-8a2a7c1a0002','tr','Randevu','/appointment','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'555c6ddf-658b-4c0f-8a9e-0b104708dd02','tr','Blog','/blog','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'b0d7d0c1-2c5d-4a9c-9d7f-0e2a6c6f1112','tr','İletişim','/contact','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: TREATMENTS (TR) — single link
(UUID(),'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111101','tr','Enerjetik Rahatlama Masajı','/services/enerjetik-rahatlama-masaji','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: LEGAL (TR)
(UUID(),'71c28444-7b6e-47ae-92be-f59206a1b820','tr','Gizlilik Politikası','/privacy-policy','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'24c49639-01d0-4274-8fb9-c31ed64d0726','tr','Kullanım Koşulları','/terms','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c3d4e5f6-a7b8-4c9d-8012-impressum001','tr','Yasal Bilgilendirme','/legal-notice','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c3d4e5f6-a7b8-4c9d-8012-cookiepol001','tr','Çerez Politikası','/cookie-policy','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: SOCIAL (TR)
(UUID(),'a9b1c2d3-e4f5-4a66-8b11-111111111111','tr','Instagram','https://www.instagram.com/energetischemassagebonn','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'a9b1c2d3-e4f5-4a66-8b11-333333333333','tr','YouTube','https://www.youtube.com/@energetischemassagebonn','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000')
ON DUPLICATE KEY UPDATE
  `title`      = VALUES(`title`),
  `url`        = VALUES(`url`),
  `updated_at` = CURRENT_TIMESTAMP(3);

-- ============================================================
-- 3) I18N (en)
-- ============================================================
INSERT INTO `menu_items_i18n`
(`id`, `menu_item_id`, `locale`, `title`, `url`, `created_at`, `updated_at`)
VALUES
-- HEADER ROOT
(UUID(),'fe8120b3-919a-49b8-8035-df6fd2a2433f','en','Home','/','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'25740da6-c0f2-4c1d-b131-998018699bfd','en','About','/about','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c47a1c3f-cea1-4780-9381-77336bc8ac59','en','Massage','/services/energetic-relaxation-massage','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'555c6ddf-658b-4c0f-8a9e-0b104708dd01','en','Blog','/blog','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'8a2a7c1a-1111-4a11-8a11-8a2a7c1a0001','en','Appointment','/appointment','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- ABOUT SUBMENU
(UUID(),'aaaa1111-2222-3333-4444-555555555555','en','About','/about','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'aaaa1111-2222-3333-4444-999999999999','en','FAQs','/faqs','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: QUICK ACCESS (EN)
(UUID(),'6a4f6b37-ed99-4d98-8c54-d658096aacde','en','FAQs','/faqs','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'b0d7d0c1-2c5d-4a9c-9d7f-0e2a6c6f1111','en','About','/about','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'8a2a7c1a-1111-4a11-8a11-8a2a7c1a0002','en','Appointment','/appointment','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'555c6ddf-658b-4c0f-8a9e-0b104708dd02','en','Blog','/blog','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'b0d7d0c1-2c5d-4a9c-9d7f-0e2a6c6f1112','en','Contact','/contact','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: TREATMENTS (EN) — single link
(UUID(),'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111101','en','Energetic Relaxation Massage','/services/energetic-relaxation-massage','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: LEGAL (EN)
(UUID(),'71c28444-7b6e-47ae-92be-f59206a1b820','en','Privacy Policy','/privacy-policy','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'24c49639-01d0-4274-8fb9-c31ed64d0726','en','Terms of Use','/terms','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c3d4e5f6-a7b8-4c9d-8012-impressum001','en','Legal Notice','/legal-notice','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c3d4e5f6-a7b8-4c9d-8012-cookiepol001','en','Cookie Policy','/cookie-policy','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: SOCIAL (EN)
(UUID(),'a9b1c2d3-e4f5-4a66-8b11-111111111111','en','Instagram','https://www.instagram.com/energetischemassagebonn','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'a9b1c2d3-e4f5-4a66-8b11-333333333333','en','YouTube','https://www.youtube.com/@energetischemassagebonn','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000')
ON DUPLICATE KEY UPDATE
  `title`      = VALUES(`title`),
  `url`        = VALUES(`url`),
  `updated_at` = CURRENT_TIMESTAMP(3);

-- ============================================================
-- 4) I18N (de)
-- ============================================================
INSERT INTO `menu_items_i18n`
(`id`, `menu_item_id`, `locale`, `title`, `url`, `created_at`, `updated_at`)
VALUES
-- HEADER ROOT
(UUID(),'fe8120b3-919a-49b8-8035-df6fd2a2433f','de','Startseite','/','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'25740da6-c0f2-4c1d-b131-998018699bfd','de','Über mich','/about','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c47a1c3f-cea1-4780-9381-77336bc8ac59','de','Massage','/services/energetische-entspannungsmassage','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'555c6ddf-658b-4c0f-8a9e-0b104708dd01','de','Blog','/blog','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'8a2a7c1a-1111-4a11-8a11-8a2a7c1a0001','de','Termin','/appointment','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- ABOUT SUBMENU
(UUID(),'aaaa1111-2222-3333-4444-555555555555','de','Über mich','/about','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'aaaa1111-2222-3333-4444-999999999999','de','FAQ','/faqs','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: QUICK ACCESS (DE)
(UUID(),'6a4f6b37-ed99-4d98-8c54-d658096aacde','de','FAQ','/faqs','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'b0d7d0c1-2c5d-4a9c-9d7f-0e2a6c6f1111','de','Über mich','/about','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'8a2a7c1a-1111-4a11-8a11-8a2a7c1a0002','de','Termin','/appointment','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'555c6ddf-658b-4c0f-8a9e-0b104708dd02','de','Blog','/blog','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'b0d7d0c1-2c5d-4a9c-9d7f-0e2a6c6f1112','de','Kontakt','/contact','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: TREATMENTS (DE) — single link
(UUID(),'c9a7e2a1-0b6b-45e9-9b8c-3f6d2a111101','de','Energetische Entspannungsmassage','/services/energetische-entspannungsmassage','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: LEGAL (DE)
(UUID(),'71c28444-7b6e-47ae-92be-f59206a1b820','de','Datenschutzerklärung','/privacy-policy','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'24c49639-01d0-4274-8fb9-c31ed64d0726','de','Nutzungsbedingungen','/terms','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c3d4e5f6-a7b8-4c9d-8012-impressum001','de','Impressum','/legal-notice','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'c3d4e5f6-a7b8-4c9d-8012-cookiepol001','de','Cookie-Richtlinie','/cookie-policy','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- FOOTER: SOCIAL (DE)
(UUID(),'a9b1c2d3-e4f5-4a66-8b11-111111111111','de','Instagram','https://www.instagram.com/energetischemassagebonn','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'a9b1c2d3-e4f5-4a66-8b11-333333333333','de','YouTube','https://www.youtube.com/@energetischemassagebonn','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000')
ON DUPLICATE KEY UPDATE
  `title`      = VALUES(`title`),
  `url`        = VALUES(`url`),
  `updated_at` = CURRENT_TIMESTAMP(3);

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
