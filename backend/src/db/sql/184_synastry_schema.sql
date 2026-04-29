CREATE TABLE IF NOT EXISTS synastry_reports (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  mode ENUM('quick', 'manual', 'invite') NOT NULL,
  partner_user_id CHAR(36),
  partner_data JSON,
  invite_status ENUM('pending', 'accepted', 'declined', 'expired') DEFAULT 'accepted',
  result JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (partner_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
