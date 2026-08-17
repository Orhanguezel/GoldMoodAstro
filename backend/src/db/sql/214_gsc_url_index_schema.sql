-- SEO T19: Google Search Console URL index status cache
--
-- TABLO ADI NEDEN `seo_gsc_url_index`:
-- `gsc_url_index` adını sosyal/ekosistem modülü de kullanıyor (233_social_schema.sql)
-- ve şemaları farklı (orada id INT AUTO_INCREMENT + tenant_key + url_hash NOT NULL).
-- İkisi de CREATE TABLE IF NOT EXISTS olduğu için hangisi önce koşarsa tabloyu o
-- tanımlıyordu; prod'da sosyal şema oturmuştu ve seoQuality'nin INSERT'i her seferinde
-- 500 veriyordu (2026-08-17). İsimler ayrıldı — iki modül birbirinin tablosunu
-- sessizce ele geçiremez. Sosyal taraf `gsc_url_index` adında kalır.
CREATE TABLE IF NOT EXISTS seo_gsc_url_index (
  id CHAR(36) PRIMARY KEY,
  url VARCHAR(512) NOT NULL,
  coverage_state VARCHAR(128) NULL,
  verdict VARCHAR(32) NULL,
  last_crawl DATETIME(3) NULL,
  inspected_at DATETIME(3) NULL,
  checked_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  raw JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  -- url(191): utf8mb4'te tam 512 karakter InnoDB anahtar sınırını (3072 byte) aşar.
  UNIQUE KEY uniq_seo_gsc_url_index_url (url(191)),
  KEY idx_seo_gsc_url_index_verdict (verdict),
  KEY idx_seo_gsc_url_index_checked_at (checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
