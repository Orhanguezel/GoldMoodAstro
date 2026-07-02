-- =============================================================
-- 216_seo_quality_additive_migrate.sql
-- SEO quality prod/local additive reconcile.
-- Fresh seed'de 030/197 zaten bu kolonlari icerir.
-- Mevcut DB'de INFORMATION_SCHEMA guard ile eksikleri ekler.
-- =============================================================

-- custom_pages.seo_index
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'custom_pages' AND column_name = 'seo_index');
SET @sql := IF(@col = 0, "ALTER TABLE custom_pages ADD COLUMN seo_index TINYINT(1) NOT NULL DEFAULT 1 AFTER is_published", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- consultant_i18n.meta_title
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'consultant_i18n' AND column_name = 'meta_title');
SET @sql := IF(@col = 0, "ALTER TABLE consultant_i18n ADD COLUMN meta_title VARCHAR(255) NULL AFTER bio", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- consultant_i18n.meta_description
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'consultant_i18n' AND column_name = 'meta_description');
SET @sql := IF(@col = 0, "ALTER TABLE consultant_i18n ADD COLUMN meta_description VARCHAR(500) NULL AFTER meta_title", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- consultant_i18n.og_image
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'consultant_i18n' AND column_name = 'og_image');
SET @sql := IF(@col = 0, "ALTER TABLE consultant_i18n ADD COLUMN og_image VARCHAR(500) NULL AFTER meta_description", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
