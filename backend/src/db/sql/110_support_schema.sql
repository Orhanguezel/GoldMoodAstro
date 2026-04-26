-- ================================================================
-- 110_support_schema.sql — Support tickets and replies
-- ================================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id         CHAR(36) NOT NULL,
  user_id    CHAR(36) NOT NULL,
  subject    VARCHAR(255) NOT NULL,
  message    TEXT NOT NULL,
  status     ENUM('open','in_progress','waiting_response','closed') NOT NULL DEFAULT 'open',
  priority   ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_support_tickets_user (user_id),
  KEY idx_support_tickets_status (status),
  KEY idx_support_tickets_priority (priority),
  KEY idx_support_tickets_created (created_at),
  KEY idx_support_tickets_updated (updated_at),
  CONSTRAINT fk_support_tickets_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_replies (
  id         CHAR(36) NOT NULL,
  ticket_id  CHAR(36) NOT NULL,
  user_id    CHAR(36),
  message    TEXT NOT NULL,
  is_admin   TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_ticket_replies_ticket (ticket_id),
  KEY idx_ticket_replies_user (user_id),
  KEY idx_ticket_replies_created (created_at),
  CONSTRAINT fk_ticket_replies_ticket
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ticket_replies_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO support_tickets (
  id,
  user_id,
  subject,
  message,
  status,
  priority,
  created_at,
  updated_at
) VALUES
(
  '62000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000010',
  'Randevu hakkinda soru',
  'Yaklasan randevum icin gorusme baglantisinin ne zaman aktif olacagini ogrenmek istiyorum.',
  'in_progress',
  'medium',
  NOW(3) - INTERVAL 2 HOUR,
  NOW(3) - INTERVAL 30 MINUTE
)
ON DUPLICATE KEY UPDATE
  user_id = VALUES(user_id),
  subject = VALUES(subject),
  message = VALUES(message),
  status = VALUES(status),
  priority = VALUES(priority),
  updated_at = VALUES(updated_at);

INSERT INTO ticket_replies (
  id,
  ticket_id,
  user_id,
  message,
  is_admin,
  created_at
) VALUES
(
  '63000000-0000-4000-8000-000000000001',
  '62000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000010',
  'Randevu saati yaklasinca uygulama icinden bildirim alabilir miyim?',
  0,
  NOW(3) - INTERVAL 90 MINUTE
),
(
  '63000000-0000-4000-8000-000000000002',
  '62000000-0000-4000-8000-000000000001',
  NULL,
  'Evet, gorusme baslamadan once hatirlatici bildirim gonderilir ve randevu detayindan katilabilirsiniz.',
  1,
  NOW(3) - INTERVAL 30 MINUTE
)
ON DUPLICATE KEY UPDATE
  ticket_id = VALUES(ticket_id),
  user_id = VALUES(user_id),
  message = VALUES(message),
  is_admin = VALUES(is_admin),
  created_at = VALUES(created_at);
