-- =============================================================
-- Mevcut DB'ler için additive migrate: öne çıkarma kolonları.
-- Fresh kurulumda 030_consultants_schema.sql zaten içeriyor; bu dosya
-- yalnızca çalışan veritabanlarını hizalar. Idempotent: kolon varsa hata
-- vermeden geçer.
-- =============================================================
SET @db := DATABASE();

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema=@db AND table_name='consultants' AND column_name='is_featured') = 0,
  'ALTER TABLE consultants ADD COLUMN is_featured TINYINT DEFAULT 0',
  'SELECT 1'));
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema=@db AND table_name='consultants' AND column_name='featured_until') = 0,
  'ALTER TABLE consultants ADD COLUMN featured_until DATETIME NULL',
  'SELECT 1'));
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema=@db AND table_name='consultants' AND column_name='featured_rank') = 0,
  'ALTER TABLE consultants ADD COLUMN featured_rank INT NULL',
  'SELECT 1'));
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.statistics
     WHERE table_schema=@db AND table_name='consultants' AND index_name='idx_consultants_featured') = 0,
  'CREATE INDEX idx_consultants_featured ON consultants (is_featured, featured_rank)',
  'SELECT 1'));
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;
