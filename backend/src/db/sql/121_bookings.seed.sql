-- =============================================================
-- 121_bookings.seed.sql (FINAL — collation hardened, rerunnable)
-- Seed: bookings
-- - Customers: users table (002_auth_seed.sql)
-- - Resources: resources seed (RES_A / RES_B)
-- - Active statuses hold capacity: create slot anchors + slot_reservations
-- =============================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
SET time_zone = '+00:00';

START TRANSACTION;

-- -------------------------------------------------------------
-- Known Resource IDs (same as 116_resources.seed.sql)
-- Force vars to unicode collation to avoid mix with legacy tables
-- -------------------------------------------------------------
SET @RES_A = CONVERT('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @RES_B = CONVERT('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' USING utf8mb4) COLLATE utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Users (customers) from 002_auth_seed.sql (force unicode collation)
-- -------------------------------------------------------------
SET @U_MEHMET = CONVERT('0ac37a5c-a8be-4d25-b853-1e5c9574c1b3' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @U_NURI   = CONVERT('19a2bc26-63d1-43ad-ab56-d7f3c3719a34' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @U_SULTAN = CONVERT('4a8fb7f7-0668-4429-9309-fe88ac90eed2' USING utf8mb4) COLLATE utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Booking IDs (stable)
-- -------------------------------------------------------------
SET @B1 = CONVERT('b1111111-1111-4111-8111-111111111111' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @B2 = CONVERT('b2222222-2222-4222-8222-222222222222' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @B3 = CONVERT('b3333333-3333-4333-8333-333333333333' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @B4 = CONVERT('b4444444-4444-4444-8444-444444444444' USING utf8mb4) COLLATE utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Appointment plan (edit if needed)
-- NOTE: dates/times are strings (bookings schema expects VARCHAR)
-- -------------------------------------------------------------
SET @D1 = CONVERT('2026-01-12' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @T1 = CONVERT('10:00' USING utf8mb4) COLLATE utf8mb4_unicode_ci;

SET @D2 = CONVERT('2026-01-12' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @T2 = CONVERT('11:30' USING utf8mb4) COLLATE utf8mb4_unicode_ci;

SET @D3 = CONVERT('2026-01-13' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @T3 = CONVERT('09:00' USING utf8mb4) COLLATE utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Slot IDs (stable) for active bookings
-- -------------------------------------------------------------
SET @S1 = CONVERT('s1111111-1111-4111-8111-111111111111' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @S2 = CONVERT('s2222222-2222-4222-8222-222222222222' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @S3 = CONVERT('s3333333-3333-4333-8333-333333333333' USING utf8mb4) COLLATE utf8mb4_unicode_ci;

-- Reservation IDs (stable) (avoid REPLACE() collation surprises)
SET @R1 = CONVERT('r1111111-1111-4111-8111-111111111111' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @R2 = CONVERT('r2222222-2222-4222-8222-222222222222' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @R3 = CONVERT('r3333333-3333-4333-8333-333333333333' USING utf8mb4) COLLATE utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 0) Optional cleanup (safe rerun): remove only our seeded bookings
-- -------------------------------------------------------------
DELETE FROM bookings
WHERE (id COLLATE utf8mb4_unicode_ci) IN (@B1,@B2,@B3,@B4);

-- -------------------------------------------------------------
-- 1) Ensure slot anchors (resource_slots) exist for active statuses
-- Use ON DUPLICATE KEY UPDATE (not INSERT IGNORE) to keep deterministic
-- -------------------------------------------------------------
INSERT INTO `resource_slots`
(`id`,`resource_id`,`slot_date`,`slot_time`,`capacity`,`is_active`,`created_at`,`updated_at`)
VALUES
  (@S1, @RES_A, STR_TO_DATE(@D1,'%Y-%m-%d'), STR_TO_DATE(CONCAT(@T1,':00'),'%H:%i:%s'), 1, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  (@S2, @RES_A, STR_TO_DATE(@D2,'%Y-%m-%d'), STR_TO_DATE(CONCAT(@T2,':00'),'%H:%i:%s'), 1, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  (@S3, @RES_B, STR_TO_DATE(@D3,'%Y-%m-%d'), STR_TO_DATE(CONCAT(@T3,':00'),'%H:%i:%s'), 1, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `resource_id` = VALUES(`resource_id`),
  `slot_date`   = VALUES(`slot_date`),
  `slot_time`   = VALUES(`slot_time`),
  `capacity`    = VALUES(`capacity`),
  `is_active`   = VALUES(`is_active`),
  `updated_at`  = CURRENT_TIMESTAMP(3);

-- -------------------------------------------------------------
-- 2) Ensure reservation rows exist (slot_reservations)
-- -------------------------------------------------------------
INSERT INTO `slot_reservations`
(`id`,`slot_id`,`reserved_count`,`created_at`,`updated_at`)
VALUES
  (@R1, @S1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  (@R2, @S2, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  (@R3, @S3, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `updated_at` = CURRENT_TIMESTAMP(3);

-- -------------------------------------------------------------
-- 3) Mark capacity held for active bookings
-- IMPORTANT: force collation on slot_id column for IN comparison
-- -------------------------------------------------------------
UPDATE `slot_reservations`
SET `reserved_count` = 1, `updated_at` = CURRENT_TIMESTAMP(3)
WHERE (`slot_id` COLLATE utf8mb4_unicode_ci) IN (@S1,@S2,@S3);

-- -------------------------------------------------------------
-- 4) Insert bookings using INSERT...SELECT (customer fields from users)
-- Force collation on users.id comparison to avoid mix
-- -------------------------------------------------------------

-- B1: Mehmet -> RES_A @D1 @T1 (new, active, holds slot)
INSERT INTO `bookings`
(`id`,`name`,`email`,`phone`,`locale`,`customer_message`,
 `service_id`,`resource_id`,`slot_id`,`appointment_date`,`appointment_time`,
 `status`,`is_read`,`admin_note`,`created_at`,`updated_at`)
SELECT
  @B1,
  TRIM(u.full_name),
  TRIM(u.email),
  COALESCE(TRIM(u.phone),''),
  'de',
  'Seed booking (public-like).',
  NULL,
  @RES_A,
  @S1,
  @D1,
  @T1,
  'new',
  0,
  NULL,
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM users u
WHERE (u.id COLLATE utf8mb4_unicode_ci) = @U_MEHMET
LIMIT 1
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `email` = VALUES(`email`),
  `phone` = VALUES(`phone`),
  `locale` = VALUES(`locale`),
  `customer_message` = VALUES(`customer_message`),
  `service_id` = VALUES(`service_id`),
  `resource_id` = VALUES(`resource_id`),
  `slot_id` = VALUES(`slot_id`),
  `appointment_date` = VALUES(`appointment_date`),
  `appointment_time` = VALUES(`appointment_time`),
  `status` = VALUES(`status`),
  `is_read` = VALUES(`is_read`),
  `admin_note` = VALUES(`admin_note`),
  `updated_at` = CURRENT_TIMESTAMP(3);

-- B2: Sultan -> RES_A @D2 @T2 (confirmed, active, holds slot)
INSERT INTO `bookings`
(`id`,`name`,`email`,`phone`,`locale`,`customer_message`,
 `service_id`,`resource_id`,`slot_id`,`appointment_date`,`appointment_time`,
 `status`,`is_read`,`admin_note`,`created_at`,`updated_at`)
SELECT
  @B2,
  TRIM(u.full_name),
  TRIM(u.email),
  COALESCE(TRIM(u.phone),''),
  'de',
  'Seed booking (admin-created).',
  NULL,
  @RES_A,
  @S2,
  @D2,
  @T2,
  'confirmed',
  1,
  'Confirmed in seed.',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM users u
WHERE (u.id COLLATE utf8mb4_unicode_ci) = @U_SULTAN
LIMIT 1
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `email` = VALUES(`email`),
  `phone` = VALUES(`phone`),
  `locale` = VALUES(`locale`),
  `customer_message` = VALUES(`customer_message`),
  `service_id` = VALUES(`service_id`),
  `resource_id` = VALUES(`resource_id`),
  `slot_id` = VALUES(`slot_id`),
  `appointment_date` = VALUES(`appointment_date`),
  `appointment_time` = VALUES(`appointment_time`),
  `status` = VALUES(`status`),
  `is_read` = VALUES(`is_read`),
  `admin_note` = VALUES(`admin_note`),
  `updated_at` = CURRENT_TIMESTAMP(3);

-- B3: Nuri -> RES_B @D3 @T3 (rejected, NOT active, slot_id NULL)
INSERT INTO `bookings`
(`id`,`name`,`email`,`phone`,`locale`,`customer_message`,
 `service_id`,`resource_id`,`slot_id`,`appointment_date`,`appointment_time`,
 `status`,`is_read`,`admin_note`,`decided_at`,`decided_by`,`decision_note`,
 `created_at`,`updated_at`)
SELECT
  @B3,
  TRIM(u.full_name),
  TRIM(u.email),
  COALESCE(TRIM(u.phone),''),
  'de',
  'Seed booking (rejected).',
  NULL,
  @RES_B,
  NULL,
  @D3,
  @T3,
  'rejected',
  1,
  'Rejected in seed.',
  CURRENT_TIMESTAMP(3),
  'seed',
  'Not available.',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM users u
WHERE (u.id COLLATE utf8mb4_unicode_ci) = @U_NURI
LIMIT 1
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `email` = VALUES(`email`),
  `phone` = VALUES(`phone`),
  `locale` = VALUES(`locale`),
  `customer_message` = VALUES(`customer_message`),
  `service_id` = VALUES(`service_id`),
  `resource_id` = VALUES(`resource_id`),
  `slot_id` = VALUES(`slot_id`),
  `appointment_date` = VALUES(`appointment_date`),
  `appointment_time` = VALUES(`appointment_time`),
  `status` = VALUES(`status`),
  `is_read` = VALUES(`is_read`),
  `admin_note` = VALUES(`admin_note`),
  `decided_at` = VALUES(`decided_at`),
  `decided_by` = VALUES(`decided_by`),
  `decision_note` = VALUES(`decision_note`),
  `updated_at` = CURRENT_TIMESTAMP(3);

-- B4: Cancelled example (no slot)
INSERT INTO `bookings`
(`id`,`name`,`email`,`phone`,`locale`,`customer_message`,
 `service_id`,`resource_id`,`slot_id`,`appointment_date`,`appointment_time`,
 `status`,`is_read`,`created_at`,`updated_at`)
VALUES
  (@B4,'Seed Cancelled','seed.cancelled@example.com','0000000000','de','Cancelled sample',
   NULL,@RES_A,NULL,'2026-01-14','12:00',
   'cancelled',1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `status` = VALUES(`status`),
  `is_read` = VALUES(`is_read`),
  `updated_at` = CURRENT_TIMESTAMP(3);

COMMIT;
