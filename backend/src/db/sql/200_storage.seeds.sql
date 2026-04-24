-- =============================================================
-- 200_storage_assets.sql  (storage_assets)
-- =============================================================

/* ================= TABLE ================= */
CREATE TABLE IF NOT EXISTS `storage_assets` (
  id                       CHAR(36)      NOT NULL,
  user_id                  CHAR(36)      DEFAULT NULL,

  `name`                   VARCHAR(255)  NOT NULL,
  bucket                   VARCHAR(64)   NOT NULL,
  `path`                   VARCHAR(512)  NOT NULL,
  folder                   VARCHAR(255)  DEFAULT NULL,

  mime                     VARCHAR(127)  NOT NULL,
  size                     BIGINT UNSIGNED NOT NULL,

  width                    INT UNSIGNED  DEFAULT NULL,
  height                   INT UNSIGNED  DEFAULT NULL,

  url                      TEXT          DEFAULT NULL,
  hash                     VARCHAR(64)   DEFAULT NULL,

  provider                 VARCHAR(16)   NOT NULL DEFAULT 'cloudinary',
  provider_public_id       VARCHAR(255)  DEFAULT NULL,
  provider_resource_type   VARCHAR(16)   DEFAULT NULL,
  provider_format          VARCHAR(32)   DEFAULT NULL,
  provider_version         INT UNSIGNED  DEFAULT NULL,
  etag                     VARCHAR(64)   DEFAULT NULL,

  metadata                 JSON          DEFAULT NULL,

  created_at               DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at               DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  UNIQUE KEY uniq_bucket_path (bucket, `path`),
  KEY idx_storage_bucket (bucket),
  KEY idx_storage_folder (folder),
  KEY idx_storage_created (created_at),
  KEY idx_provider_pubid (provider_public_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ================= SEED: ASSETS (deterministik anahtar: bucket+path) ================= */

-- Ortak demo URL (Unsplash - masaj görseli)
SET @DEMO_IMG_URL := 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&h=800&q=80';

-- Örnek görsel (uploads klasöründe)
SET @ASSET_DEMO_ID := (SELECT id FROM storage_assets WHERE bucket='public' AND `path`='uploads/demo-massage.jpg' LIMIT 1);
SET @ASSET_DEMO_ID := COALESCE(@ASSET_DEMO_ID, UUID());
INSERT INTO storage_assets
(id, user_id, `name`, bucket, `path`, folder, mime, size, width, height, url, hash,
 provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
VALUES
(@ASSET_DEMO_ID, NULL, 'demo-massage.jpg', 'public', 'uploads/demo-massage.jpg', 'uploads',
 'image/jpeg', 245120, 1200, 800,
 @DEMO_IMG_URL, NULL,
 'cloudinary', NULL, 'image', 'jpg', 1, NULL, NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
 mime=VALUES(mime),
 size=VALUES(size),
 url=VALUES(url),
 width=VALUES(width),
 height=VALUES(height),
 provider_format=VALUES(provider_format),
 updated_at=VALUES(updated_at);

-- Anastasia König — Hakkımızda görseli
SET @ASSET_ANAS3_ID := (SELECT id FROM storage_assets WHERE bucket='public' AND `path`='uploads/anas-3.jpg' LIMIT 1);
SET @ASSET_ANAS3_ID := COALESCE(@ASSET_ANAS3_ID, UUID());
INSERT INTO storage_assets
(id, user_id, `name`, bucket, `path`, folder, mime, size, width, height, url, hash,
 provider, provider_public_id, provider_resource_type, provider_format, provider_version, etag, metadata, created_at, updated_at)
VALUES
(@ASSET_ANAS3_ID, NULL, 'anas-3.jpg', 'public', 'uploads/anas-3.jpg', 'uploads',
 'image/jpeg', 138165, 1280, 960,
 '/uploads/anas-3.jpg', NULL,
 'local', NULL, 'image', 'jpg', 1, NULL, NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
 mime=VALUES(mime),
 size=VALUES(size),
 url=VALUES(url),
 width=VALUES(width),
 height=VALUES(height),
 provider=VALUES(provider),
 provider_format=VALUES(provider_format),
 updated_at=VALUES(updated_at);
