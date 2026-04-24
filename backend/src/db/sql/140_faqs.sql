-- =============================================================
-- 140_faqs.sql (FINAL)
-- Multilingual FAQs (faqs + faqs_i18n)
-- ✅ NO category_id / sub_category_id
-- ✅ Drizzle schema ile uyumlu
-- =============================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
SET time_zone = '+00:00';

SET FOREIGN_KEY_CHECKS = 0;

-- Eski yapıyı temizle (önce child, sonra parent)
DROP TABLE IF EXISTS `faqs_i18n`;
DROP TABLE IF EXISTS `faqs`;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================
-- PARENT TABLO: faqs (dil bağımsız)
-- =============================================================
CREATE TABLE `faqs` (
  `id`             CHAR(36)     NOT NULL,
  `is_active`      TINYINT(1)   NOT NULL DEFAULT 1,
  `display_order`  INT          NOT NULL DEFAULT 0,

  `created_at`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                  ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  KEY `faqs_active_idx`   (`is_active`),
  KEY `faqs_order_idx`    (`display_order`),
  KEY `faqs_created_idx`  (`created_at`),
  KEY `faqs_updated_idx`  (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- I18N TABLO: faqs_i18n (locale + soru/cevap)
-- =============================================================
CREATE TABLE `faqs_i18n` (
  `id`         CHAR(36)     NOT NULL,
  `faq_id`     CHAR(36)     NOT NULL,
  `locale`     VARCHAR(10)  NOT NULL,

  `question`   VARCHAR(500) NOT NULL,
  `answer`     LONGTEXT     NOT NULL,
  `slug`       VARCHAR(255) NOT NULL,

  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                              ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  UNIQUE KEY `ux_faqs_i18n_parent_locale` (`faq_id`, `locale`),
  UNIQUE KEY `ux_faqs_i18n_locale_slug`   (`locale`, `slug`),

  KEY `faqs_i18n_faq_idx`     (`faq_id`),
  KEY `faqs_i18n_locale_idx`  (`locale`),
  KEY `faqs_i18n_slug_idx`    (`slug`),

  CONSTRAINT `fk_faqs_i18n_faq`
    FOREIGN KEY (`faq_id`) REFERENCES `faqs`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
