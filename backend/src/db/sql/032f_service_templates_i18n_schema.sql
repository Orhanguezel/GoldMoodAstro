-- =============================================================
-- 032f_service_templates_i18n_schema.sql
-- Hizmet sablonlari cok dilli icerik aynasi.
-- Ana tablodaki name/description fallback olarak kalir.
-- =============================================================
CREATE TABLE IF NOT EXISTS service_templates_i18n (
  id CHAR(36) NOT NULL PRIMARY KEY,
  template_id CHAR(36) NOT NULL,
  locale CHAR(8) NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY service_templates_i18n_template_locale_uq (template_id, locale),
  KEY service_templates_i18n_locale_idx (locale),
  CONSTRAINT fk_service_templates_i18n_template
    FOREIGN KEY (template_id) REFERENCES service_templates(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO service_templates_i18n
  (id, template_id, locale, name, description)
SELECT
  CONCAT(
    SUBSTRING(MD5(CONCAT(id, '|tr')), 1, 8), '-',
    SUBSTRING(MD5(CONCAT(id, '|tr')), 9, 4), '-4',
    SUBSTRING(MD5(CONCAT(id, '|tr')), 14, 3), '-8',
    SUBSTRING(MD5(CONCAT(id, '|tr')), 18, 3), '-',
    SUBSTRING(MD5(CONCAT(id, '|tr')), 21, 12)
  ),
  id,
  'tr',
  name,
  description
FROM service_templates;
