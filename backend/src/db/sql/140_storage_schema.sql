-- =============================================================
-- 140_storage_schema.sql
-- storage_assets — tenantsiz, Cloudinary + local destekli.
-- Drizzle schema ile birebir aynı tutulmalı: shared-backend/modules/storage/schema.ts
-- =============================================================
CREATE TABLE IF NOT EXISTS storage_assets (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),

  name VARCHAR(255) NOT NULL,
  bucket VARCHAR(64) NOT NULL,
  path VARCHAR(512) NOT NULL,
  folder VARCHAR(255),

  mime VARCHAR(127) NOT NULL,
  size BIGINT UNSIGNED NOT NULL,

  width INT UNSIGNED,
  height INT UNSIGNED,

  url TEXT,
  hash VARCHAR(64),

  provider VARCHAR(16) NOT NULL DEFAULT 'cloudinary',
  provider_public_id VARCHAR(255),
  provider_resource_type VARCHAR(16),
  provider_format VARCHAR(32),
  provider_version INT UNSIGNED,
  etag VARCHAR(64),

  metadata JSON,

  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  UNIQUE KEY uniq_bucket_path (bucket, path),
  KEY idx_storage_bucket (bucket),
  KEY idx_storage_folder (folder),
  KEY idx_storage_created (created_at),
  KEY idx_provider_pubid (provider_public_id),
  CONSTRAINT fk_storage_owner FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
