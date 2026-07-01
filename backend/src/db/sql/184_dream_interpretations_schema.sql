-- backend/src/db/sql/184_dream_interpretations_schema.sql
-- FAZ 23 — Rüya Yorumu modülü

CREATE TABLE IF NOT EXISTS dream_symbols (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(50) NOT NULL UNIQUE,
  name_tr VARCHAR(100) NOT NULL,
  meaning TEXT NOT NULL,
  category JSON, -- ["uyarı", "müjde", "psikolojik"]
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dream_symbol_i18n (
  id CHAR(36) PRIMARY KEY,
  symbol_id CHAR(36) NOT NULL,
  locale CHAR(8) NOT NULL,
  name VARCHAR(100) NOT NULL,
  meaning TEXT NOT NULL,
  category JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY dream_symbol_i18n_uq (symbol_id, locale),
  KEY dream_symbol_i18n_locale_idx (locale),
  CONSTRAINT fk_dream_symbol_i18n_symbol FOREIGN KEY (symbol_id) REFERENCES dream_symbols(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dream_interpretations (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  dream_text TEXT NOT NULL,
  detected_symbols JSON, -- [{ symbol_id, slug, name }]
  interpretation TEXT,
  locale CHAR(8) NOT NULL DEFAULT 'tr',
  embedding JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
