-- =============================================================
-- 034a_consultant_applications_sample_review.sql
-- consultant_applications.sample_review kolonu (prod nodrop reconcile).
-- Örnek yorum artık belge (sample_chart_url) yerine metin olarak alınıyor.
-- Guard: kolon varsa no-op. Fresh seed'de 034 zaten içerir.
-- =============================================================
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'consultant_applications' AND column_name = 'sample_review');
SET @sql := IF(@col = 0, 'ALTER TABLE consultant_applications ADD COLUMN sample_review TEXT NULL AFTER sample_chart_url', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
