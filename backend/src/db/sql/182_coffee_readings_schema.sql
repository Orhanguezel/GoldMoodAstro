-- backend/src/db/sql/182_coffee_readings_schema.sql
-- FAZ 22 — Kahve Falı modülü

CREATE TABLE IF NOT EXISTS coffee_symbols (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(50) NOT NULL UNIQUE,
  name_tr VARCHAR(100) NOT NULL,
  meaning TEXT NOT NULL,
  category JSON, -- ["aşk", "para", "sağlık"]
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coffee_symbol_i18n (
  id CHAR(36) PRIMARY KEY,
  symbol_id CHAR(36) NOT NULL,
  locale CHAR(8) NOT NULL,
  name VARCHAR(100) NOT NULL,
  meaning TEXT NOT NULL,
  category JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY coffee_symbol_i18n_uq (symbol_id, locale),
  KEY coffee_symbol_i18n_locale_idx (locale),
  CONSTRAINT fk_coffee_symbol_i18n_symbol FOREIGN KEY (symbol_id) REFERENCES coffee_symbols(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coffee_readings (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  guest_session_id VARCHAR(100),
  image_ids JSON NOT NULL, -- ["id1", "id2", "id3"]
  detected_symbols JSON, -- [{ symbol_id, position: "cup|saucer", confidence }]
  interpretation TEXT,
  locale CHAR(8) NOT NULL DEFAULT 'tr',
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  embedding JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
