-- =============================================================
-- 228_bookings_attribution_additive_migrate.sql
-- Randevuya PAZARLAMA ATFI ekler (drop yok, mevcut veri korunur).
--
-- NEDEN: "sosyal medyadan gelen aylik randevu sayisi" hedefi bugun OLCULEMIYOR.
--   - UTM yalnizca sessionStorage'da tutuluyordu (telemetry.ts) → sekme kapaninca kayip
--   - 3041 audit_events kaydinin sadece 6'sinda utm_ geciyor
--   - bookings.source_type/source_id ic kaynak icin (danisman/hizmet), kampanya degil
-- Sonuc: Instagram'dan gelip 3 gun sonra randevu alan kullanici atifsiz kaliyordu.
--
-- Bu migration FIRST-TOUCH atfini randevu kaydina yazar. Frontend tarafi
-- localStorage'a gecirildi (30-90 gun) ve booking payload'ina eklendi.
-- =============================================================

SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'bookings' AND column_name = 'attr_utm_source');
SET @s := IF(@c = 0, 'ALTER TABLE bookings ADD COLUMN attr_utm_source VARCHAR(64) NULL AFTER source_id', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'bookings' AND column_name = 'attr_utm_medium');
SET @s := IF(@c = 0, 'ALTER TABLE bookings ADD COLUMN attr_utm_medium VARCHAR(64) NULL AFTER attr_utm_source', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'bookings' AND column_name = 'attr_utm_campaign');
SET @s := IF(@c = 0, 'ALTER TABLE bookings ADD COLUMN attr_utm_campaign VARCHAR(128) NULL AFTER attr_utm_medium', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'bookings' AND column_name = 'attr_utm_content');
SET @s := IF(@c = 0, 'ALTER TABLE bookings ADD COLUMN attr_utm_content VARCHAR(128) NULL AFTER attr_utm_campaign', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Reklam tiklama kimlikleri — ucretli kampanya baslarsa gerekli
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'bookings' AND column_name = 'attr_click_id');
SET @s := IF(@c = 0, 'ALTER TABLE bookings ADD COLUMN attr_click_id VARCHAR(255) NULL AFTER attr_utm_content', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'bookings' AND column_name = 'attr_referrer');
SET @s := IF(@c = 0, 'ALTER TABLE bookings ADD COLUMN attr_referrer VARCHAR(512) NULL AFTER attr_click_id', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Ilk temas zamani — donusum suresini olcmek icin (sosyalden gelip kac gun sonra randevu?)
SET @c := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'bookings' AND column_name = 'attr_first_seen_at');
SET @s := IF(@c = 0, 'ALTER TABLE bookings ADD COLUMN attr_first_seen_at DATETIME(3) NULL AFTER attr_referrer', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Kampanya bazli raporlama icin
SET @i := (SELECT COUNT(*) FROM information_schema.statistics
           WHERE table_schema = DATABASE() AND table_name = 'bookings' AND index_name = 'bookings_attr_idx');
SET @s := IF(@i = 0, 'ALTER TABLE bookings ADD INDEX bookings_attr_idx (attr_utm_source, attr_utm_campaign)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
