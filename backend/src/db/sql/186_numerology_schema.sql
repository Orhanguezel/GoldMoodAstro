-- backend/src/db/sql/186_numerology_schema.sql
-- FAZ 24 — Numeroloji & İsim Analizi modülü

CREATE TABLE IF NOT EXISTS numerology_readings (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  full_name VARCHAR(255) NOT NULL,
  birth_date DATE NOT NULL,
  calculation_data JSON NOT NULL, -- { life_path, destiny, soul_urge, personality }
  interpretation TEXT,
  locale CHAR(8) NOT NULL DEFAULT 'tr',
  embedding JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
