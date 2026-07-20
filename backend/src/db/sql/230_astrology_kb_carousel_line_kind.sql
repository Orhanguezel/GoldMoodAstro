-- =============================================================
-- 230_astrology_kb_carousel_line_kind.sql
-- astrology_kb.kind ENUM'una 'carousel_line' ekler (additive, veri kaybi YOK).
--
-- NEDEN: Instagram carousel kareleri burc basina TEK SATIR cevap tasimali
-- ("Koç: hemen sonuç ister"). Bu satirlar generate-carousel-lines.ts ile uretilip
-- astrology_kb'ye yazilir. Ilk denemede insert "Data truncated for column 'kind'"
-- ile patladi — kind bir ENUM ve yeni deger tanimli degildi.
--
-- MODIFY COLUMN yalnizca izinli deger listesini genisletir; mevcut satirlar etkilenmez.
-- =============================================================

SET @has := (SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = 'astrology_kb'
               AND column_name = 'kind' AND column_type LIKE '%carousel_line%');
SET @sql := IF(@has = 0,
  "ALTER TABLE astrology_kb MODIFY COLUMN kind ENUM('planet_sign','planet_house','sign_house','aspect','sign','house','planet','transit','synastry','sign_section','carousel_line','misc') NOT NULL",
  'SELECT 1');
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;
