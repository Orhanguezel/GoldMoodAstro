-- =============================================================
-- FILE: 040.1_site_meta.sql  (FINAL / DRY OG IMAGE) — FIX 1093
-- Energetische Massage - Default Meta + Global SEO (NEW STANDARD)
--  - FIX: avoids MySQL ER_UPDATE_TABLE_USED (1093)
--    * no SELECT from site_settings inside INSERT/UPDATE statements
--    * reuses variables for seo/site_seo payloads
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

START TRANSACTION;

-- -------------------------------------------------------------
-- TABLE GUARD
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id`         CHAR(36)      NOT NULL,
  `key`        VARCHAR(100)  NOT NULL,
  `locale`     VARCHAR(8)    NOT NULL,
  `value`      TEXT          NOT NULL,
  `created_at` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_settings_key_locale_uq` (`key`, `locale`),
  KEY `site_settings_key_idx` (`key`),
  KEY `site_settings_locale_idx` (`locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Helpers — OG DEFAULT (single source)
-- NOTE: This SELECT is OK because it is NOT inside an INSERT statement.
-- -------------------------------------------------------------
SET @OG_DEFAULT := COALESCE(
  (
    SELECT COALESCE(
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(`value`, '$.url')), ''),
      NULLIF(`value`, '')
    )
    FROM `site_settings`
    WHERE `key` = 'site_og_default_image'
      AND `locale` = '*'
    ORDER BY `updated_at` DESC
    LIMIT 1
  ),
  '/img/og-default.jpg'
);

-- -------------------------------------------------------------
-- Title policies
-- -------------------------------------------------------------
SET @SITE_NAME_GLOBAL := 'Energetische Massage';
SET @TITLE_GLOBAL := 'Energetische Massage - Energetische Massage in Bonn';

SET @BRAND_TR := 'Energetische Massage - Bonn''da Enerjetik Masaj';
SET @BRAND_EN := 'Energetische Massage - Energetic Massage in Bonn';
SET @BRAND_DE := 'Energetische Massage - Energetische Massage in Bonn';

-- Descriptions (<= ~160 chars target)
SET @DESC_TR := 'Bonn''da enerjetik masaj: bilinçli dokunuş, net sınırlar ve derin gevşeme. Seanslar ön görüşme ile, randevuya göre.';
SET @DESC_EN := 'Energetic massage sessions in Bonn with mindful touch, clear boundaries, and deep relaxation. Appointments by arrangement.';
SET @DESC_DE := 'Energetische Massage in Bonn - achtsame Berührung, klare Grenzen und tiefe Entspannung. Termine nach Vereinbarung.';
SET @DESC_GLOBAL := 'Energetic massage sessions in Bonn with mindful touch, clear boundaries, and deep relaxation. Appointments by arrangement.';

SET @KW_GLOBAL := 'Energetische Massage, energetische Massage, Bonn, Anastasia König, Entspannungsmassage, Thai Yoga Massage, Aroma-Energie, Fußreflex, Körperwahrnehmung, Termin';

-- -------------------------------------------------------------
-- Build JSON payloads ONCE (so we can reuse for seo + site_seo)
-- -------------------------------------------------------------
SET @SEO_GLOBAL := CAST(
  JSON_OBJECT(
    'site_name',      @SITE_NAME_GLOBAL,
    'title_default',  @TITLE_GLOBAL,
    'title_template', '%s - Energetische Massage',
    'description',    @DESC_GLOBAL,
    'open_graph', JSON_OBJECT(
      'type',   'website',
      'images', JSON_ARRAY(@OG_DEFAULT)
    ),
    'twitter', JSON_OBJECT(
      'card',    'summary_large_image',
      'site',    '',
      'creator', ''
    ),
    'robots', JSON_OBJECT(
      'noindex', false,
      'index',   true,
      'follow',  true
    )
  ) AS CHAR CHARACTER SET utf8mb4
);

SET @SEO_TR := CAST(
  JSON_OBJECT(
    'site_name',      @SITE_NAME_GLOBAL,
    'title_default',  @BRAND_TR,
    'title_template', '%s - Energetische Massage',
    'description',    @DESC_TR,
    'open_graph', JSON_OBJECT('type','website','images', JSON_ARRAY(@OG_DEFAULT)),
    'twitter',   JSON_OBJECT('card','summary_large_image','site','','creator',''),
    'robots',    JSON_OBJECT('noindex', false,'index', true,'follow', true)
  ) AS CHAR CHARACTER SET utf8mb4
);

SET @SEO_EN := CAST(
  JSON_OBJECT(
    'site_name',      @SITE_NAME_GLOBAL,
    'title_default',  @BRAND_EN,
    'title_template', '%s - Energetische Massage',
    'description',    @DESC_EN,
    'open_graph', JSON_OBJECT('type','website','images', JSON_ARRAY(@OG_DEFAULT)),
    'twitter',   JSON_OBJECT('card','summary_large_image','site','','creator',''),
    'robots',    JSON_OBJECT('noindex', false,'index', true,'follow', true)
  ) AS CHAR CHARACTER SET utf8mb4
);

SET @SEO_DE := CAST(
  JSON_OBJECT(
    'site_name',      @SITE_NAME_GLOBAL,
    'title_default',  @BRAND_DE,
    'title_template', '%s - Energetische Massage',
    'description',    @DESC_DE,
    'open_graph', JSON_OBJECT('type','website','images', JSON_ARRAY(@OG_DEFAULT)),
    'twitter',   JSON_OBJECT('card','summary_large_image','site','','creator',''),
    'robots',    JSON_OBJECT('noindex', false,'index', true,'follow', true)
  ) AS CHAR CHARACTER SET utf8mb4
);

-- =============================================================
-- GLOBAL SEO DEFAULTS (locale='*')
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(UUID(), 'seo',      '*', @SEO_GLOBAL, NOW(3), NOW(3)),
(UUID(), 'site_seo', '*', @SEO_GLOBAL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- LOCALIZED SEO OVERRIDES (tr/en/de)
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(UUID(), 'seo',      'tr', @SEO_TR, NOW(3), NOW(3)),
(UUID(), 'site_seo', 'tr', @SEO_TR, NOW(3), NOW(3)),
(UUID(), 'seo',      'en', @SEO_EN, NOW(3), NOW(3)),
(UUID(), 'site_seo', 'en', @SEO_EN, NOW(3), NOW(3)),
(UUID(), 'seo',      'de', @SEO_DE, NOW(3), NOW(3)),
(UUID(), 'site_seo', 'de', @SEO_DE, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- site_meta_default (fallback meta)
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  UUID(),
  'site_meta_default',
  '*',
  CAST(JSON_OBJECT(
    'title',       @TITLE_GLOBAL,
    'description', @DESC_GLOBAL,
    'keywords',    @KW_GLOBAL
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'site_meta_default',
  'tr',
  CAST(JSON_OBJECT(
    'title',       @BRAND_TR,
    'description', @DESC_TR,
    'keywords',    'Energetische Massage, enerjetik masaj, Bonn, Anastasia König, rahatlama, beden farkındalığı, Thai Yoga, aroma, ayak refleks, randevu'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'site_meta_default',
  'en',
  CAST(JSON_OBJECT(
    'title',       @BRAND_EN,
    'description', @DESC_EN,
    'keywords',    'Energetische Massage, energetic massage, Bonn, Anastasia König, relaxation, body awareness, Thai yoga massage, aroma energy, foot reflex, appointment'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'site_meta_default',
  'de',
  CAST(JSON_OBJECT(
    'title',       @BRAND_DE,
    'description', @DESC_DE,
    'keywords',    'Energetische Massage, energetische Massage, Bonn, Anastasia König, Entspannung, Körperwahrnehmung, Thai Yoga Massage, Aroma-Energie, Fußreflex, Termin'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
