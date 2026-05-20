-- =============================================================
-- 030a_consultants_kyc_migrate.sql
-- Additive migration for prod: consultants tablosuna KYC kolonlarını ekler.
-- INFORMATION_SCHEMA guard: kolon varsa SELECT 1 (no-op), yoksa ALTER.
-- Fresh seed'de 030 zaten yeni kolonları içerir → bu dosya hiçbir şey yapmaz.
-- YAPILACAKLAR C1 (2026-05-20).
-- =============================================================

-- account_type
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'consultants' AND column_name = 'account_type');
SET @sql := IF(@col = 0, "ALTER TABLE consultants ADD COLUMN account_type ENUM('individual','company') NULL AFTER bank_account_holder", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- identity_number
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'consultants' AND column_name = 'identity_number');
SET @sql := IF(@col = 0, "ALTER TABLE consultants ADD COLUMN identity_number VARCHAR(11) NULL AFTER account_type", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- tax_number
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'consultants' AND column_name = 'tax_number');
SET @sql := IF(@col = 0, "ALTER TABLE consultants ADD COLUMN tax_number VARCHAR(11) NULL AFTER identity_number", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- tax_office
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'consultants' AND column_name = 'tax_office');
SET @sql := IF(@col = 0, "ALTER TABLE consultants ADD COLUMN tax_office VARCHAR(120) NULL AFTER tax_number", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- company_name
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'consultants' AND column_name = 'company_name');
SET @sql := IF(@col = 0, "ALTER TABLE consultants ADD COLUMN company_name VARCHAR(200) NULL AFTER tax_office", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- billing_address
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'consultants' AND column_name = 'billing_address');
SET @sql := IF(@col = 0, "ALTER TABLE consultants ADD COLUMN billing_address TEXT NULL AFTER company_name", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- kyc_status
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'consultants' AND column_name = 'kyc_status');
SET @sql := IF(@col = 0, "ALTER TABLE consultants ADD COLUMN kyc_status ENUM('none','pending','approved','rejected') NOT NULL DEFAULT 'none' AFTER billing_address", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- kyc_submitted_at
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'consultants' AND column_name = 'kyc_submitted_at');
SET @sql := IF(@col = 0, "ALTER TABLE consultants ADD COLUMN kyc_submitted_at DATETIME(3) NULL AFTER kyc_status", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- kyc_reviewed_at
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'consultants' AND column_name = 'kyc_reviewed_at');
SET @sql := IF(@col = 0, "ALTER TABLE consultants ADD COLUMN kyc_reviewed_at DATETIME(3) NULL AFTER kyc_submitted_at", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- kyc_rejection_reason
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'consultants' AND column_name = 'kyc_rejection_reason');
SET @sql := IF(@col = 0, "ALTER TABLE consultants ADD COLUMN kyc_rejection_reason TEXT NULL AFTER kyc_reviewed_at", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- kyc_documents
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'consultants' AND column_name = 'kyc_documents');
SET @sql := IF(@col = 0, "ALTER TABLE consultants ADD COLUMN kyc_documents JSON NULL AFTER kyc_rejection_reason", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- agreement_accepted_at
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'consultants' AND column_name = 'agreement_accepted_at');
SET @sql := IF(@col = 0, "ALTER TABLE consultants ADD COLUMN agreement_accepted_at DATETIME(3) NULL AFTER kyc_documents", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
