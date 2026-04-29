-- =============================================================
-- FILE: 197_custom_pages_schema.sql
-- CMS-style custom pages: about, blog landing, legal pages
-- Tables: custom_pages, custom_pages_i18n
-- =============================================================

CREATE TABLE IF NOT EXISTS custom_pages (
  id                       CHAR(36)      NOT NULL PRIMARY KEY,
  module_key               VARCHAR(64)   NOT NULL DEFAULT 'page',
  is_published             TINYINT(1)    NOT NULL DEFAULT 1,
  featured                 TINYINT(1)    NOT NULL DEFAULT 0,
  featured_image           VARCHAR(500)  NULL,
  featured_image_asset_id  CHAR(36)      NULL,
  display_order            INT           NOT NULL DEFAULT 0,
  order_num                INT           NOT NULL DEFAULT 0,
  image_url                VARCHAR(500)  NULL,
  storage_asset_id         CHAR(36)      NULL,
  images                   JSON          NULL,
  storage_image_ids        JSON          NULL,
  created_at               DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at               DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY custom_pages_module_idx     (module_key),
  KEY custom_pages_pub_order_idx  (is_published, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS custom_pages_i18n (
  id                  CHAR(36)      NOT NULL PRIMARY KEY,
  custom_page_id      CHAR(36)      NOT NULL,
  locale              CHAR(8)       NOT NULL,
  title               VARCHAR(255)  NOT NULL,
  slug                VARCHAR(160)  NOT NULL,
  content             LONGTEXT      NULL,
  summary             TEXT          NULL,
  featured_image_alt  VARCHAR(255)  NULL,
  meta_title          VARCHAR(255)  NULL,
  meta_description    VARCHAR(500)  NULL,
  tags                VARCHAR(500)  NULL,
  created_at          DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at          DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY custom_pages_i18n_pid_locale_uq (custom_page_id, locale),
  UNIQUE KEY custom_pages_i18n_slug_locale_uq (slug, locale),
  CONSTRAINT fk_custom_pages_i18n_parent
    FOREIGN KEY (custom_page_id) REFERENCES custom_pages(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
