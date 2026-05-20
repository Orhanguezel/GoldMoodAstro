-- Additive auth migration for email verification tokens.
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'email_verification_token');
SET @sql := IF(@col = 0, "ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255) NULL AFTER email_verified", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'email_verification_expires');
SET @sql := IF(@col = 0, "ALTER TABLE users ADD COLUMN email_verification_expires DATETIME(3) NULL AFTER email_verification_token", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (SELECT COUNT(*) FROM information_schema.statistics
             WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'users_email_verification_token_idx');
SET @sql := IF(@idx = 0, "ALTER TABLE users ADD KEY users_email_verification_token_idx (email_verification_token)", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
