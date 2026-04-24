-- =============================================================
-- FILE: 161_footer_sections_seed.sql (Energetische Massage — FINAL)
-- footer_sections + footer_sections_i18n (tr, en, de)
-- Sections: Quick Access, Treatments, Legal, Social
-- Idempotent seed
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

-- ============================================================
-- 1) PARENT (footer_sections)
-- ============================================================
INSERT INTO `footer_sections`
(`id`, `is_active`, `display_order`, `created_at`, `updated_at`)
VALUES
-- Quick Access
('59583ef1-0ba1-4c7c-b806-84fd204b52b9', 1, 0, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

-- Treatments
('a0e2b2a9-7f0d-4f30-9a64-3ed7bd1d3c10', 1, 1, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

-- Legal
('f942a930-6743-4ecc-b4b3-1fd6b77f9d77', 1, 2, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),

-- Social
('b3b7e7b2-7d75-4c5f-9b9d-8f0d3c1a0d77', 1, 3, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000')
ON DUPLICATE KEY UPDATE
  `is_active`     = VALUES(`is_active`),
  `display_order` = VALUES(`display_order`),
  `updated_at`    = CURRENT_TIMESTAMP(3);

-- ============================================================
-- 2) I18N (tr/en/de) — UNIQUE(section_id, locale)
-- ============================================================
INSERT INTO `footer_sections_i18n`
(`id`, `section_id`, `locale`, `title`, `slug`, `description`, `created_at`, `updated_at`)
VALUES
-- TR
(UUID(),'59583ef1-0ba1-4c7c-b806-84fd204b52b9','tr','Hızlı Erişim','hizli-erisim','Sık kullanılan sayfalara hızlı erişim.','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'a0e2b2a9-7f0d-4f30-9a64-3ed7bd1d3c10','tr','Hizmetler','hizmetler','Enerjetik masaj ve seans seçeneklerimiz.','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'f942a930-6743-4ecc-b4b3-1fd6b77f9d77','tr','Yasal','yasal','Gizlilik, koşullar ve bilgilendirmeler.','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'b3b7e7b2-7d75-4c5f-9b9d-8f0d3c1a0d77','tr','Sosyal','sosyal','Sosyal medya kanallarımız.','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- EN
(UUID(),'59583ef1-0ba1-4c7c-b806-84fd204b52b9','en','Quick Access','quick-access','Quick links to frequently used pages.','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'a0e2b2a9-7f0d-4f30-9a64-3ed7bd1d3c10','en','Treatments','treatments','Our energetic massage and session options.','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'f942a930-6743-4ecc-b4b3-1fd6b77f9d77','en','Legal','legal','Privacy, terms and disclosures.','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'b3b7e7b2-7d75-4c5f-9b9d-8f0d3c1a0d77','en','Social','social','Our social channels.','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- DE
(UUID(),'59583ef1-0ba1-4c7c-b806-84fd204b52b9','de','Schnellzugriff','schnellzugriff','Schnelle Links zu häufig genutzten Seiten.','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'a0e2b2a9-7f0d-4f30-9a64-3ed7bd1d3c10','de','Behandlungen','behandlungen','Energetische Massage und Behandlungsoptionen in Bonn.','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'f942a930-6743-4ecc-b4b3-1fd6b77f9d77','de','Rechtliches','rechtliches','Datenschutz, Bedingungen und Hinweise.','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),
(UUID(),'b3b7e7b2-7d75-4c5f-9b9d-8f0d3c1a0d77','de','Social Media','social-media','Unsere Social-Media-Kanäle.','2024-01-01 00:00:00.000','2024-01-01 00:00:00.000')
ON DUPLICATE KEY UPDATE
  `title`       = VALUES(`title`),
  `slug`        = VALUES(`slug`),
  `description` = VALUES(`description`),
  `updated_at`  = CURRENT_TIMESTAMP(3);

COMMIT;
