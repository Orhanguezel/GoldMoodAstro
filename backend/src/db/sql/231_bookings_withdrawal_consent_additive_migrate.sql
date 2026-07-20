-- =============================================================
-- 231_bookings_withdrawal_consent_additive_migrate.sql
-- bookings.withdrawal_consent_at kolonu (prod nodrop reconcile).
--
-- NEDEN: Kolon 050_bookings_schema.sql'de ve Drizzle şemasında tanımlı, ancak
-- prod tablosunda YOKTU. CREATE TABLE IF NOT EXISTS mevcut tabloya kolon
-- eklemediği için canlıda şema kayması oluşmuştu.
--
-- ETKİ: bookings sorguları bu kolonu SELECT ettiği için randevu hatırlatma
-- cron'u her turda ER_BAD_FIELD_ERROR ile düşüyordu (loglarda 28 kayıt).
-- Yani randevusu yaklaşan kullanıcılara hatırlatma GİTMİYORDU.
--
-- Guard: kolon varsa no-op. Fresh seed'de 050 zaten içerir.
-- (Aynı sınıf: 228_bookings_attribution_additive_migrate.sql)
-- =============================================================
SET @col := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'bookings' AND column_name = 'withdrawal_consent_at');
SET @sql := IF(@col = 0, 'ALTER TABLE bookings ADD COLUMN withdrawal_consent_at DATETIME(3) NULL AFTER decided_at', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
