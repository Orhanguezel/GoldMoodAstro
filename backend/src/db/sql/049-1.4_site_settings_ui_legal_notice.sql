-- =============================================================
-- 049-1.4_site_settings_ui_legal_notice.sql  [FINAL]
-- ui_legal_notice (Legal Notice page UI strings)
--  - Key: ui_legal_notice
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
--  - Upsert: ON DUPLICATE KEY UPDATE
--  - NO ALTER / NO PATCH
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

-- =============================================================
-- ui_legal_notice (TR/EN/DE)
-- =============================================================
INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at)
VALUES
(
  UUID(),
  'ui_legal_notice',
  'tr',
  CAST(
    JSON_OBJECT(
      -- Banner / Page titles
      'ui_legal_notice_page_title',        'Yasal Bilgilendirme',
      'ui_legal_notice_fallback_title',    'Yasal Bilgilendirme',

      -- Empty states
      'ui_legal_notice_empty',             'Yasal bilgilendirme içeriği bulunamadı.',
      'ui_legal_notice_empty_text',        'Yasal bilgilendirme içeriği yakında yayınlanacaktır.',

      -- SEO (pages/legal-notice.tsx)
      'ui_legal_notice_page_description',
        'Energetische Massage yasal bilgilendirme metni: sorumluluk reddi, harici bağlantılar, fikri mülkiyet ve sorumluluk sınırları.',
      'ui_legal_notice_meta_title',        'Yasal Bilgilendirme | Energetische Massage',
      'ui_legal_notice_meta_description',
        'Energetische Massage yasal bilgilendirme metni: sorumluluk reddi, harici bağlantılar, fikri mülkiyet ve sorumluluk sınırları.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_legal_notice',
  'en',
  CAST(
    JSON_OBJECT(
      -- Banner / Page titles
      'ui_legal_notice_page_title',        'Legal Notice',
      'ui_legal_notice_fallback_title',    'Legal Notice',

      -- Empty states
      'ui_legal_notice_empty',             'Legal notice content not found.',
      'ui_legal_notice_empty_text',        'The legal notice content will be published here soon.',

      -- SEO
      'ui_legal_notice_page_description',
        'Energetische Massage legal notice: disclaimers, external links, intellectual property, and limitation of liability.',
      'ui_legal_notice_meta_title',        'Legal Notice | Energetische Massage',
      'ui_legal_notice_meta_description',
        'Energetische Massage legal notice: disclaimers, external links, intellectual property, and limitation of liability.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_legal_notice',
  'de',
  CAST(
    JSON_OBJECT(
      -- Banner / Page titles
      'ui_legal_notice_page_title',        'Impressum & Rechtliches',
      'ui_legal_notice_fallback_title',    'Impressum & Rechtliches',

      -- Empty states
      'ui_legal_notice_empty',             'Rechtlicher Hinweis nicht gefunden.',
      'ui_legal_notice_empty_text',        'Der rechtliche Hinweis wird hier in Kürze veröffentlicht.',

      -- SEO
      'ui_legal_notice_page_description',
        'Energetische Massage rechtlicher Hinweis: Haftungsausschluss, externe Links, geistiges Eigentum und Haftungsbeschränkung.',
      'ui_legal_notice_meta_title',        'Impressum & Rechtliches | Energetische Massage',
      'ui_legal_notice_meta_description',
        'Energetische Massage rechtlicher Hinweis: Haftungsausschluss, externe Links, geistiges Eigentum und Haftungsbeschränkung.'
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
