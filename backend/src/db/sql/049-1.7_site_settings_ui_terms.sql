-- =============================================================
-- 049-1.7_site_settings_ui_terms.sql  [FINAL]
-- ui_terms (Terms / Nutzungsbedingungen page UI strings) — Energetische Massage (DE/EN/TR)
--  - Key: ui_terms
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
--  - Upsert: ON DUPLICATE KEY UPDATE
--  - NO ALTER / NO PATCH
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

-- =============================================================
-- ui_terms (TR/EN/DE)
-- =============================================================
INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at)
VALUES
(
  UUID(),
  'ui_terms',
  'tr',
  CAST(
    JSON_OBJECT(
      -- Banner / Page titles
      'ui_terms_page_title',         'Kullanım Koşulları',
      'ui_terms_fallback_title',     'Kullanım Koşulları',

      -- Empty states
      'ui_terms_empty',              'Kullanım koşulları içeriği bulunamadı.',
      'ui_terms_empty_text',         'Kullanım koşulları içeriği yakında yayınlanacaktır.',

      -- SEO (pages/terms.tsx)
      'ui_terms_page_description',
        'Energetische Massage kullanım koşulları: site kullanımı, içerik hakları, sorumluluk sınırlamaları, dış bağlantılar ve güncellemeler.',
      'ui_terms_meta_title',         'Kullanım Koşulları | Energetische Massage',
      'ui_terms_meta_description',
        'Energetische Massage kullanım koşulları: site kullanımı, içerik hakları, sorumluluk sınırlamaları, dış bağlantılar ve güncellemeler.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_terms',
  'en',
  CAST(
    JSON_OBJECT(
      -- Banner / Page titles
      'ui_terms_page_title',         'Terms of Use',
      'ui_terms_fallback_title',     'Terms of Use',

      -- Empty states
      'ui_terms_empty',              'Terms content not found.',
      'ui_terms_empty_text',         'The terms of use will be published here soon.',

      -- SEO
      'ui_terms_page_description',
        'Energetische Massage terms of use: website usage, content rights, limitation of liability, external links, and updates.',
      'ui_terms_meta_title',         'Terms of Use | Energetische Massage',
      'ui_terms_meta_description',
        'Energetische Massage terms of use: website usage, content rights, limitation of liability, external links, and updates.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_terms',
  'de',
  CAST(
    JSON_OBJECT(
      -- Banner / Page titles
      'ui_terms_page_title',         'Nutzungsbedingungen',
      'ui_terms_fallback_title',     'Nutzungsbedingungen',

      -- Empty states
      'ui_terms_empty',              'Nutzungsbedingungen nicht gefunden.',
      'ui_terms_empty_text',         'Die Nutzungsbedingungen werden hier in Kürze veröffentlicht.',

      -- SEO
      'ui_terms_page_description',
        'Energetische Massage Nutzungsbedingungen: Nutzung der Website, Inhaltsrechte, Haftungsbeschränkung, externe Links und Aktualisierungen.',
      'ui_terms_meta_title',         'Nutzungsbedingungen | Energetische Massage',
      'ui_terms_meta_description',
        'Energetische Massage Nutzungsbedingungen: Nutzung der Website, Inhaltsrechte, Haftungsbeschränkung, externe Links und Aktualisierungen.'
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
