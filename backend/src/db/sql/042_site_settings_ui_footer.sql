-- =============================================================
-- 042_site_settings_ui_footer.sql  (Footer UI strings)
--  - Key: ui_footer
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
--  - Extendable: new locales can be cloned from tr as bootstrap
--  - FIX: collation-safe comparisons (ER_CANT_AGGREGATE_2COLLATIONS)
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- -------------------------------------------------------------
-- SEED: ui_footer (TR / EN / DE)
-- -------------------------------------------------------------
INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at) VALUES
(
  UUID(),
  'ui_footer',
  'tr',
  CAST(JSON_OBJECT(
    'company_title',        'Şirket',
    'services',             'Hizmetlerimiz',
    'explore',              'Keşfet',
    'contact',              'İletişim',

    'phone_aria',           'Telefon ile ara',
    'email_aria',           'E-posta gönder',

    'menu_loading',         'Bağlantılar yükleniyor...',
    'menu_empty',           'Bağlantı tanımlı değil',

    'copyright_prefix',     '',
    'copyright_suffix',     'Tüm hakları saklıdır.'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_footer',
  'en',
  CAST(JSON_OBJECT(
    'company_title',        'Company',
    'services',             'Services',
    'explore',              'Explore',
    'contact',              'Contact',

    'phone_aria',           'Call by phone',
    'email_aria',           'Send email',

    'menu_loading',         'Loading links...',
    'menu_empty',           'No links defined',

    'copyright_prefix',     '',
    'copyright_suffix',     'All rights reserved.'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_footer',
  'de',
  CAST(JSON_OBJECT(
    'company_title',        'Unternehmen',
    'services',             'Leistungen',
    'explore',              'Entdecken',
    'contact',              'Kontakt',

    'phone_aria',           'Telefonisch anrufen',
    'email_aria',           'E-Mail senden',

    'menu_loading',         'Links werden geladen...',
    'menu_empty',           'Keine Links definiert',

    'copyright_prefix',     '',
    'copyright_suffix',     'Alle Rechte vorbehalten.'
  ) AS CHAR),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);