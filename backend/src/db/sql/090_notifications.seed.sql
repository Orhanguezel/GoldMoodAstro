-- 020_notifications_schema.sql
-- Notifications tablo şeması (drizzle schema.ts ile birebir uyumlu)

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = utf8mb4_unicode_ci;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         CHAR(36)      NOT NULL,
  `user_id`    CHAR(36)      NOT NULL,
  `title`      VARCHAR(255)  NOT NULL,
  `message`    TEXT          NOT NULL,
  `type`       VARCHAR(50)   NOT NULL,
  `is_read`    TINYINT(1)    NOT NULL DEFAULT 0,
  `created_at` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_id` (`user_id`),
  KEY `idx_notifications_user_read` (`user_id`, `is_read`),
  KEY `idx_notifications_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- 090_notifications.seed.sql
-- Notifications başlangıç kayıtları (admin kullanıcısına)

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = utf8mb4_unicode_ci;
SET time_zone = '+00:00';

INSERT INTO `notifications` (
  `id`,
  `user_id`,
  `title`,
  `message`,
  `type`,
  `is_read`,
  `created_at`
)
VALUES
(
  '11111111-1111-1111-1111-111111111111',
  '{{ADMIN_ID}}',  -- 003_make_admin.sql ile aynı placeholder
  'Hoş geldiniz!',
  'Hesabınız başarıyla oluşturuldu. İyi alışverişler!',
  'system',
  0,
  CURRENT_TIMESTAMP(3)
),
(
  '22222222-2222-2222-2222-222222222222',
  '{{ADMIN_ID}}',  -- admin kullanıcının ID''si
  'İlk sipariş fırsatı',
  'İlk siparişinizde ekstra indirim kazandınız. Sepette kupon kullanmayı unutmayın.',
  'custom',
  0,
  CURRENT_TIMESTAMP(3)
)
ON DUPLICATE KEY UPDATE
  `user_id`    = VALUES(`user_id`),
  `title`      = VALUES(`title`),
  `message`    = VALUES(`message`),
  `type`       = VALUES(`type`),
  `is_read`    = VALUES(`is_read`),
  `created_at` = VALUES(`created_at`);
