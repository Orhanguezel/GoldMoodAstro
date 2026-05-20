-- =============================================================
-- 030b_consultants_commission_notice_track.sql
-- Additive migration for prod: consultants tablosuna komisyon orani
-- degisiklik bildirimi takibi icin kolon ekler.
-- INFORMATION_SCHEMA guard: kolon varsa SELECT 1 (no-op), yoksa ALTER.
-- Fresh seed'de 030 zaten yeni kolonu icerir -> bu dosya hicbir sey yapmaz.
-- 030a (KYC) ile ayni pattern.
-- =============================================================

-- commission_change_announcement_sent_at
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'consultants' AND column_name = 'commission_change_announcement_sent_at');
SET @sql := IF(@col = 0, "ALTER TABLE consultants ADD COLUMN commission_change_announcement_sent_at DATETIME(3) NULL DEFAULT NULL AFTER agreement_accepted_at", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
