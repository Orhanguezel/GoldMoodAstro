-- =============================================================
-- FILE: 050_custom_pages.sql (FINAL — Energetische Massage)
-- Custom Pages (parent + i18n)
-- ✅ MySQL / MariaDB SAFE
-- ✅ NO DEFAULT on LONGTEXT
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- =============================================================
-- PARENT TABLE: custom_pages
-- =============================================================
CREATE TABLE IF NOT EXISTS `custom_pages` (
  `id`                       CHAR(36)      NOT NULL,

  `module_key`               VARCHAR(100)  NOT NULL DEFAULT '',
  `is_published`             TINYINT(1)    NOT NULL DEFAULT 0,
  `featured`                 TINYINT(1)    NOT NULL DEFAULT 0,

  `display_order`            INT           NOT NULL DEFAULT 0,
  `order_num`                INT           NOT NULL DEFAULT 0,

  `featured_image`           VARCHAR(500)  DEFAULT NULL,
  `featured_image_asset_id`  CHAR(36)      DEFAULT NULL,

  `image_url`                LONGTEXT      DEFAULT NULL,
  `storage_asset_id`         CHAR(36)      DEFAULT NULL,

  -- 🔒 JSON STRING (DEFAULT YOK — MYSQL RULE)
  `images`                   LONGTEXT      NOT NULL,
  `storage_image_ids`        LONGTEXT      NOT NULL,

  `created_at`               DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`               DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                          ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  KEY `custom_pages_module_key_idx`     (`module_key`),
  KEY `custom_pages_is_published_idx`   (`is_published`),
  KEY `custom_pages_featured_idx`       (`featured`),
  KEY `custom_pages_display_order_idx`  (`display_order`),
  KEY `custom_pages_order_num_idx`      (`order_num`),
  KEY `custom_pages_featured_asset_idx` (`featured_image_asset_id`),
  KEY `custom_pages_storage_asset_idx`  (`storage_asset_id`),
  KEY `custom_pages_created_idx`        (`created_at`),
  KEY `custom_pages_updated_idx`        (`updated_at`)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- I18N TABLE: custom_pages_i18n
-- =============================================================
CREATE TABLE IF NOT EXISTS `custom_pages_i18n` (
  `id`                  CHAR(36)      NOT NULL,
  `page_id`             CHAR(36)      NOT NULL,
  `locale`              VARCHAR(10)   NOT NULL,

  `title`               VARCHAR(255)  NOT NULL,
  `slug`                VARCHAR(255)  NOT NULL,

  -- JSON STRING (HTML wrapper)
  `content`             LONGTEXT      NOT NULL,

  `summary`             VARCHAR(1000) DEFAULT NULL,

  `featured_image_alt`  VARCHAR(255)  DEFAULT NULL,
  `meta_title`          VARCHAR(255)  DEFAULT NULL,
  `meta_description`    VARCHAR(500)  DEFAULT NULL,

  `tags`                VARCHAR(1000) DEFAULT NULL,

  `created_at`          DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`          DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                      ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  UNIQUE KEY `ux_custom_pages_i18n_parent_locale` (`page_id`, `locale`),
  UNIQUE KEY `ux_custom_pages_i18n_locale_slug`   (`locale`, `slug`),

  KEY `custom_pages_i18n_page_idx`   (`page_id`),
  KEY `custom_pages_i18n_locale_idx` (`locale`),
  KEY `custom_pages_i18n_slug_idx`   (`slug`),

  CONSTRAINT `fk_custom_pages_i18n_page`
    FOREIGN KEY (`page_id`)
    REFERENCES `custom_pages` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
