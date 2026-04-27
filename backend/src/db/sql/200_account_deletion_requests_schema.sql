-- ============================================================================
-- Account Deletion Requests — KVKK F9 (FAZ 18 / T18-1)
-- ============================================================================
-- Mantık: Kullanıcı hesap silmek isteyince talep yaratılır (7 gün cooling-off).
-- Cron her gün scan eder: requested_at + 7 gün geçti + status='pending' → kalıcı sil
-- (CASCADE FK'lerle tüm ilişkili veriler temizlenir: birth_charts, bookings, ...).
-- Kullanıcı 7 gün içinde DELETE ile talebi iptal edebilir.
-- ============================================================================

CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  requested_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  scheduled_for DATETIME(3) NOT NULL,                    -- requested_at + 7 gün
  status ENUM('pending','cancelled','completed') NOT NULL DEFAULT 'pending',
  cancelled_at DATETIME(3),
  completed_at DATETIME(3),
  reason VARCHAR(500),
  ip_address VARCHAR(45),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY adr_user_pending_uq (user_id, status),       -- 1 user = 1 active pending request
  KEY adr_scheduled_idx (scheduled_for, status),
  CONSTRAINT fk_adr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
