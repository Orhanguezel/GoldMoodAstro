-- 038_compatibility_readings_schema.sql
-- FAZ 20 — Burç Uyumu (Compatibility)
-- 144 kombinasyon (12x12) için LLM üretimi yorumlar

CREATE TABLE IF NOT EXISTS compatibility_readings (
  id CHAR(36) PRIMARY KEY,
  sign_a ENUM('aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces') NOT NULL,
  sign_b ENUM('aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces') NOT NULL,
  locale CHAR(8) NOT NULL DEFAULT 'tr',
  
  title VARCHAR(255) NOT NULL,            -- Örn: "Koç ve Akrep Uyumu: Tutku ve Güç Savaşı"
  summary TEXT,                           -- 1-2 cümlelik spot
  content TEXT NOT NULL,                  -- Derinlemesine analiz (Aşk, Arkadaşlık, İş)
  
  -- Puanlar (1-100)
  love_score TINYINT DEFAULT 50,
  friendship_score TINYINT DEFAULT 50,
  career_score TINYINT DEFAULT 50,
  sexual_score TINYINT DEFAULT 50,
  
  source ENUM('llm','astrolog_manual') NOT NULL DEFAULT 'llm',
  is_active TINYINT DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  -- Kombinasyon benzersiz olmalı (aries-scorpio-tr)
  UNIQUE KEY comp_uq (sign_a, sign_b, locale),
  KEY sign_a_idx (sign_a),
  KEY sign_b_idx (sign_b)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
