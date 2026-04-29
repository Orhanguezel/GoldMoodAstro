-- =============================================================
-- 041_availability_seed.sql
-- TEST setup — tüm 7 danışman için bol slot.
-- Working hours her gün 09:00-22:00 (30 dk slot, capacity 1)
-- Frontend slot picker bunlardan dinamik olarak günlük plan üretir.
-- =============================================================

INSERT INTO resources (id, type, title, capacity, external_ref_id, is_active) VALUES
('30000000-0000-4000-8000-000000000001','consultant','Zeynep Yıldız',1,'20000000-0000-4000-8000-000000000001',1),
('30000000-0000-4000-8000-000000000002','consultant','Ömer Toprak',  1,'20000000-0000-4000-8000-000000000002',1),
('30000000-0000-4000-8000-000000000003','consultant','Selin Ay',     1,'20000000-0000-4000-8000-000000000003',1),
('30000000-0000-4000-8000-000000000004','consultant','Murat Kısıkçılar', 1,'20000000-0000-4000-8000-000000000004',1),
('30000000-0000-4000-8000-000000000005','consultant','Pınar Demircioğlu',1,'20000000-0000-4000-8000-000000000005',1),
('30000000-0000-4000-8000-000000000006','consultant','Fatma Güçlü',  1,'20000000-0000-4000-8000-000000000006',1),
('30000000-0000-4000-8000-000000000007','consultant','Test Danışman',1,'20000000-0000-4000-8000-000000000007',1)
ON DUPLICATE KEY UPDATE title = VALUES(title), external_ref_id = VALUES(external_ref_id), is_active = VALUES(is_active);

-- Working hours: 7 danışman × 7 gün (1=Mon..7=Sun) × 09:00-22:00 / 30dk
-- INSERT IGNORE — id PK olduğu için drop+create sonrası temiz, nodrop'ta çakışan satırları atlar.
-- ID deterministic: 31000000-...-{seq}{dow padded} (seq: 1..7, dow: 01..07)
INSERT IGNORE INTO resource_working_hours (id, resource_id, dow, start_time, end_time, slot_minutes, capacity)
SELECT
  CONCAT('31000000-0000-4000-8000-', LPAD(r.seq * 10 + d.dow, 12, '0')) AS id,
  r.resource_id,
  d.dow,
  '09:00:00' AS start_time,
  '22:00:00' AS end_time,
  30 AS slot_minutes,
  1 AS capacity
FROM (
            SELECT 1 AS seq, '30000000-0000-4000-8000-000000000001' AS resource_id
  UNION ALL SELECT 2,        '30000000-0000-4000-8000-000000000002'
  UNION ALL SELECT 3,        '30000000-0000-4000-8000-000000000003'
  UNION ALL SELECT 4,        '30000000-0000-4000-8000-000000000004'
  UNION ALL SELECT 5,        '30000000-0000-4000-8000-000000000005'
  UNION ALL SELECT 6,        '30000000-0000-4000-8000-000000000006'
  UNION ALL SELECT 7,        '30000000-0000-4000-8000-000000000007'
) r
CROSS JOIN (
            SELECT 1 AS dow
  UNION ALL SELECT 2
  UNION ALL SELECT 3
  UNION ALL SELECT 4
  UNION ALL SELECT 5
  UNION ALL SELECT 6
  UNION ALL SELECT 7
) d;

-- Test bookings için spesifik slot kayıtları (051_bookings_seed.sql buradaki ID'leri arar)
INSERT IGNORE INTO resource_slots (id, resource_id, slot_date, slot_time, capacity) VALUES
('32000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','2026-04-27','10:00:00',1),
('32000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','2026-04-27','10:30:00',1),
('32000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000002','2026-04-28','13:00:00',1);

-- =============================================================
-- TEST SLOT GENERATION
-- 7 danışman × bugünden itibaren 30 gün × 09:00-22:00 / 30dk = 5460 slot.
-- consultants/repository.ts getConsultantSlots resource_slots tablosundan okur,
-- working_hours sadece display için. Bu yüzden satırları manuel üretiyoruz.
-- Prod'da bu satırları cron veya admin UI üretmeli.
-- =============================================================
INSERT IGNORE INTO resource_slots (id, resource_id, slot_date, slot_time, capacity, is_active)
SELECT
  UUID() AS id,
  r.resource_id,
  DATE_ADD(CURDATE(), INTERVAL d.n DAY) AS slot_date,
  MAKETIME(t.h, t.m, 0) AS slot_time,
  1 AS capacity,
  1 AS is_active
FROM (
            SELECT '30000000-0000-4000-8000-000000000001' AS resource_id
  UNION ALL SELECT '30000000-0000-4000-8000-000000000002'
  UNION ALL SELECT '30000000-0000-4000-8000-000000000003'
  UNION ALL SELECT '30000000-0000-4000-8000-000000000004'
  UNION ALL SELECT '30000000-0000-4000-8000-000000000005'
  UNION ALL SELECT '30000000-0000-4000-8000-000000000006'
  UNION ALL SELECT '30000000-0000-4000-8000-000000000007'
) r
CROSS JOIN (
  -- 0..29 gün (bugün dahil 30 gün)
            SELECT  0 AS n UNION ALL SELECT  1 UNION ALL SELECT  2 UNION ALL SELECT  3 UNION ALL SELECT  4
  UNION ALL SELECT  5 UNION ALL SELECT  6 UNION ALL SELECT  7 UNION ALL SELECT  8 UNION ALL SELECT  9
  UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14
  UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19
  UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24
  UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29
) d
CROSS JOIN (
  -- 09:00, 09:30, 10:00, ..., 21:30 (26 slot)
            SELECT  9 AS h, 0 AS m UNION ALL SELECT  9, 30
  UNION ALL SELECT 10, 0 UNION ALL SELECT 10, 30
  UNION ALL SELECT 11, 0 UNION ALL SELECT 11, 30
  UNION ALL SELECT 12, 0 UNION ALL SELECT 12, 30
  UNION ALL SELECT 13, 0 UNION ALL SELECT 13, 30
  UNION ALL SELECT 14, 0 UNION ALL SELECT 14, 30
  UNION ALL SELECT 15, 0 UNION ALL SELECT 15, 30
  UNION ALL SELECT 16, 0 UNION ALL SELECT 16, 30
  UNION ALL SELECT 17, 0 UNION ALL SELECT 17, 30
  UNION ALL SELECT 18, 0 UNION ALL SELECT 18, 30
  UNION ALL SELECT 19, 0 UNION ALL SELECT 19, 30
  UNION ALL SELECT 20, 0 UNION ALL SELECT 20, 30
  UNION ALL SELECT 21, 0 UNION ALL SELECT 21, 30
) t;
