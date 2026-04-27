-- 037_daily_horoscopes_schema.sql

CREATE TABLE IF NOT EXISTS daily_horoscopes (
  id CHAR(36) PRIMARY KEY,
  date DATE NOT NULL,                   -- Interpretation date
  sign ENUM('aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces') NOT NULL,
  content_tr TEXT NOT NULL,             -- Turkish interpretation
  content_en TEXT,                      -- English interpretation
  mood_score TINYINT DEFAULT 5,         -- 1-10
  lucky_number TINYINT,
  lucky_color VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX idx_date_sign (date, sign)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
