-- 037_daily_horoscopes_schema.sql
-- FAZ 9 + FAZ 20-T20-1 — Burç yorumları (daily/weekly/monthly/transit)
--
-- Tablo adı geriye uyumluluk için 'daily_horoscopes' kalır,
-- ama artık period kolonuyla 4 farklı periyodu tutar (locale per-row).

CREATE TABLE IF NOT EXISTS daily_horoscopes (
  id CHAR(36) PRIMARY KEY,
  period ENUM('daily','weekly','monthly','transit') NOT NULL DEFAULT 'daily',
  period_start_date DATE NOT NULL,        -- daily: o gün; weekly: pazartesi; monthly: ayın 1'i; transit: ay başı
  sign ENUM('aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces') NOT NULL,
  locale CHAR(8) NOT NULL DEFAULT 'tr',
  content TEXT NOT NULL,                  -- LLM üretimi tek-locale içerik
  mood_score TINYINT DEFAULT 5,           -- 1-10
  lucky_number TINYINT,
  lucky_color VARCHAR(50),
  source ENUM('llm','astrolog_manual','seed') NOT NULL DEFAULT 'llm',
  prompt_id CHAR(36),                     -- LLM ile üretildiyse kullanılan llm_prompts.id
  embedding JSON,                         -- anti-copy-paste için (ileride doldurulabilir)
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY horoscope_period_sign_locale_uq (period, period_start_date, sign, locale),
  KEY horoscope_lookup_idx (sign, period, period_start_date, locale),
  KEY horoscope_period_idx (period, period_start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
