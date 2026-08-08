CREATE TABLE IF NOT EXISTS contact_messages (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'new',
  is_resolved TINYINT(1) NOT NULL DEFAULT 0,
  admin_note VARCHAR(2000) NULL,
  ip VARCHAR(64) NULL,
  user_agent VARCHAR(512) NULL,
  website VARCHAR(255) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_contact_created_at (created_at),
  KEY idx_contact_status (status),
  KEY idx_contact_resolved (is_resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin yanıtları (iki yönlü mesajlaşma): admin cevabı kullanıcıya e-posta gider + burada kayıt.
CREATE TABLE IF NOT EXISTS contact_replies (
  id CHAR(36) PRIMARY KEY,
  contact_id CHAR(36) NOT NULL,
  message TEXT NOT NULL,
  admin_user_id CHAR(36) NULL,
  channel VARCHAR(20) NOT NULL DEFAULT 'email',
  direction VARCHAR(10) NOT NULL DEFAULT 'outbound',
  from_email VARCHAR(255) NULL,
  email_message_id VARCHAR(998) NULL,
  email_status VARCHAR(20) NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_contact_replies_contact (contact_id),
  KEY idx_contact_replies_msgid (email_message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
