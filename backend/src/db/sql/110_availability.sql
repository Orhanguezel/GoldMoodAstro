-- =============================================================
-- 110_availability.schema.sql (FINAL — HARDENED)
-- Availability: resource_working_hours + resource_slots + slot_reservations
-- =============================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
SET time_zone = '+00:00';

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `slot_reservations`;
DROP TABLE IF EXISTS `resource_slots`;
DROP TABLE IF EXISTS `resource_working_hours`;

-- ================= TABLE: resource_working_hours =================
CREATE TABLE `resource_working_hours` (
  `id`            CHAR(36)     NOT NULL,
  `resource_id`   CHAR(36)     NOT NULL,
  `dow`           TINYINT      NOT NULL COMMENT '1..7 (Mon..Sun)',

  `start_time`    TIME         NOT NULL,
  `end_time`      TIME         NOT NULL,

  `slot_minutes`  INT          NOT NULL DEFAULT 60,
  `break_minutes` INT          NOT NULL DEFAULT 0,
  `capacity`      INT          NOT NULL DEFAULT 1,

  `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,

  `created_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                               ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  KEY `rwh_resource_idx` (`resource_id`),
  KEY `rwh_dow_idx`      (`dow`),
  KEY `rwh_active_idx`   (`is_active`),

  UNIQUE KEY `ux_rwh_unique` (`resource_id`,`dow`,`start_time`,`end_time`),

  CONSTRAINT `chk_rwh_dow` CHECK (`dow` BETWEEN 1 AND 7),
  CONSTRAINT `chk_rwh_time_order` CHECK (`end_time` > `start_time`),
  CONSTRAINT `chk_rwh_slot_minutes` CHECK (`slot_minutes` BETWEEN 5 AND 480),
  CONSTRAINT `chk_rwh_break_minutes` CHECK (`break_minutes` BETWEEN 0 AND 480),
  CONSTRAINT `chk_rwh_capacity` CHECK (`capacity` BETWEEN 1 AND 999),
  CONSTRAINT `chk_rwh_is_active` CHECK (`is_active` IN (0,1))

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================= TABLE: resource_slots =================
CREATE TABLE `resource_slots` (
  `id`          CHAR(36)     NOT NULL,
  `resource_id` CHAR(36)     NOT NULL,
  `slot_date`   DATE         NOT NULL,
  `slot_time`   TIME         NOT NULL,

  `capacity`    INT          NOT NULL DEFAULT 1,
  `is_active`   TINYINT(1)   NOT NULL DEFAULT 1,

  `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                             ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  UNIQUE KEY `ux_resource_slots_unique` (`resource_id`,`slot_date`,`slot_time`),

  KEY `rs_resource_idx` (`resource_id`),
  KEY `rs_date_idx`     (`slot_date`),
  KEY `rs_active_idx`   (`is_active`),
  KEY `rs_resource_date_idx` (`resource_id`,`slot_date`),

  CONSTRAINT `chk_rs_capacity` CHECK (`capacity` BETWEEN 1 AND 999),
  CONSTRAINT `chk_rs_is_active` CHECK (`is_active` IN (0,1))

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================= TABLE: slot_reservations =================
CREATE TABLE `slot_reservations` (
  `id`             CHAR(36)     NOT NULL,
  `slot_id`         CHAR(36)     NOT NULL,
  `reserved_count`  INT          NOT NULL DEFAULT 0,

  `created_at`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                 ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  UNIQUE KEY `ux_slot_res_unique` (`slot_id`),
  KEY `slot_res_slot_idx` (`slot_id`),

  CONSTRAINT `chk_slot_res_reserved_nonneg` CHECK (`reserved_count` >= 0),

  CONSTRAINT `fk_slot_reservations_slot`
    FOREIGN KEY (`slot_id`) REFERENCES `resource_slots`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
