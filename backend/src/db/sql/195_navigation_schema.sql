-- =============================================================
-- FILE: 195_navigation_schema.sql
-- Navigation: header menu (with dropdown) + footer sections + footer links
-- Tables: footer_sections, footer_sections_i18n, menu_items, menu_items_i18n
-- =============================================================

CREATE TABLE IF NOT EXISTS footer_sections (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  slug          VARCHAR(100)  NOT NULL,
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  display_order INT           NOT NULL DEFAULT 0,
  created_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY footer_sections_slug_uq (slug),
  KEY footer_sections_active_order_idx (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS footer_sections_i18n (
  id                 CHAR(36)      NOT NULL PRIMARY KEY,
  footer_section_id  CHAR(36)      NOT NULL,
  locale             CHAR(8)       NOT NULL,
  title              VARCHAR(255)  NOT NULL,
  description        TEXT          NULL,
  created_at         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY footer_sections_i18n_uq (footer_section_id, locale),
  CONSTRAINT fk_footer_sections_i18n_section
    FOREIGN KEY (footer_section_id) REFERENCES footer_sections(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_items (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  location      ENUM('header', 'footer') NOT NULL,
  section_id    CHAR(36)      NULL,
  parent_id     CHAR(36)      NULL,
  type          ENUM('page', 'custom') NOT NULL DEFAULT 'custom',
  page_id       CHAR(36)      NULL,
  url           VARCHAR(500)  NULL,
  icon          VARCHAR(100)  NULL,
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  display_order INT           NOT NULL DEFAULT 0,
  created_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY menu_items_loc_active_order_idx (location, is_active, display_order),
  KEY menu_items_section_idx (section_id),
  KEY menu_items_parent_idx  (parent_id),
  CONSTRAINT fk_menu_items_section
    FOREIGN KEY (section_id) REFERENCES footer_sections(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_menu_items_parent
    FOREIGN KEY (parent_id)  REFERENCES menu_items(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_items_i18n (
  id            CHAR(36)      NOT NULL PRIMARY KEY,
  menu_item_id  CHAR(36)      NOT NULL,
  locale        CHAR(8)       NOT NULL,
  title         VARCHAR(255)  NOT NULL,
  created_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY menu_items_i18n_uq (menu_item_id, locale),
  CONSTRAINT fk_menu_items_i18n_item
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
