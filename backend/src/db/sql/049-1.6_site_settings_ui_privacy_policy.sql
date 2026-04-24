-- =============================================================
-- 049-1.6_site_settings_ui_privacy_policy.sql  [FINAL]
-- ui_privacy_policy (Privacy Policy / Gizlilik Politikası page UI strings)
--  - Key: ui_privacy_policy
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
--  - Upsert: ON DUPLICATE KEY UPDATE
--  - NO ALTER / NO PATCH
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

-- =============================================================
-- ui_privacy_policy (TR/EN/DE)
-- =============================================================
INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at)
VALUES
(
  UUID(),
  'ui_privacy_policy',
  'tr',
  CAST(
    JSON_OBJECT(
      -- Banner / Page titles
      'ui_privacy_policy_page_title',        'Gizlilik Politikası',
      'ui_privacy_policy_fallback_title',    'Gizlilik Politikası',

      -- Empty states
      'ui_privacy_policy_empty',             'Gizlilik politikası içeriği bulunamadı.',
      'ui_privacy_policy_empty_text',        'Gizlilik politikası içeriği yakında yayınlanacaktır.',

      -- SEO (pages/privacy-policy.tsx)
      'ui_privacy_policy_page_description',
        'Energetische Massage gizlilik politikası: hangi verileri topluyoruz, hangi amaçlarla işliyoruz, saklama süreleri, güvenlik önlemleri ve haklarınız.',
      'ui_privacy_policy_meta_title',        'Gizlilik Politikası | Energetische Massage',
      'ui_privacy_policy_meta_description',
        'Energetische Massage gizlilik politikası: hangi verileri topluyoruz, hangi amaçlarla işliyoruz, saklama süreleri, güvenlik önlemleri ve haklarınız.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_privacy_policy',
  'en',
  CAST(
    JSON_OBJECT(
      -- Banner / Page titles
      'ui_privacy_policy_page_title',        'Privacy Policy',
      'ui_privacy_policy_fallback_title',    'Privacy Policy',

      -- Empty states
      'ui_privacy_policy_empty',             'Privacy policy content not found.',
      'ui_privacy_policy_empty_text',        'The privacy policy content will be published here soon.',

      -- SEO
      'ui_privacy_policy_page_description',
        'Energetische Massage privacy policy: what data we collect, purposes of processing, retention periods, security measures, and your rights.',
      'ui_privacy_policy_meta_title',        'Privacy Policy | Energetische Massage',
      'ui_privacy_policy_meta_description',
        'Energetische Massage privacy policy: what data we collect, purposes of processing, retention periods, security measures, and your rights.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_privacy_policy',
  'de',
  CAST(
    JSON_OBJECT(
      -- Banner / Page titles
      'ui_privacy_policy_page_title',        'Datenschutzerklärung',
      'ui_privacy_policy_fallback_title',    'Datenschutzerklärung',

      -- Empty states
      'ui_privacy_policy_empty',             'Datenschutzerklärung nicht gefunden.',
      'ui_privacy_policy_empty_text',        'Die Datenschutzerklärung wird hier in Kürze veröffentlicht.',

      -- SEO
      'ui_privacy_policy_page_description',
        'Energetische Massage Datenschutzerklärung: welche Daten wir erheben, Zwecke der Verarbeitung, Speicherdauer, Sicherheitsmaßnahmen und Ihre Rechte.',
      'ui_privacy_policy_meta_title',        'Datenschutzerklärung | Energetische Massage',
      'ui_privacy_policy_meta_description',
        'Energetische Massage Datenschutzerklärung: welche Daten wir erheben, Zwecke der Verarbeitung, Speicherdauer, Sicherheitsmaßnahmen und Ihre Rechte.'
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
