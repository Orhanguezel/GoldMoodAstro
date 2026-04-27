-- ============================================================================
-- User Credits — astrolog 1:1 görüşme için kullan-kadar-öde (FAZ 10 / T10-2)
-- ============================================================================
-- credit_packages:     alış paketleri (200₺/2.000kr, 500₺/5.250kr, 950₺/11.000kr)
-- user_credits:        kullanıcı bakiye (1 row per user)
-- credit_transactions: işlem geçmişi (purchase/consumption/refund/bonus)
--
-- 1 kredi = 0.10₺ (10 kredi = 1₺) — Falsepeti benzeri ölçek
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_packages (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name_tr VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  description_tr TEXT,
  description_en TEXT,
  price_minor INT NOT NULL,                     -- TRY kuruş
  currency CHAR(3) NOT NULL DEFAULT 'TRY',
  credits INT NOT NULL,                         -- ana kredi
  bonus_credits INT NOT NULL DEFAULT 0,         -- ekstra (>=500₺ paketlerde)
  is_active TINYINT NOT NULL DEFAULT 1,
  is_featured TINYINT NOT NULL DEFAULT 0,       -- "popüler" rozeti
  display_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY credit_packages_active_idx (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_credits (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  balance INT NOT NULL DEFAULT 0,
  currency VARCHAR(20) NOT NULL DEFAULT 'TRY-CREDIT',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_user_credits_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS credit_transactions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  type ENUM('purchase','consumption','refund','bonus','adjustment') NOT NULL,
  amount INT NOT NULL,                          -- + alış / bonus, − tüketim / refund
  balance_after INT NOT NULL,
  reference_type VARCHAR(50),                   -- 'booking','package','campaign','manual','live_session'
  reference_id CHAR(36),
  order_id CHAR(36),                            -- purchase ise bağlı order
  description VARCHAR(500),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY credit_tx_user_idx (user_id, created_at),
  KEY credit_tx_ref_idx (reference_type, reference_id),
  CONSTRAINT fk_credit_tx_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────────────────────
-- Seed: 3 paket — Falsepeti'ye yakın ölçek
-- 200₺ → 2.000 kredi (1 dk astrolog görüşme = ~20 kredi varsayımı)
-- 500₺ → 5.000 + 250 bonus (5%) — popüler
-- 950₺ → 10.000 + 1.000 bonus (10%) — ekonomik
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO credit_packages (id, code, name_tr, name_en, description_tr, description_en, price_minor, credits, bonus_credits, is_active, is_featured, display_order) VALUES
('80000000-0000-4000-8000-000000000001', 'starter',  'Başlangıç',  'Starter',  '~10 dakika astrolog görüşmesi için.',           '~10 minutes of astrologer time.',           20000,  2000,    0,    1, 0, 0),
('80000000-0000-4000-8000-000000000002', 'popular',  'Popüler',    'Popular',  '~25 dakika + %5 bonus kredi.',                  '~25 minutes + 5% bonus credits.',           50000,  5000,  250,    1, 1, 1),
('80000000-0000-4000-8000-000000000003', 'value',    'Avantajlı',  'Value',    '~50 dakika + %10 bonus kredi.',                 '~50 minutes + 10% bonus credits.',          95000, 10000, 1000,    1, 0, 2)
ON DUPLICATE KEY UPDATE
  name_tr = VALUES(name_tr),
  name_en = VALUES(name_en),
  description_tr = VALUES(description_tr),
  description_en = VALUES(description_en),
  price_minor = VALUES(price_minor),
  credits = VALUES(credits),
  bonus_credits = VALUES(bonus_credits),
  is_active = VALUES(is_active),
  is_featured = VALUES(is_featured),
  display_order = VALUES(display_order);
