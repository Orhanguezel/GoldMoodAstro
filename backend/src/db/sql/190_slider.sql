-- =============================================================
-- FILE: 190_slider.sql
-- Slider - parent + i18n (slider + slider_i18n)
-- Drizzle şeması ile birebir uyumlu
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

-- Önce i18n sonra parent
DROP TABLE IF EXISTS `slider_i18n`;
DROP TABLE IF EXISTS `slider`;

-- =============================================================
-- PARENT TABLO: slider
-- =============================================================
CREATE TABLE IF NOT EXISTS `slider` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid`              CHAR(36)     NOT NULL,

  `image_url`         TEXT,
  `image_asset_id`    CHAR(36),

  `featured`          TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
  `is_active`         TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,

  `display_order`     INT UNSIGNED NOT NULL DEFAULT 0,

  `created_at`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                    ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  UNIQUE KEY `uniq_slider_uuid`        (`uuid`),
  KEY `idx_slider_active`              (`is_active`),
  KEY `idx_slider_order`               (`display_order`),
  KEY `idx_slider_image_asset`         (`image_asset_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- I18N TABLO: slider_i18n
-- =============================================================
CREATE TABLE IF NOT EXISTS `slider_i18n` (
  `id`           INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `slider_id`    INT UNSIGNED   NOT NULL,
  `locale`       VARCHAR(8)     NOT NULL,

  `name`         VARCHAR(255)   NOT NULL,
  `slug`         VARCHAR(255)   NOT NULL,
  `description`  TEXT,

  `alt`          VARCHAR(255),
  `button_text`  VARCHAR(100),
  `button_link`  VARCHAR(255),

  PRIMARY KEY (`id`),

  UNIQUE KEY `uniq_slider_i18n_slider_locale` (`slider_id`,`locale`),
  UNIQUE KEY `uniq_slider_i18n_slug_locale`   (`slug`,`locale`),
  KEY `idx_slider_i18n_locale`                (`locale`),

  CONSTRAINT `fk_slider_i18n_slider`
    FOREIGN KEY (`slider_id`) REFERENCES `slider` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
