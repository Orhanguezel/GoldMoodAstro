-- 80_contact_messages.sql
SET NAMES utf8mb4;
SET time_zone = '+00:00';

DROP TABLE IF EXISTS `contact_messages`;

CREATE TABLE `contact_messages` (
  `id`           CHAR(36)      NOT NULL,
  `name`         VARCHAR(255)  NOT NULL,
  `email`        VARCHAR(255)  NOT NULL,
  `phone`        VARCHAR(64)   NOT NULL,
  `subject`      VARCHAR(255)  NOT NULL,
  `message`      LONGTEXT      NOT NULL,

  `status`       VARCHAR(32)   NOT NULL DEFAULT 'new', -- 'new' | 'in_progress' | 'closed'
  `is_resolved`  TINYINT(1)    NOT NULL DEFAULT 0,

  `admin_note`   VARCHAR(2000) DEFAULT NULL,

  `ip`           VARCHAR(64)   DEFAULT NULL,
  `user_agent`   VARCHAR(512)  DEFAULT NULL,
  `website`      VARCHAR(255)  DEFAULT NULL,

  `created_at`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                               ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  -- Drizzle''daki index isimleriyle uyumlu
  KEY `idx_contact_created_at` (`created_at`),
  KEY `idx_contact_status`     (`status`),
  KEY `idx_contact_resolved`   (`is_resolved`),

  -- Ek performans indexleri (opsiyonel ama faydalı)
  KEY `idx_contact_updated_at` (`updated_at`),
  KEY `idx_contact_status_resolved_created`
      (`status`, `is_resolved`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `contact_messages`
(`id`,`name`,`email`,`phone`,`subject`,`message`,`status`,`is_resolved`,
 `admin_note`,`ip`,`user_agent`,`website`,`created_at`,`updated_at`)
VALUES
(
  '11111111-2222-3333-4444-555555555555',
  'Elif Koç',
  'elif@example.com',
  '+90 530 333 33 44',
  'Özel tasarım mezar',
  'Modern tasarım granit mezar için görsel ve fiyat bilgisi rica ediyorum.',
  'new',
  0,
  NULL,
  NULL,
  NULL,
  NULL,
  '2024-01-05 14:20:00.000',
  '2024-01-05 14:20:00.000'
)
ON DUPLICATE KEY UPDATE
  `name`       = VALUES(`name`),
  `email`      = VALUES(`email`),
  `phone`      = VALUES(`phone`),
  `subject`    = VALUES(`subject`),
  `message`    = VALUES(`message`),
  `status`     = VALUES(`status`),
  `is_resolved`= VALUES(`is_resolved`),
  `admin_note` = VALUES(`admin_note`),
  `ip`         = VALUES(`ip`),
  `user_agent` = VALUES(`user_agent`),
  `website`    = VALUES(`website`),
  `updated_at` = VALUES(`updated_at`);
