-- ============================================================================
-- Campaigns — kupon, indirim, hedefli promo (FAZ 13 / T13-1)
-- ============================================================================
-- type: discount_percentage (0-100), discount_fixed (price_minor),
--       bonus_credits (kredi paketi alımında ekstra kredi),
--       free_trial_days (subscription'a ekstra trial gün)
-- applies_to: subscription | credit_package | consultant_booking | all
-- target_audience JSON: { new_user?: bool, has_subscription?: bool, ... }
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaigns (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,             -- büyük harfle saklanır (uppercase)
  name_tr VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  description_tr TEXT,
  description_en TEXT,
  type ENUM('discount_percentage','discount_fixed','bonus_credits','free_trial_days') NOT NULL,
  value DECIMAL(10,2) NOT NULL,                 -- yüzde 0-100, kuruş, kredi, gün
  max_uses INT,                                 -- toplam kullanım limiti (null = sınırsız)
  max_uses_per_user INT NOT NULL DEFAULT 1,
  used_count INT NOT NULL DEFAULT 0,
  starts_at DATETIME(3),
  ends_at DATETIME(3),
  applies_to ENUM('subscription','credit_package','consultant_booking','all') NOT NULL DEFAULT 'all',
  target_audience JSON,                         -- {"new_user":true, "has_subscription":false}
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY campaigns_active_idx (is_active, starts_at, ends_at),
  KEY campaigns_applies_idx (applies_to, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS campaign_redemptions (
  id CHAR(36) PRIMARY KEY,
  campaign_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  order_id CHAR(36),                            -- redeemed in checkout (yoksa stand-alone redeem)
  value_applied DECIMAL(10,2) NOT NULL,
  redeemed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY campaign_red_campaign_idx (campaign_id),
  KEY campaign_red_user_idx (user_id),
  KEY campaign_red_order_idx (order_id),
  CONSTRAINT fk_campaign_red_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_campaign_red_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────────────────────
-- Seed: 1 örnek welcome kampanyası (yeni kullanıcılar için %20 indirim, 100 kullanım)
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO campaigns (id, code, name_tr, name_en, description_tr, description_en, type, value, max_uses, applies_to, target_audience, is_active) VALUES
('c0000000-0000-4000-8000-000000000001', 'WELCOME20',
 'Hoş Geldin İndirimi', 'Welcome Discount',
 'İlk aboneliğinizde %20 indirim.', '20% off your first subscription.',
 'discount_percentage', 20.00, 100, 'subscription',
 JSON_OBJECT('new_user', true), 1)
ON DUPLICATE KEY UPDATE
  name_tr = VALUES(name_tr),
  description_tr = VALUES(description_tr),
  value = VALUES(value),
  is_active = VALUES(is_active);
