CREATE TABLE IF NOT EXISTS service_boosts (
  id CHAR(36) PRIMARY KEY,
  consultant_service_id CHAR(36) NOT NULL,
  consultant_id CHAR(36) NOT NULL,
  duration_days INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TRY',
  starts_at DATETIME(3) NOT NULL,
  ends_at DATETIME(3) NOT NULL,
  status ENUM('pending_payment','active','expired','cancelled') NOT NULL DEFAULT 'pending_payment',
  iyzipay_payment_id VARCHAR(80),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_service_boosts_active (consultant_service_id, status, ends_at),
  KEY idx_service_boosts_consultant (consultant_id, status, ends_at),
  CONSTRAINT fk_service_boosts_service FOREIGN KEY (consultant_service_id) REFERENCES consultant_services(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_service_boosts_consultant FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO site_settings (id, `key`, locale, value) VALUES
('032c0000-0000-4000-8000-000000000001', 'service_boost_packages', '*', '[{"id":"wk1","days":7,"price":599,"currency":"TRY"},{"id":"wk2","days":14,"price":1099,"currency":"TRY"},{"id":"wk4","days":28,"price":1899,"currency":"TRY"}]')
ON DUPLICATE KEY UPDATE value = VALUES(value);
