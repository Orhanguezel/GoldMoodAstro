-- =============================================================
-- FILE: 220_popups.sql
-- Popups module schema (parent + i18n)
-- =============================================================

CREATE TABLE IF NOT EXISTS `popups` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,

  `type` VARCHAR(30) NOT NULL DEFAULT 'topbar',

  -- legacy fallback text fields
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NULL,

  `background_color` VARCHAR(30) NULL,
  `text_color` VARCHAR(30) NULL,

  `button_text` VARCHAR(100) NULL,
  `button_color` VARCHAR(30) NULL,
  `button_hover_color` VARCHAR(30) NULL,
  `button_text_color` VARCHAR(30) NULL,

  `link_url` VARCHAR(500) NULL,
  `link_target` VARCHAR(20) NOT NULL DEFAULT '_self',
  `target_paths` TEXT NULL,

  `image_url` TEXT NULL,
  `image_asset_id` CHAR(36) NULL,
  `alt` VARCHAR(255) NULL,

  `text_behavior` VARCHAR(20) NOT NULL DEFAULT 'marquee',
  `scroll_speed` INT UNSIGNED NOT NULL DEFAULT 60,

  `closeable` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `delay_seconds` INT UNSIGNED NOT NULL DEFAULT 0,
  `display_frequency` VARCHAR(20) NOT NULL DEFAULT 'always',

  `is_active` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `display_order` INT UNSIGNED NOT NULL DEFAULT 0,

  `start_at` DATETIME(3) NULL,
  `end_at` DATETIME(3) NULL,

  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_popup_uuid` (`uuid`),
  KEY `idx_popup_type` (`type`),
  KEY `idx_popup_active` (`is_active`),
  KEY `idx_popup_order` (`display_order`),
  KEY `idx_popup_img_asset` (`image_asset_id`),

  CONSTRAINT `fk_popup_image_asset`
    FOREIGN KEY (`image_asset_id`) REFERENCES `storage_assets` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `popups_i18n` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `popup_id` INT UNSIGNED NOT NULL,
  `locale` VARCHAR(10) NOT NULL,

  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NULL,
  `button_text` VARCHAR(100) NULL,
  `alt` VARCHAR(255) NULL,

  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_popup_i18n_popup_locale` (`popup_id`, `locale`),
  KEY `idx_popup_i18n_locale` (`locale`),
  KEY `idx_popup_i18n_title` (`title`),

  CONSTRAINT `fk_popup_i18n_popup`
    FOREIGN KEY (`popup_id`) REFERENCES `popups` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
