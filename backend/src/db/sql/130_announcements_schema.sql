-- ================================================================
-- 130_announcements_schema.sql — In-app announcements
-- ================================================================

CREATE TABLE IF NOT EXISTS announcements (
  id         CHAR(36) NOT NULL,
  title      VARCHAR(255) NOT NULL,
  body       TEXT NOT NULL,
  audience   ENUM('all','users','consultants') NOT NULL DEFAULT 'all',
  is_active  TINYINT NOT NULL DEFAULT 1,
  starts_at  DATETIME(3),
  ends_at    DATETIME(3),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_announcements_audience (audience),
  KEY idx_announcements_active (is_active),
  KEY idx_announcements_starts (starts_at),
  KEY idx_announcements_ends (ends_at),
  KEY idx_announcements_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO announcements (
  id,
  title,
  body,
  audience,
  is_active,
  starts_at,
  ends_at,
  created_at,
  updated_at
) VALUES
(
  '64000000-0000-4000-8000-000000000001',
  'Planli bakim bilgilendirmesi',
  'Kisa sureli bakim sirasinda randevu ve gorusme akislari izlenmeye devam eder.',
  'all',
  1,
  NOW(3) - INTERVAL 1 DAY,
  NOW(3) + INTERVAL 7 DAY,
  NOW(3) - INTERVAL 1 DAY,
  NOW(3) - INTERVAL 1 DAY
),
(
  '64000000-0000-4000-8000-000000000002',
  'Danisman paneli hatirlatmasi',
  'Musaitlik takviminizi guncel tutarak kullanicilarin dogru slotlari gormesini saglayabilirsiniz.',
  'consultants',
  1,
  NOW(3),
  NOW(3) + INTERVAL 14 DAY,
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  body = VALUES(body),
  audience = VALUES(audience),
  is_active = VALUES(is_active),
  starts_at = VALUES(starts_at),
  ends_at = VALUES(ends_at),
  updated_at = VALUES(updated_at);
