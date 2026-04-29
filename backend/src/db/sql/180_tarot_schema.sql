-- backend/src/db/sql/180_tarot_schema.sql
-- FAZ 21 — Tarot modülü

CREATE TABLE IF NOT EXISTS tarot_cards (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(50) NOT NULL UNIQUE,
  name_tr VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  arcana ENUM('major', 'minor') NOT NULL,
  suit ENUM('cups', 'pentacles', 'swords', 'wands', 'none') DEFAULT 'none',
  number INT,
  upright_meaning TEXT NOT NULL,
  reversed_meaning TEXT NOT NULL,
  image_url VARCHAR(255),
  keywords JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tarot_readings (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  guest_session_id VARCHAR(100),
  spread_type ENUM('one_card', 'three_card_general', 'three_card_decision', 'celtic_cross') NOT NULL,
  cards JSON NOT NULL, -- [{ card_id, is_reversed, position_name }]
  question TEXT,
  interpretation TEXT,
  locale CHAR(8) NOT NULL DEFAULT 'tr',
  source ENUM('llm', 'manual') DEFAULT 'llm',
  prompt_id CHAR(36),
  embedding JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
