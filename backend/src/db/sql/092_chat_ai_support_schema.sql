CREATE TABLE IF NOT EXISTS chat_support_sessions (
  id VARCHAR(36) PRIMARY KEY,
  thread_id VARCHAR(36) NOT NULL,
  visitor_token_hash CHAR(64) NULL,
  handoff_mode VARCHAR(16) NOT NULL DEFAULT 'ai',
  ai_provider_preference VARCHAR(20) NOT NULL DEFAULT 'auto',
  preferred_locale VARCHAR(10) NULL,
  assigned_admin_user_id VARCHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_chat_support_sessions_thread (thread_id),
  KEY ix_chat_support_sessions_mode_updated (handoff_mode, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_ai_message_meta (
  id VARCHAR(36) PRIMARY KEY,
  message_id VARCHAR(36) NOT NULL,
  provider VARCHAR(20) NOT NULL,
  model VARCHAR(100) NOT NULL,
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_chat_ai_message_meta_message (message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_ai_knowledge (
  id VARCHAR(36) PRIMARY KEY,
  locale VARCHAR(10) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  tags TEXT NULL,
  is_active TINYINT NOT NULL DEFAULT 1,
  priority INT NOT NULL DEFAULT 100,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_chat_ai_knowledge_locale_active (locale, is_active, priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO site_settings (id, `key`, locale, value) VALUES
  (UUID(), 'chat_ai_enabled', '*', 'true'),
  (UUID(), 'chat_ai_default_provider', '*', 'auto'),
  (UUID(), 'chat_ai_provider_order', '*', 'anthropic,groq,openai'),
  (UUID(), 'chat_ai_system_prompt', '*', 'GoldMoodAstro destek asistanısın. Yalnız platform kullanımı, danışmanlık hizmetleri, randevu, ödeme ve hesap süreçleri hakkında yardımcı ol. Yalnız verilen bilgi bankasındaki doğrulanmış bilgileri kullan; süre, iptal koşulu, iletişim kanalı veya özellik uydurma. Bilgi yoksa canlı destek isteği öner. Tıbbi, hukuki veya kesin gelecek iddiasında bulunma. Düz metinle, başlıksız ve en fazla 5 kısa cümleyle yanıt ver.'),
  (UUID(), 'chat_ai_groq_model', '*', 'llama-3.3-70b-versatile'),
  (UUID(), 'chat_ai_openai_model', '*', 'gpt-4o-mini'),
  (UUID(), 'chat_ai_anthropic_model', '*', 'claude-haiku-4-5-20251001')
ON DUPLICATE KEY UPDATE value = VALUES(value);

INSERT INTO chat_ai_knowledge (id, locale, title, content, tags, is_active, priority, created_at, updated_at) VALUES
  ('09200000-0000-4000-8000-000000000001', 'tr', 'Randevu alma', 'Danışmanlar sayfasından bir uzman seçin. Danışman profilinde hizmeti ve uygun zaman dilimini seçerek randevuyu oluşturun. Ardından güvenli ödeme adımını tamamlayın. Onaylanan randevular hesabınızdaki randevular bölümünde görünür.', 'randevu,danışman,ödeme', 1, 10, NOW(), NOW()),
  ('09200000-0000-4000-8000-000000000002', 'en', 'Booking an appointment', 'Choose an expert from the Consultants page. On the consultant profile, select a service and an available time slot to create the booking. Complete the secure payment step. Confirmed bookings appear in the appointments section of your account.', 'booking,consultant,payment', 1, 10, NOW(), NOW()),
  ('09200000-0000-4000-8000-000000000003', 'de', 'Termin buchen', 'Wählen Sie auf der Beraterseite eine Fachperson aus. Wählen Sie im Profil eine Dienstleistung und einen verfügbaren Termin. Schließen Sie anschließend die sichere Zahlung ab. Bestätigte Termine erscheinen im Terminbereich Ihres Kontos.', 'termin,berater,zahlung', 1, 10, NOW(), NOW())
ON DUPLICATE KEY UPDATE content = VALUES(content), tags = VALUES(tags), is_active = VALUES(is_active), priority = VALUES(priority), updated_at = NOW();
