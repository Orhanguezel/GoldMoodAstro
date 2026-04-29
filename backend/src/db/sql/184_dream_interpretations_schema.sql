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
