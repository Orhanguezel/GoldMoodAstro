CREATE TABLE IF NOT EXISTS wallets (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  consultant_id CHAR(36) NULL,
  balance DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  pending_balance DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  total_earnings DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  total_withdrawn DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'TRY',
  status ENUM('active','suspended','closed') NOT NULL DEFAULT 'active',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY wallets_user_id_unique (user_id),
  UNIQUE KEY wallets_consultant_id_unique (consultant_id),
  KEY wallets_created_at_idx (created_at),
  CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_wallets_consultant FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id CHAR(36) PRIMARY KEY,
  wallet_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  booking_id CHAR(36) NULL,
  type ENUM('credit','debit') NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'TRY',
  purpose VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT,
  payment_method ENUM('paypal','bank_transfer','admin_manual') NOT NULL DEFAULT 'admin_manual',
  payment_status ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
  transaction_ref VARCHAR(255),
  provider_order_id VARCHAR(255),
  provider_capture_id VARCHAR(255),
  approved_by CHAR(36),
  approved_at DATETIME(3),
  is_admin_created TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY wallet_tx_wallet_id_idx (wallet_id),
  KEY wallet_tx_user_id_idx (user_id),
  KEY wallet_tx_booking_id_idx (booking_id),
  KEY wallet_tx_created_idx (created_at),
  KEY wallet_tx_payment_status_idx (payment_status),
  CONSTRAINT fk_wallet_tx_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_wallet_tx_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_wallet_tx_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_wallet_tx_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO wallets (
  id, user_id, consultant_id, balance, pending_balance, total_earnings, total_withdrawn, currency, status
) VALUES
('60000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',595.00,0.00,595.00,0.00,'TRY','active'),
('60000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002',0.00,0.00,0.00,0.00,'TRY','active'),
('60000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000003',0.00,0.00,0.00,0.00,'TRY','active')
ON DUPLICATE KEY UPDATE
  consultant_id = VALUES(consultant_id),
  balance = VALUES(balance),
  pending_balance = VALUES(pending_balance),
  total_earnings = VALUES(total_earnings),
  total_withdrawn = VALUES(total_withdrawn),
  currency = VALUES(currency),
  status = VALUES(status);

INSERT INTO wallet_transactions (
  id, wallet_id, user_id, type, amount, currency, purpose, description, payment_method, payment_status, is_admin_created, created_at
) VALUES
('61000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','credit',350.00,'TRY','booking_payout','Doğum haritası seansı kazancı','admin_manual','completed',1,DATE_SUB(NOW(3), INTERVAL 10 DAY)),
('61000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','credit',245.00,'TRY','booking_payout','İlişki analizi seansı kazancı','admin_manual','completed',1,DATE_SUB(NOW(3), INTERVAL 4 DAY))
ON DUPLICATE KEY UPDATE
  amount = VALUES(amount),
  payment_status = VALUES(payment_status),
  description = VALUES(description);
