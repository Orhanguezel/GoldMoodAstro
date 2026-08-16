-- =============================================================
-- 081_withdrawal_requests_schema.sql
-- Danışman ödeme/çekim talepleri.
-- YAPILACAKLAR D2 (2026-05-20).
-- IBAN/holder snapshot olarak saklanır (consultants tablosu değişse bile
-- talebin yapıldığı andaki bilgi geçerlidir).
-- =============================================================
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id CHAR(36) PRIMARY KEY,
  consultant_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
  bank_iban VARCHAR(64) NOT NULL,
  bank_holder VARCHAR(160) NOT NULL,
  bank_name VARCHAR(120) NULL,
  status ENUM('pending','approved','paid','rejected','cancelled') NOT NULL DEFAULT 'pending',
  requested_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  reviewed_at DATETIME(3) NULL,
  paid_at DATETIME(3) NULL,
  reviewed_by CHAR(36) NULL,
  rejection_reason TEXT NULL,
  admin_note TEXT NULL,
  transfer_reference VARCHAR(120) NULL,
  metadata JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY withdrawals_consultant_idx (consultant_id, status),
  KEY withdrawals_user_idx (user_id),
  KEY withdrawals_status_idx (status, requested_at),
  CONSTRAINT fk_withdrawals_consultant FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_withdrawals_user       FOREIGN KEY (user_id)       REFERENCES users(id)       ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_withdrawals_reviewer   FOREIGN KEY (reviewed_by)   REFERENCES users(id)       ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
