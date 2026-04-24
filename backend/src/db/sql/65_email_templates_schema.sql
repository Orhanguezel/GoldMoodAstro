-- ============================================================
-- FILE: 65_email_templates_schema.sql
-- EMAIL_TEMPLATES (i18n) — SCHEMA ONLY
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

CREATE TABLE IF NOT EXISTS `email_templates` (
  `id`           CHAR(36)     NOT NULL,
  `template_key` VARCHAR(100) NOT NULL,

  `variables` LONGTEXT
    CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
    DEFAULT NULL,
  CONSTRAINT `ck_email_templates_variables_json`
    CHECK (`variables` IS NULL OR JSON_VALID(`variables`)),

  `is_active`  TINYINT(1)  NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
               ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_email_tpl_key` (`template_key`),
  KEY `ix_email_tpl_active` (`is_active`),
  KEY `ix_email_tpl_updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `email_templates_i18n` (
  `id`            CHAR(36)     NOT NULL,
  `template_id`   CHAR(36)     NOT NULL,
  `locale`        VARCHAR(10)  NOT NULL,
  `template_name` VARCHAR(150) NOT NULL,
  `subject`       VARCHAR(255) NOT NULL,
  `content`       LONGTEXT     NOT NULL,

  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
               ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_email_tpl_key_locale` (`template_id`, `locale`),
  KEY `ix_email_tpl_i18n_locale` (`locale`),
  KEY `ix_email_tpl_i18n_name` (`template_name`),

  CONSTRAINT `fk_email_tpl_i18n_template`
    FOREIGN KEY (`template_id`) REFERENCES `email_templates` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
