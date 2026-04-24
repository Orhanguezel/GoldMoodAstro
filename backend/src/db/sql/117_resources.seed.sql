-- 116_resources.seed.sql (SIMPLE, rerunnable)
-- Only Anastasia is active therapist. Nothing else is seeded.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
SET time_zone = '+00:00';

START TRANSACTION;

-- 1) (Opsiyonel ama pratik) Önce tüm therapist''leri pasifle
UPDATE resources
SET is_active = 0, updated_at = CURRENT_TIMESTAMP(3)
WHERE type = 'therapist';

-- 2) Anastasia therapist kayıt (id sabit kalsın diye "aaaa..." kullandık)
INSERT INTO resources (id, type, title, capacity, external_ref_id, is_active, created_at, updated_at)
VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'therapist', 'Anastasia König', 1, '2b3b1d07-6c05-4f61-bf6b-2f9d0c4c01b2', 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  type = VALUES(type),
  title = VALUES(title),
  capacity = VALUES(capacity),
  external_ref_id = VALUES(external_ref_id),
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP(3);

COMMIT;
