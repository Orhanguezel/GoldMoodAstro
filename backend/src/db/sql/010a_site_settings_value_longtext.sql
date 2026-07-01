-- =============================================================
-- 010a_site_settings_value_longtext.sql
-- site_settings.value TEXT → LONGTEXT reconcile (prod nodrop için).
-- Mobil ui_mobile_i18n blob'u (tr/en/de, ~110KB) TEXT 65KB limitini aşıyor.
-- Guard: zaten longtext ise no-op. Fresh seed'de 010 zaten LONGTEXT oluşturur.
-- =============================================================
SET @t := (SELECT data_type FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'site_settings' AND column_name = 'value');
SET @sql := IF(@t <> 'longtext', 'ALTER TABLE site_settings MODIFY value LONGTEXT NOT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
