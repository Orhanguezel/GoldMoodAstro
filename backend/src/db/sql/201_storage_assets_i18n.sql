-- =============================================================
-- 201_storage_assets_i18n.sql  (storage_assets_i18n)
--  - TR + EN + DE
--  - SAFE re-runnable: ON DUPLICATE KEY UPDATE + NOT EXISTS copy
-- =============================================================

/* ================= TABLE ================= */
CREATE TABLE IF NOT EXISTS `storage_assets_i18n` (
  id          CHAR(36)     NOT NULL,
  asset_id    CHAR(36)     NOT NULL,
  locale      VARCHAR(10)  NOT NULL,

  title       VARCHAR(255)  DEFAULT NULL,
  alt         VARCHAR(255)  DEFAULT NULL,
  caption     VARCHAR(1000) DEFAULT NULL,
  description TEXT          DEFAULT NULL,

  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  UNIQUE KEY ux_storage_assets_i18n_parent_locale (asset_id, locale),
  KEY idx_storage_assets_i18n_locale (locale),
  CONSTRAINT fk_storage_assets_i18n_asset
    FOREIGN KEY (asset_id) REFERENCES storage_assets(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* ================= SEED ================= */

-- -------------------------------------------------------------
-- TR
-- -------------------------------------------------------------
INSERT INTO storage_assets_i18n
(id, asset_id, locale, title, alt, caption, description, created_at, updated_at)
VALUES
(UUID(), @ASSET_DEMO_ID, 'tr', 'Demo Masaj Görseli', 'Profesyonel masaj görüntüsü', 'Örnek görsel', 'Demo amaçlı masaj görseli', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  alt=VALUES(alt),
  caption=VALUES(caption),
  description=VALUES(description),
  updated_at=VALUES(updated_at);

-- -------------------------------------------------------------
-- EN
-- -------------------------------------------------------------
INSERT INTO storage_assets_i18n
(id, asset_id, locale, title, alt, caption, description, created_at, updated_at)
VALUES
(UUID(), @ASSET_DEMO_ID, 'en', 'Demo Massage Image', 'Professional massage image', 'Sample image', 'Demo massage image', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  alt=VALUES(alt),
  caption=VALUES(caption),
  description=VALUES(description),
  updated_at=VALUES(updated_at);

-- -------------------------------------------------------------
-- DE
-- -------------------------------------------------------------
INSERT INTO storage_assets_i18n
(id, asset_id, locale, title, alt, caption, description, created_at, updated_at)
VALUES
(UUID(), @ASSET_DEMO_ID, 'de', 'Demo Massage Bild', 'Professionelles Massagebild', 'Beispielbild', 'Demo-Massagebild', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  alt=VALUES(alt),
  caption=VALUES(caption),
  description=VALUES(description),
  updated_at=VALUES(updated_at);
