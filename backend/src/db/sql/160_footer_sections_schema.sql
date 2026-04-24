-- =============================================================
-- FILE: 160_footer_sections_schema.sql
-- Footer Sections schema (parent + i18n)
-- konigsmassage - FIXED
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `footer_sections_i18n`;
DROP TABLE IF EXISTS `footer_sections`;

-- Parent tablo
CREATE TABLE IF NOT EXISTS `footer_sections` (
  `id`            CHAR(36)     NOT NULL,
  `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
  `display_order` INT(11)      NOT NULL DEFAULT 0,

  `created_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                               ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  KEY `footer_sections_active_idx`  (`is_active`),
  KEY `footer_sections_order_idx`   (`display_order`),
  KEY `footer_sections_created_idx` (`created_at`),
  KEY `footer_sections_updated_idx` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- i18n tablo
CREATE TABLE IF NOT EXISTS `footer_sections_i18n` (
  `id`          CHAR(36)     NOT NULL,
  `section_id`  CHAR(36)     NOT NULL,
  `locale`      VARCHAR(10)  NOT NULL,
  `title`       VARCHAR(150) NOT NULL,
  `slug`        VARCHAR(255) NOT NULL,
  `description` LONGTEXT     DEFAULT NULL,

  `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                              ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  UNIQUE KEY `ux_footer_sections_i18n_section_locale` (`section_id`, `locale`),
  UNIQUE KEY `ux_footer_sections_i18n_locale_slug`    (`locale`, `slug`),

  KEY `footer_sections_i18n_locale_idx` (`locale`),
  KEY `footer_sections_i18n_title_idx`  (`title`),

  CONSTRAINT `fk_footer_sections_i18n_section`
    FOREIGN KEY (`section_id`) REFERENCES `footer_sections` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
