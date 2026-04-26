CREATE TABLE IF NOT EXISTS live_sessions (
  id CHAR(36) PRIMARY KEY,
  booking_id CHAR(36) NOT NULL UNIQUE,
  room_name VARCHAR(255) NOT NULL,
  host_token TEXT,
  guest_token TEXT,
  media_type ENUM('audio','video') DEFAULT 'audio',
  started_at DATETIME,
  ended_at DATETIME,
  duration_seconds INT,
  recording_url TEXT,
  recording_started_at DATETIME,
  status ENUM('pending','active','ended','timed_out','cancelled') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX live_sessions_booking_idx (booking_id),
  INDEX live_sessions_status_idx (status),
  CONSTRAINT fk_live_sessions_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO live_sessions (
  id, booking_id, room_name, media_type, status, started_at, ended_at, duration_seconds
) VALUES (
  '41000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  'goldmood-40000000-0000-4000-8000-000000000001',
  'audio',
  'ended',
  '2026-04-27 10:00:00',
  '2026-04-27 10:30:00',
  1800
)
ON DUPLICATE KEY UPDATE status = VALUES(status), duration_seconds = VALUES(duration_seconds);
