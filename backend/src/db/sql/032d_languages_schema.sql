-- =============================================================
-- 032d_languages_schema.sql
-- Danisman profilindeki diller icin tek DB kaynagi.
-- UI slug yerine locale'e gore name_tr/name_en/name_de gosterir.
-- =============================================================
CREATE TABLE IF NOT EXISTS languages (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(8) NOT NULL,
  name_tr VARCHAR(50) NOT NULL,
  name_en VARCHAR(50) NOT NULL,
  name_de VARCHAR(50) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uniq_languages_slug (slug),
  KEY idx_languages_active (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO languages (id, slug, name_tr, name_en, name_de, sort_order, is_active)
VALUES
  (CONCAT(SUBSTRING(MD5('tr'),1,8),'-',SUBSTRING(MD5('tr'),9,4),'-4',SUBSTRING(MD5('tr'),14,3),'-8',SUBSTRING(MD5('tr'),18,3),'-',SUBSTRING(MD5('tr'),21,12)),
   'tr', 'Türkçe', 'Turkish', 'Türkisch', 10, 1),
  (CONCAT(SUBSTRING(MD5('en'),1,8),'-',SUBSTRING(MD5('en'),9,4),'-4',SUBSTRING(MD5('en'),14,3),'-8',SUBSTRING(MD5('en'),18,3),'-',SUBSTRING(MD5('en'),21,12)),
   'en', 'İngilizce', 'English', 'Englisch', 20, 1),
  (CONCAT(SUBSTRING(MD5('de'),1,8),'-',SUBSTRING(MD5('de'),9,4),'-4',SUBSTRING(MD5('de'),14,3),'-8',SUBSTRING(MD5('de'),18,3),'-',SUBSTRING(MD5('de'),21,12)),
   'de', 'Almanca', 'German', 'Deutsch', 30, 1),
  (CONCAT(SUBSTRING(MD5('fr'),1,8),'-',SUBSTRING(MD5('fr'),9,4),'-4',SUBSTRING(MD5('fr'),14,3),'-8',SUBSTRING(MD5('fr'),18,3),'-',SUBSTRING(MD5('fr'),21,12)),
   'fr', 'Fransızca', 'French', 'Französisch', 40, 1),
  (CONCAT(SUBSTRING(MD5('ru'),1,8),'-',SUBSTRING(MD5('ru'),9,4),'-4',SUBSTRING(MD5('ru'),14,3),'-8',SUBSTRING(MD5('ru'),18,3),'-',SUBSTRING(MD5('ru'),21,12)),
   'ru', 'Rusça', 'Russian', 'Russisch', 50, 1),
  (CONCAT(SUBSTRING(MD5('ar'),1,8),'-',SUBSTRING(MD5('ar'),9,4),'-4',SUBSTRING(MD5('ar'),14,3),'-8',SUBSTRING(MD5('ar'),18,3),'-',SUBSTRING(MD5('ar'),21,12)),
   'ar', 'Arapça', 'Arabic', 'Arabisch', 60, 1),
  (CONCAT(SUBSTRING(MD5('es'),1,8),'-',SUBSTRING(MD5('es'),9,4),'-4',SUBSTRING(MD5('es'),14,3),'-8',SUBSTRING(MD5('es'),18,3),'-',SUBSTRING(MD5('es'),21,12)),
   'es', 'İspanyolca', 'Spanish', 'Spanisch', 70, 1);
