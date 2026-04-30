-- =============================================================
-- 210_home_sections_schema.sql
-- Anasayfa düzeni: hangi section gösterilecek, hangi sırada, hangi config ile.
-- Component sabit (frontend registry); admin sadece order/active/label/config değiştirebilir.
-- =============================================================
CREATE TABLE IF NOT EXISTS home_sections (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(80) NOT NULL,
  label VARCHAR(160) NOT NULL,
  component_key VARCHAR(80) NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  is_active TINYINT NOT NULL DEFAULT 1,
  config JSON,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uniq_home_sections_slug (slug),
  KEY idx_home_sections_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
