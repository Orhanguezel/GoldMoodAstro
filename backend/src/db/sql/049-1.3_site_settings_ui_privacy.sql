-- =============================================================
-- 049-1.3_site_settings_ui_kvkk.sql  [FINAL]
-- ui_kvkk (KVKK / Privacy page UI strings) — Energetische Massage
--  - Key: ui_kvkk
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
--  - Upsert: ON DUPLICATE KEY UPDATE
--  - NO ALTER / NO PATCH
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

-- =============================================================
-- ui_kvkk (TR/EN/DE)
-- =============================================================
INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at)
VALUES
(
  UUID(),
  'ui_kvkk',
  'tr',
  CAST(
    JSON_OBJECT(
      -- Banner / Page title
      'ui_kvkk_page_title',        'KVKK / Gizlilik',
      'ui_kvkk_fallback_title',    'KVKK / Gizlilik',

      -- Empty / Error states
      'ui_kvkk_empty',             'Gizlilik içeriği bulunamadı.',
      'ui_kvkk_empty_text',        'Gizlilik ve kişisel verilerin korunmasına ilişkin bilgilendirme yakında burada yayınlanacaktır.',

      -- SEO (pages/kvkk.tsx)
      'ui_kvkk_page_description',
        'Energetische Massage gizlilik bilgilendirmesi: kişisel verilerin işlenmesi, hukuki sebepler, güvenlik önlemleri ve ilgili kişi hakları.',
      'ui_kvkk_meta_title',        'KVKK / Gizlilik | Energetische Massage',
      'ui_kvkk_meta_description',
        'Energetische Massage gizlilik bilgilendirmesi: kişisel verilerin işlenmesi, hukuki sebepler, güvenlik önlemleri ve ilgili kişi hakları.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_kvkk',
  'en',
  CAST(
    JSON_OBJECT(
      -- Banner / Page title
      'ui_kvkk_page_title',        'Privacy Notice',
      'ui_kvkk_fallback_title',    'Privacy Notice',

      -- Empty / Error states
      'ui_kvkk_empty',             'Privacy content not found.',
      'ui_kvkk_empty_text',        'Our privacy information will be published here soon.',

      -- SEO
      'ui_kvkk_page_description',
        'Energetische Massage privacy notice: how we process personal data, legal bases, security measures, and your data subject rights.',
      'ui_kvkk_meta_title',        'Privacy Notice | Energetische Massage',
      'ui_kvkk_meta_description',
        'Energetische Massage privacy notice: how we process personal data, legal bases, security measures, and your data subject rights.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_kvkk',
  'de',
  CAST(
    JSON_OBJECT(
      -- Banner / Page title
      'ui_kvkk_page_title',        'Datenschutzhinweis',
      'ui_kvkk_fallback_title',    'Datenschutzhinweis',

      -- Empty / Error states
      'ui_kvkk_empty',             'Datenschutz-Inhalt nicht gefunden.',
      'ui_kvkk_empty_text',        'Unsere Datenschutzinformationen werden hier in Kürze veröffentlicht.',

      -- SEO
      'ui_kvkk_page_description',
        'Energetische Massage Datenschutzhinweis: Verarbeitung personenbezogener Daten, Rechtsgrundlagen, Sicherheitsmaßnahmen und Ihre Betroffenenrechte (DSGVO).',
      'ui_kvkk_meta_title',        'Datenschutzhinweis | Energetische Massage',
      'ui_kvkk_meta_description',
        'Energetische Massage Datenschutzhinweis: Verarbeitung personenbezogener Daten, Rechtsgrundlagen, Sicherheitsmaßnahmen und Ihre Betroffenenrechte (DSGVO).'
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
