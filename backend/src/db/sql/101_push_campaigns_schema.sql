-- =============================================================
-- 101_push_campaigns_schema.sql
-- Push notification kampanya preset'leri.
-- FCM gönderimi admin endpoint'iyle yapılır; kampanya pasifse gönderilmez.
-- =============================================================

CREATE TABLE IF NOT EXISTS push_campaigns (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  target_segment ENUM('all','users','consultants','users_without_booking','inactive_7d') NOT NULL DEFAULT 'all',
  deep_link VARCHAR(255),
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY push_campaigns_active_idx (is_active),
  KEY push_campaigns_segment_idx (target_segment)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO push_campaigns (
  id, slug, title, body, target_segment, deep_link, is_active
) VALUES
(
  '94000000-0000-4000-8000-000000000001',
  'daily_horoscope_morning',
  'Bugünün gökyüzü hazır',
  'Burcunun günlük yorumunu ve bugün öne çıkan enerjiyi keşfet.',
  'all',
  '/burclar',
  1
),
(
  '94000000-0000-4000-8000-000000000002',
  'birth_chart_resume',
  'Haritan seni bekliyor',
  'Güneş, Ay ve yükselen üçlünü tamamlayıp kişisel yorumunu al.',
  'users_without_booking',
  '/birth-chart',
  1
),
(
  '94000000-0000-4000-8000-000000000003',
  'first_session_offer',
  'İlk seansına yumuşak bir başlangıç',
  'Uygun danışmanları incele, sana en yakın ruhsal rehberliği seç.',
  'users',
  '/consultants',
  1
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  body = VALUES(body),
  target_segment = VALUES(target_segment),
  deep_link = VALUES(deep_link),
  is_active = VALUES(is_active);

