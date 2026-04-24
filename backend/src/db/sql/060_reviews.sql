-- =============================================================
-- FILE: 060_reviews.sql  (FINAL / CLEAN / NO DROP)
-- Çok dilli review modülü (generic + custom_pages uyumlu)
-- ✅ NO DROP
-- ✅ IF NOT EXISTS
-- ✅ MariaDB + MySQL uyumlu
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- =============================================================
-- PARENT TABLO: reviews
-- =============================================================
CREATE TABLE IF NOT EXISTS `reviews` (
  `id`               CHAR(36)      NOT NULL,

  `target_type`      VARCHAR(50)   NOT NULL,          -- 'custom_page', 'product', 'service' vs.
  `target_id`        CHAR(36)      NOT NULL,          -- custom_pages.id, products.id, ...

  `name`             VARCHAR(255)  NOT NULL,
  `email`            VARCHAR(255)  NOT NULL,

  `rating`           TINYINT       NOT NULL,          -- 1..5
  `is_active`        TINYINT(1)    NOT NULL DEFAULT 1,
  `is_approved`      TINYINT(1)    NOT NULL DEFAULT 0,
  `display_order`    INT           NOT NULL DEFAULT 0,

  `likes_count`      INT           NOT NULL DEFAULT 0,
  `dislikes_count`   INT           NOT NULL DEFAULT 0,
  `helpful_count`    INT           NOT NULL DEFAULT 0,

  `submitted_locale` VARCHAR(10)   NOT NULL DEFAULT 'tr',

  -- Testimonial alanlari
  `role`             VARCHAR(255)           DEFAULT NULL,
  `company`          VARCHAR(255)           DEFAULT NULL,
  `avatar_url`       VARCHAR(500)           DEFAULT NULL,
  `logo_url`         VARCHAR(500)           DEFAULT NULL,
  `profile_href`     VARCHAR(500)           DEFAULT NULL,

  `created_at`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                          ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  KEY `reviews_target_idx`        (`target_type`, `target_id`),
  KEY `reviews_rating_idx`        (`rating`),
  KEY `reviews_active_idx`        (`is_active`),
  KEY `reviews_approved_idx`      (`is_approved`),
  KEY `reviews_display_order_idx` (`display_order`),
  KEY `reviews_created_idx`       (`created_at`),
  KEY `reviews_updated_idx`       (`updated_at`),
  KEY `reviews_helpful_idx`       (`helpful_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- I18N TABLO: review_i18n
-- =============================================================
CREATE TABLE IF NOT EXISTS `review_i18n` (
  `id`          CHAR(36)      NOT NULL,
  `review_id`   CHAR(36)      NOT NULL,
  `locale`      VARCHAR(10)   NOT NULL,

  `title`       VARCHAR(255)  DEFAULT NULL,
  `comment`     LONGTEXT      NOT NULL,
  `admin_reply` LONGTEXT      DEFAULT NULL,

  `created_at`  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                     ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  UNIQUE KEY `ux_review_i18n_review_locale` (`review_id`, `locale`),
  KEY `review_i18n_review_idx` (`review_id`),
  KEY `review_i18n_locale_idx` (`locale`),

  CONSTRAINT `fk_review_i18n_review`
    FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
