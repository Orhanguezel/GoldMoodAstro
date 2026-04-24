-- =============================================================
-- 110.5_availability_recurring_overrides.sql
-- Recurring day-level availability overrides (e.g. every Friday closed)
-- =============================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `resource_recurring_overrides` (
  `id`          CHAR(36)     NOT NULL,
  `resource_id` CHAR(36)     NOT NULL,
  `dow`         TINYINT      NOT NULL COMMENT '1..7 (Mon..Sun)',
  `is_active`   TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                             ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_resource_recurring_overrides_unique` (`resource_id`,`dow`),
  KEY `rro_resource_idx` (`resource_id`),
  KEY `rro_dow_idx` (`dow`),
  KEY `rro_active_idx` (`is_active`),

  CONSTRAINT `chk_rro_dow` CHECK (`dow` BETWEEN 1 AND 7),
  CONSTRAINT `chk_rro_is_active` CHECK (`is_active` IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
