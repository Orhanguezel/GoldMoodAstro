-- =============================================================
-- 115_resources.schema.sql (HARDENED, FINAL)
-- Resources: generic resource directory (therapist/doctor/room/table/staff/other)
-- Matches: src/modules/resources/schema.ts  (incl. capacity)
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

DROP TABLE IF EXISTS `resources`;

CREATE TABLE `resources` (
  `id`               CHAR(36)      NOT NULL,

  `type`             VARCHAR(24)   NOT NULL DEFAULT 'other',
  `title`            VARCHAR(190)  NOT NULL,

  -- Capacity of the resource (parallel bookings allowed per slot)
  `capacity`         INT UNSIGNED  NOT NULL DEFAULT 1,

  `external_ref_id`  CHAR(36)      NULL,

  `is_active`        TINYINT(1)    NOT NULL DEFAULT 1,

  `created_at`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                  ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  KEY `resources_active_idx`        (`is_active`),
  KEY `resources_type_idx`          (`type`),
  KEY `resources_title_idx`         (`title`),
  KEY `resources_capacity_idx`      (`capacity`),
  KEY `resources_external_idx`      (`external_ref_id`),

  -- Useful composite index for admin filters (optional but typically helpful)
  KEY `resources_type_active_idx`   (`type`,`is_active`),
  KEY `resources_type_active_cap_idx` (`type`,`is_active`,`capacity`),

  -- Constraints (MySQL 8+ enforces CHECK; older versions may ignore safely)
  CONSTRAINT `chk_resources_is_active` CHECK (`is_active` IN (0,1)),
  CONSTRAINT `chk_resources_capacity_min1` CHECK (`capacity` >= 1),
  CONSTRAINT `chk_resources_type_nonempty` CHECK (CHAR_LENGTH(`type`) >= 1),
  CONSTRAINT `chk_resources_title_nonempty` CHECK (CHAR_LENGTH(`title`) >= 1)

  -- Optional FK examples (only if external_ref_id points to a known table):
  -- e.g. users(id) or doctors(id). Keep OFF unless you''re sure.
  -- ,CONSTRAINT `fk_resources_external_user`
  --   FOREIGN KEY (`external_ref_id`) REFERENCES `users`(`id`)
  --   ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
