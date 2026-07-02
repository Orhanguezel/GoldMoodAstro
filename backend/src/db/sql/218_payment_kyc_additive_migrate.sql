-- =============================================================
-- 218_payment_kyc_additive_migrate.sql
-- Adds buyer identity storage for Iyzipay checkout without drop.
-- =============================================================

SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'user_addresses' AND column_name = 'identity_number');
SET @sql := IF(@col = 0, 'ALTER TABLE user_addresses ADD COLUMN identity_number VARCHAR(32) NULL AFTER email', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
