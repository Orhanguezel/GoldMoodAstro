CREATE TABLE IF NOT EXISTS voice_sessions (
  id CHAR(36) PRIMARY KEY,
  booking_id CHAR(36) NOT NULL UNIQUE,
  channel_name VARCHAR(255) NOT NULL,
  token_user TEXT,
  token_consultant TEXT,
  status ENUM('pending','active','ended','missed') DEFAULT 'pending',
  started_at DATETIME,
  ended_at DATETIME,
  duration_seconds INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_voice_sessions_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
