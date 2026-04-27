-- ============================================================================
-- Subscriptions — kullanıcı aboneliği (FAZ 10 / T10-1)
-- ============================================================================
-- subscription_plans: sabit plan tanımları (free, monthly, yearly...)
-- subscriptions:      kullanıcı aboneliği (provider: iyzipay / apple_iap / google_iap)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name_tr VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  description_tr TEXT,
  description_en TEXT,
  price_minor INT NOT NULL,                     -- TRY kuruş (1 TL = 100)
  currency CHAR(3) NOT NULL DEFAULT 'TRY',
  period ENUM('monthly','yearly','lifetime') NOT NULL,
  trial_days INT NOT NULL DEFAULT 0,
  features JSON,                                -- ["unlimited_readings", "ad_free", ...]
  is_active TINYINT NOT NULL DEFAULT 1,
  display_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY subscription_plans_active_idx (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscriptions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  plan_id CHAR(36) NOT NULL,
  provider ENUM('iyzipay','apple_iap','google_iap','manual') NOT NULL DEFAULT 'iyzipay',
  provider_subscription_id VARCHAR(255),        -- iyzipay subscription_reference_code, IAP transaction id
  provider_customer_id VARCHAR(255),
  status ENUM('pending','active','cancelled','expired','grace_period','past_due') NOT NULL DEFAULT 'pending',
  started_at DATETIME(3),
  ends_at DATETIME(3),                          -- mevcut periyodun bitişi
  trial_ends_at DATETIME(3),
  cancelled_at DATETIME(3),
  cancellation_reason VARCHAR(500),
  auto_renew TINYINT NOT NULL DEFAULT 1,
  price_minor INT NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'TRY',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY subscriptions_user_idx (user_id, status),
  KEY subscriptions_status_idx (status, ends_at),
  KEY subscriptions_provider_idx (provider, provider_subscription_id),
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────────────────────
-- Seed: 3 plan
-- Strateji: free (0₺) — temel, monthly (149₺/ay) — Ms Astro'nun altı,
--          yearly (1.499₺/yıl) — %16 indirim
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO subscription_plans (id, code, name_tr, name_en, description_tr, description_en, price_minor, currency, period, trial_days, features, is_active, display_order) VALUES
('70000000-0000-4000-8000-000000000001', 'free',    'Ücretsiz',  'Free',    'Günlük yorum ve temel doğum haritası.', 'Daily reading and basic birth chart.',                  0,      'TRY', 'monthly', 0, '["daily_reading_basic","birth_chart_basic"]', 1, 0),
('70000000-0000-4000-8000-000000000002', 'monthly', 'Aylık',     'Monthly', 'Sınırsız AI yorum, sinastri, transit takvimi.',  'Unlimited AI readings, synastry, transit calendar.',     14900,  'TRY', 'monthly', 7, '["daily_reading_premium","synastry","transit_calendar","ad_free","priority_support"]', 1, 1),
('70000000-0000-4000-8000-000000000003', 'yearly',  'Yıllık',    'Yearly',  'Aylık tüm özellikler + %16 indirim, yıllık fatura.', 'All monthly features + 16% off, yearly billing.',     149900, 'TRY', 'yearly',  14, '["daily_reading_premium","synastry","transit_calendar","ad_free","priority_support","yearly_review"]', 1, 2)
ON DUPLICATE KEY UPDATE
  name_tr = VALUES(name_tr),
  name_en = VALUES(name_en),
  description_tr = VALUES(description_tr),
  description_en = VALUES(description_en),
  price_minor = VALUES(price_minor),
  trial_days = VALUES(trial_days),
  features = VALUES(features),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order);
