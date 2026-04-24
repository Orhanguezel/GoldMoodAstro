-- =============================================================
-- 120_bookings.sql (schema)
-- Bookings (NO booking_i18n, locale only)
-- - appointment_date: VARCHAR(10) "YYYY-MM-DD"  (code compatibility)
-- - appointment_time: VARCHAR(5)  "HH:mm"       (nullable)
-- - slot_id references availability.resource_slots(id) (nullable)
-- =============================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `bookings`;

CREATE TABLE `bookings` (
  `id`                  CHAR(36)      NOT NULL,

  -- customer
  `name`                VARCHAR(120)  NOT NULL,
  `email`               VARCHAR(190)  NOT NULL,
  `phone`               VARCHAR(32)   NOT NULL,

  -- customer locale only
  `locale`              VARCHAR(10)   NOT NULL DEFAULT 'de',

  `customer_message`    TEXT          NULL,

  -- subject (service)
  `service_id`          CHAR(36)      NULL,

  -- resource
  `resource_id`         CHAR(36)      NOT NULL,

  -- slot binding (availability.resource_slots.id)
  `slot_id`             CHAR(36)      NULL,

  -- keep as strings to match current TS schema
  `appointment_date`    VARCHAR(10)   NOT NULL, -- YYYY-MM-DD
  `appointment_time`    VARCHAR(5)    NULL,     -- HH:mm

  `status`              VARCHAR(24)   NOT NULL DEFAULT 'new',
  `is_read`             TINYINT(1)    NOT NULL DEFAULT 0,

  -- payment (optional — booking_payment_enabled site setting)
  `order_id`            CHAR(36)      NULL,
  `payment_status`      VARCHAR(24)   NULL DEFAULT 'none',

  `admin_note`          TEXT          NULL,
  `decided_at`          DATETIME(3)   NULL,
  `decided_by`          VARCHAR(120)  NULL,
  `decision_note`       TEXT          NULL,

  -- email tracking
  `email_last_sent_at`        DATETIME(3)  NULL,
  `email_last_template_key`   VARCHAR(120) NULL,
  `email_last_to`             VARCHAR(190) NULL,
  `email_last_subject`        VARCHAR(255) NULL,
  `email_last_error`          TEXT         NULL,

  `created_at`          DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`          DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                     ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  -- helpful indexes (match TS + list filters)
  KEY `bookings_created_idx` (`created_at`),
  KEY `bookings_status_idx` (`status`),
  KEY `bookings_email_idx`  (`email`),

  KEY `bookings_service_idx` (`service_id`),
  KEY `bookings_resource_idx` (`resource_id`),
  KEY `bookings_resource_date_time_idx` (`resource_id`,`appointment_date`,`appointment_time`),

  KEY `bookings_slot_idx` (`slot_id`),
  KEY `bookings_date_idx` (`appointment_date`),
  KEY `bookings_date_time_idx` (`appointment_date`,`appointment_time`),
  KEY `bookings_locale_idx` (`locale`),

  -- basic data quality guards (MySQL 8+ enforces CHECK)
  CONSTRAINT `chk_bookings_appointment_date_fmt`
    CHECK (`appointment_date` REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  CONSTRAINT `chk_bookings_appointment_time_fmt`
    CHECK (`appointment_time` IS NULL OR `appointment_time` REGEXP '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  CONSTRAINT `chk_bookings_locale_len`
    CHECK (CHAR_LENGTH(`locale`) BETWEEN 2 AND 10),

  -- FKs (optional but strongly recommended)
  CONSTRAINT `fk_bookings_resource`
    FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `fk_bookings_slot`
    FOREIGN KEY (`slot_id`) REFERENCES `resource_slots`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE

  -- NOTE: service_id FK is omitted because services table detail is not shown here.
  -- You can add it later if you have services(id) with same CHAR(36).
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
