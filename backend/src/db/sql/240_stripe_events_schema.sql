-- =============================================================
-- 240_stripe_events_schema.sql
-- Stripe webhook event kaydı (idempotens + denetim izi).
-- STRIPE-ODEME-RAPORU §4.2 — Payment Link/Checkout fazı.
-- =============================================================
CREATE TABLE IF NOT EXISTS stripe_events (
  id VARCHAR(255) PRIMARY KEY,            -- Stripe event id (evt_...)
  type VARCHAR(100) NOT NULL,
  api_version VARCHAR(40),
  payload LONGTEXT NOT NULL,              -- ham JSON (imzası doğrulanmış gövde)
  processed_at DATETIME(3) NULL,          -- sipariş/randevu eşleştirmesi yapılınca
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_stripe_events_type_time (type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
