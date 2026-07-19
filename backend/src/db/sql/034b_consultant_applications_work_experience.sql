-- =============================================================
-- 034b_consultant_applications_work_experience.sql
-- consultant_applications.work_experience kolonu (prod nodrop reconcile).
-- Müşteri talebi (site düzeltme notları M4): başvuruda iş deneyimi de
-- alınsın; admin başvuruyu incelerken okuyup karar verebilsin.
-- Guard: kolon varsa no-op. Fresh seed'de 034 zaten içerir.
-- =============================================================
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'consultant_applications' AND column_name = 'work_experience');
SET @sql := IF(@col = 0, 'ALTER TABLE consultant_applications ADD COLUMN work_experience TEXT NULL AFTER certifications', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
