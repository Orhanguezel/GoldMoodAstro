-- =============================================================
-- 049-94_site_settings_ui_chat.sql
-- ui_chat: Support chat widget UI strings
--  - Key: ui_chat
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
--  - Upsert-safe: requires UNIQUE(`key`,`locale`)
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at)
VALUES

/* ================= TR ================= */
(
  UUID(),
  'ui_chat',
  'tr',
  CAST(JSON_OBJECT(
    'ui_chat_title',              'Destek Botu',
    'ui_chat_subtitle',           'AI destek hattı',
    'ui_chat_placeholder',        'Mesajınızı yazın...',
    'ui_chat_send',               'Gönder',
    'ui_chat_connect_admin',      'Canlı desteğe bağlan',
    'ui_chat_connecting',         'Bağlanıyor...',
    'ui_chat_login_title',        'Destek hattını kullanmak için giriş yapın.',
    'ui_chat_login_button',       'Giriş Yap',
    'ui_chat_loading',            'Hazırlanıyor...',
    'ui_chat_ai_mode',            'AI aktif',
    'ui_chat_admin_mode',         'Canlı destek talep edildi',
    'ui_chat_admin_inbox',        'Canlı destek kuyruğu',
    'ui_chat_no_admin_threads',   'Canlı destek talebi bekleniyor.',
    'ui_chat_thread_label',       'Talep',
    'ui_chat_queue_pending',      'Atanmamış',
    'ui_chat_queue_mine',         'Bana Atanan',
    'ui_chat_queue_all',          'Tümü',
    'ui_chat_unread_label',       'yeni mesaj',
    'ui_chat_empty',              'Merhaba, size nasıl yardımcı olabilirim?'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),

/* ================= EN ================= */
(
  UUID(),
  'ui_chat',
  'en',
  CAST(JSON_OBJECT(
    'ui_chat_title',              'Support Bot',
    'ui_chat_subtitle',           'AI support line',
    'ui_chat_placeholder',        'Type your message...',
    'ui_chat_send',               'Send',
    'ui_chat_connect_admin',      'Connect to live support',
    'ui_chat_connecting',         'Connecting...',
    'ui_chat_login_title',        'Please login to use support chat.',
    'ui_chat_login_button',       'Login',
    'ui_chat_loading',            'Preparing...',
    'ui_chat_ai_mode',            'AI active',
    'ui_chat_admin_mode',         'Live support requested',
    'ui_chat_admin_inbox',        'Live support inbox',
    'ui_chat_no_admin_threads',   'No live support requests yet.',
    'ui_chat_thread_label',       'Request',
    'ui_chat_queue_pending',      'Unassigned',
    'ui_chat_queue_mine',         'Assigned to me',
    'ui_chat_queue_all',          'All',
    'ui_chat_unread_label',       'new messages',
    'ui_chat_empty',              'Hello, how can I help you today?'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),

/* ================= DE ================= */
(
  UUID(),
  'ui_chat',
  'de',
  CAST(JSON_OBJECT(
    'ui_chat_title',              'Support Bot',
    'ui_chat_subtitle',           'KI-Support',
    'ui_chat_placeholder',        'Nachricht eingeben...',
    'ui_chat_send',               'Senden',
    'ui_chat_connect_admin',      'Mit Live-Support verbinden',
    'ui_chat_connecting',         'Verbinde...',
    'ui_chat_login_title',        'Bitte melden Sie sich an, um den Chat zu nutzen.',
    'ui_chat_login_button',       'Anmelden',
    'ui_chat_loading',            'Wird vorbereitet...',
    'ui_chat_ai_mode',            'KI aktiv',
    'ui_chat_admin_mode',         'Live-Support angefordert',
    'ui_chat_admin_inbox',        'Live-Support Posteingang',
    'ui_chat_no_admin_threads',   'Noch keine Live-Support-Anfragen.',
    'ui_chat_thread_label',       'Anfrage',
    'ui_chat_queue_pending',      'Nicht zugewiesen',
    'ui_chat_queue_mine',         'Mir zugewiesen',
    'ui_chat_queue_all',          'Alle',
    'ui_chat_unread_label',       'neue Nachrichten',
    'ui_chat_empty',              'Hallo, wie kann ich Ihnen helfen?'
  ) AS CHAR),
  NOW(3),
  NOW(3)
)

ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
