-- =============================================================
-- 049-1.5_site_settings_ui_privacy_notice.sql  [FINAL]
-- ui_privacy_notice (Privacy Notice page UI strings)
--  - Key: ui_privacy_notice
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
--  - Upsert: ON DUPLICATE KEY UPDATE
--  - NO ALTER / NO PATCH
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

-- =============================================================
-- ui_privacy_notice (TR/EN/DE)
-- =============================================================
INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at)
VALUES
(
  UUID(),
  'ui_privacy_notice',
  'tr',
  CAST(
    JSON_OBJECT(
      'ui_privacy_notice_page_title',        'Gizlilik Bildirimi',
      'ui_privacy_notice_fallback_title',    'Gizlilik Bildirimi',
      'ui_privacy_notice_empty',             'Gizlilik bildirimi içeriği bulunamadı.',
      'ui_privacy_notice_empty_text',        'Gizlilik bildirimi içeriği yakında yayınlanacaktır.',
      'ui_privacy_notice_page_description',
        'Energetische Massage gizlilik bildirimi: kişisel verilerin işlenmesi, amaçlar, saklama süreleri, güvenlik önlemleri ve haklarınız.',
      'ui_privacy_notice_meta_title',        'Gizlilik Bildirimi | Energetische Massage',
      'ui_privacy_notice_meta_description',
        'Energetische Massage gizlilik bildirimi: kişisel verilerin işlenmesi, amaçlar, saklama süreleri, güvenlik önlemleri ve haklarınız.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_privacy_notice',
  'en',
  CAST(
    JSON_OBJECT(
      'ui_privacy_notice_page_title',        'Privacy Notice',
      'ui_privacy_notice_fallback_title',    'Privacy Notice',
      'ui_privacy_notice_empty',             'Privacy notice content not found.',
      'ui_privacy_notice_empty_text',        'The privacy notice content will be published here soon.',
      'ui_privacy_notice_page_description',
        'Energetische Massage privacy notice: how we process personal data, purposes, retention periods, security measures, and your rights.',
      'ui_privacy_notice_meta_title',        'Privacy Notice | Energetische Massage',
      'ui_privacy_notice_meta_description',
        'Energetische Massage privacy notice: how we process personal data, purposes, retention periods, security measures, and your rights.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_privacy_notice',
  'de',
  CAST(
    JSON_OBJECT(
      'ui_privacy_notice_page_title',        'Datenschutzhinweis',
      'ui_privacy_notice_fallback_title',    'Datenschutzhinweis',
      'ui_privacy_notice_empty',             'Datenschutzhinweis nicht gefunden.',
      'ui_privacy_notice_empty_text',        'Der Datenschutzhinweis wird hier in Kürze veröffentlicht.',
      'ui_privacy_notice_page_description',
        'Energetische Massage Datenschutzhinweis: Verarbeitung personenbezogener Daten, Zwecke, Speicherdauer, Sicherheitsmaßnahmen und Ihre Rechte.',
      'ui_privacy_notice_meta_title',        'Datenschutzhinweis | Energetische Massage',
      'ui_privacy_notice_meta_description',
        'Energetische Massage Datenschutzhinweis: Verarbeitung personenbezogener Daten, Zwecke, Speicherdauer, Sicherheitsmaßnahmen und Ihre Rechte.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

COMMIT;
