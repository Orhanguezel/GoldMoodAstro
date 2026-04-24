-- =============================================================
-- 111_availability.seed.sql (FINAL — collation hardened, rerunnable)
-- Seed: working hours (weekly plan) + example daily slot overrides + reservations
--
-- Anastasia: Mon-Sat, 3 sessions/day (120min massage + 60min break)
--   10:00-12:00 | 13:00-15:00 | 16:00-18:00
--   Sunday: off
-- =============================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
SET time_zone = '+00:00';

START TRANSACTION;

-- -------------------------------------------------------------
-- CONFIG (force vars to unicode collation)
-- -------------------------------------------------------------
SET @RES_A = CONVERT('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @RES_B = CONVERT('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' USING utf8mb4) COLLATE utf8mb4_unicode_ci;

-- Example dates
SET @D1 = CONVERT('2026-01-20' USING utf8mb4) COLLATE utf8mb4_unicode_ci; -- Tue
SET @D2 = CONVERT('2026-01-22' USING utf8mb4) COLLATE utf8mb4_unicode_ci; -- Thu
SET @D3 = CONVERT('2026-01-25' USING utf8mb4) COLLATE utf8mb4_unicode_ci; -- Sun (no WH => no plan)

-- -------------------------------------------------------------
-- CLEANUP (safe rerun): remove rows for these resources only
-- -------------------------------------------------------------
DELETE sr
FROM slot_reservations sr
JOIN resource_slots rs ON rs.id = sr.slot_id
WHERE (rs.resource_id COLLATE utf8mb4_unicode_ci) IN (@RES_A, @RES_B);

DELETE FROM resource_slots
WHERE (resource_id COLLATE utf8mb4_unicode_ci) IN (@RES_A, @RES_B);

DELETE FROM resource_working_hours
WHERE (resource_id COLLATE utf8mb4_unicode_ci) IN (@RES_A, @RES_B);

-- =============================================================
-- WEEKLY WORKING HOURS (weekly plan)
-- =============================================================

-- ---------------- Resource A (Anastasia) ----------------
-- Mon-Sat: 3 blocks/day, 120min slot + 60min break
-- Block 1: 10:00-12:00 | Block 2: 13:00-15:00 | Block 3: 16:00-18:00
-- Sunday: off (no rows)
-- -------------------------------------------------------------

-- Monday (1)
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('a1111111-1111-4111-8111-111111111111', @RES_A, 1, '10:00:00','12:00:00', 120, 60, 1, 1),
('a1111111-1111-4111-8111-111111111112', @RES_A, 1, '13:00:00','15:00:00', 120, 60, 1, 1),
('a1111111-1111-4111-8111-111111111113', @RES_A, 1, '16:00:00','18:00:00', 120, 60, 1, 1);

-- Tuesday (2)
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('a2222222-2222-4222-8222-222222222221', @RES_A, 2, '10:00:00','12:00:00', 120, 60, 1, 1),
('a2222222-2222-4222-8222-222222222222', @RES_A, 2, '13:00:00','15:00:00', 120, 60, 1, 1),
('a2222222-2222-4222-8222-222222222223', @RES_A, 2, '16:00:00','18:00:00', 120, 60, 1, 1);

-- Wednesday (3)
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('a3333333-3333-4333-8333-333333333331', @RES_A, 3, '10:00:00','12:00:00', 120, 60, 1, 1),
('a3333333-3333-4333-8333-333333333332', @RES_A, 3, '13:00:00','15:00:00', 120, 60, 1, 1),
('a3333333-3333-4333-8333-333333333333', @RES_A, 3, '16:00:00','18:00:00', 120, 60, 1, 1);

-- Thursday (4)
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('a4444444-4444-4444-8444-444444444441', @RES_A, 4, '10:00:00','12:00:00', 120, 60, 1, 1),
('a4444444-4444-4444-8444-444444444442', @RES_A, 4, '13:00:00','15:00:00', 120, 60, 1, 1),
('a4444444-4444-4444-8444-444444444443', @RES_A, 4, '16:00:00','18:00:00', 120, 60, 1, 1);

-- Friday (5)
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('a5555555-5555-4555-8555-555555555551', @RES_A, 5, '10:00:00','12:00:00', 120, 60, 1, 1),
('a5555555-5555-4555-8555-555555555552', @RES_A, 5, '13:00:00','15:00:00', 120, 60, 1, 1),
('a5555555-5555-4555-8555-555555555553', @RES_A, 5, '16:00:00','18:00:00', 120, 60, 1, 1);

-- Saturday (6)
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('a6666666-6666-4666-8666-666666666661', @RES_A, 6, '10:00:00','12:00:00', 120, 60, 1, 1),
('a6666666-6666-4666-8666-666666666662', @RES_A, 6, '13:00:00','15:00:00', 120, 60, 1, 1),
('a6666666-6666-4666-8666-666666666663', @RES_A, 6, '16:00:00','18:00:00', 120, 60, 1, 1);

-- ---------------- Resource B (inactive therapist) ----------------
-- Tue..Sat 10-16 (45+15, cap2)
-- Mon/Sun off (no rows)
-- -------------------------------------------------------------

-- Tuesday (2)
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('b2222222-2222-4222-8222-222222222221', @RES_B, 2, '10:00:00','16:00:00', 45, 15, 2, 1);

-- Wednesday (3)
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('b3333333-3333-4333-8333-333333333331', @RES_B, 3, '10:00:00','16:00:00', 45, 15, 2, 1);

-- Thursday (4)
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('b4444444-4444-4444-8444-444444444441', @RES_B, 4, '10:00:00','16:00:00', 45, 15, 2, 1);

-- Friday (5)
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('b5555555-5555-4555-8555-555555555551', @RES_B, 5, '10:00:00','16:00:00', 45, 15, 2, 1);

-- Saturday (6)
INSERT INTO resource_working_hours
(id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
VALUES
('b6666666-6666-4666-8666-666666666661', @RES_B, 6, '10:00:00','16:00:00', 45, 15, 2, 1);

-- =============================================================
-- SLOT OVERRIDES (resource_slots) — example overrides
-- =============================================================

-- Resource A @D1 (Tue) full day closed override
-- New plan: 10:00, 13:00, 16:00
INSERT INTO resource_slots
(id, resource_id, slot_date, slot_time, capacity, is_active)
VALUES
('sa000001-0000-4000-8000-000000000001', @RES_A, @D1, '10:00:00', 1, 0),
('sa000001-0000-4000-8000-000000000002', @RES_A, @D1, '13:00:00', 1, 0),
('sa000001-0000-4000-8000-000000000003', @RES_A, @D1, '16:00:00', 1, 0)
ON DUPLICATE KEY UPDATE
  capacity = VALUES(capacity),
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP(3);

-- Resource A @D2 (Thu) single slot inactive (maintenance)
INSERT INTO resource_slots
(id, resource_id, slot_date, slot_time, capacity, is_active)
VALUES
('sa000002-0000-4000-8000-000000000001', @RES_A, @D2, '13:00:00', 1, 0)
ON DUPLICATE KEY UPDATE
  capacity = VALUES(capacity),
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP(3);

-- Resource B @D2 (Thu) capacity up at 11:00
INSERT INTO resource_slots
(id, resource_id, slot_date, slot_time, capacity, is_active)
VALUES
('sb000001-0000-4000-8000-000000000001', @RES_B, @D2, '11:00:00', 3, 1)
ON DUPLICATE KEY UPDATE
  capacity = VALUES(capacity),
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP(3);

-- =============================================================
-- RESERVATIONS (slot_reservations)
-- =============================================================

INSERT INTO slot_reservations
(id, slot_id, reserved_count)
VALUES
('r0000001-0000-4000-8000-000000000001', 'sb000001-0000-4000-8000-000000000001', 2)
ON DUPLICATE KEY UPDATE
  reserved_count = VALUES(reserved_count),
  updated_at = CURRENT_TIMESTAMP(3);

INSERT INTO slot_reservations
(id, slot_id, reserved_count)
VALUES
('r0000002-0000-4000-8000-000000000002', 'sa000002-0000-4000-8000-000000000001', 0)
ON DUPLICATE KEY UPDATE
  reserved_count = VALUES(reserved_count),
  updated_at = CURRENT_TIMESTAMP(3);

COMMIT;
