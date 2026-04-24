-- ===================================================================
-- FILE: 110_telegram_inbound_messages.schema.sql
-- Telegram inbound messages table (Energetische Massage)
-- ===================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `telegram_inbound_messages` (
  `id` CHAR(36) NOT NULL,

  `update_id` INT NOT NULL,
  `message_id` INT NULL,

  `chat_id` VARCHAR(64) NOT NULL,
  `chat_type` VARCHAR(32) NULL,
  `chat_title` VARCHAR(255) NULL,
  `chat_username` VARCHAR(255) NULL,

  `from_id` VARCHAR(64) NULL,
  `from_username` VARCHAR(255) NULL,
  `from_first_name` VARCHAR(255) NULL,
  `from_last_name` VARCHAR(255) NULL,
  `from_is_bot` INT NOT NULL DEFAULT 0,

  `text` TEXT NULL,
  `raw`  TEXT NULL,

  `telegram_date` INT NULL,

  `created_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),

  UNIQUE KEY `uq_tg_inbound_update_message` (`update_id`, `message_id`),
  KEY `idx_tg_inbound_chat_id` (`chat_id`),
  KEY `idx_tg_inbound_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
