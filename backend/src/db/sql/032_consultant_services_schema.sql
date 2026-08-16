-- =============================================================
-- 032_consultant_services_schema.sql
-- T29-1: Çoklu hizmet paketi (Fatma → 5 paket: ücretsiz tanışma + 4 ücretli).
-- Her servis kendi süresi + fiyatı + is_free flag'i taşır.
-- =============================================================
CREATE TABLE IF NOT EXISTS consultant_services (
  id CHAR(36) PRIMARY KEY,
  consultant_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 45,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
  media_type ENUM('audio','video') NOT NULL DEFAULT 'audio',
  is_free TINYINT NOT NULL DEFAULT 0,
  is_active TINYINT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  -- Hizmet Şablonları (032b): bu kayıt hangi şablondan türedi + hangi kategoride.
  -- Soft ref (FK YOK): şablon silinse de danışmanın kopyası yaşar, ordering derdi olmaz.
  template_id CHAR(36) NULL,
  category_slug VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uniq_consultant_service_slug (consultant_id, slug),
  -- Aynı şablon bir danışmanda en fazla 1 kez benimsenir (idempotent adopt guard).
  UNIQUE KEY uniq_consultant_template (consultant_id, template_id),
  KEY idx_consultant_services_consultant (consultant_id),
  KEY idx_consultant_services_active (consultant_id, is_active, sort_order),
  KEY idx_consultant_services_category (consultant_id, category_slug),
  CONSTRAINT fk_consultant_services_consultant FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bookings tablosuna service_id zaten var (050_bookings_schema.sql), gerekiyorsa FK eklenir.
