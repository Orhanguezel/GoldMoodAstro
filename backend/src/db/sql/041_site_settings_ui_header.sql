-- =============================================================
-- 041_site_settings_ui_header.sql  (Header UI strings) [FINAL]
--  - Key: ui_header
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
--  - Backward compatible: keeps legacy keys too
--  - Requires UNIQUE KEY (key, locale) on site_settings
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at) VALUES
(
  UUID(),
  'ui_header',
  'tr',
  CAST(JSON_OBJECT(
    -- ✅ NEW KEYS (used by current code)
    'ui_header_language',            'Dil',
    'ui_header_auth',                'Giriş Yap',
    'ui_header_register',            'Kayıt Ol',
    'ui_header_search_placeholder',  'Arama...',
    'ui_header_search',              'Ara',
    'ui_header_contact_info',        'İletişim Bilgileri',
    'ui_header_call',                'Ara',
    'ui_header_email',               'E-posta',
    'ui_header_close',               'Kapat',
    'ui_header_open_menu',           'Menüyü Aç',
    'ui_header_open_sidebar',        'Yan Menüyü Aç',

    'menu_empty',                    '(Menü tanımlı değil)',
    'menu_loading',                  '(Menü yükleniyor...)',

    -- ✅ LEGACY KEYS (keep, so older components won''t break)
    'language_label',                'Dil',
    'login',                         'Giriş Yap',
    'register',                      'Kayıt Ol',
    'search_placeholder',            'Arama...',
    'search_aria',                   'Ara',
    'contact_info_title',            'İletişim Bilgileri',
    'call_aria',                     'Ara',
    'email_aria',                    'E-posta',
    'close_aria',                    'Kapat',
    'open_menu_aria',                'Menüyü Aç',
    'open_sidebar_aria',             'Yan Menüyü Aç'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_header',
  'en',
  CAST(JSON_OBJECT(
    -- ✅ NEW KEYS (used by current code)
    'ui_header_language',            'Language',
    'ui_header_auth',                'Login',
    'ui_header_register',            'Register',
    'ui_header_search_placeholder',  'Search...',
    'ui_header_search',              'Search',
    'ui_header_contact_info',        'Contact Info',
    'ui_header_call',                'Call',
    'ui_header_email',               'Email',
    'ui_header_close',               'Close',
    'ui_header_open_menu',           'Open Menu',
    'ui_header_open_sidebar',        'Open Sidebar',

    'menu_empty',                    '(Menu is not configured)',
    'menu_loading',                  '(Loading menu...)',

    -- ✅ LEGACY KEYS (keep)
    'language_label',                'Language',
    'login',                         'Login',
    'register',                      'Register',
    'search_placeholder',            'Search...',
    'search_aria',                   'Search',
    'contact_info_title',            'Contact Info',
    'call_aria',                     'Call',
    'email_aria',                    'Email',
    'close_aria',                    'Close',
    'open_menu_aria',                'Open Menu',
    'open_sidebar_aria',             'Open Sidebar'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_header',
  'de',
  CAST(JSON_OBJECT(
    -- ✅ NEW KEYS (used by current code)
    'ui_header_language',            'Sprache',
    'ui_header_auth',                'Anmelden',
    'ui_header_register',            'Registrieren',
    'ui_header_search_placeholder',  'Suchen...',
    'ui_header_search',              'Suchen',
    'ui_header_contact_info',        'Kontaktinformationen',
    'ui_header_call',                'Anrufen',
    'ui_header_email',               'E-Mail',
    'ui_header_close',               'Schließen',
    'ui_header_open_menu',           'Menü öffnen',
    'ui_header_open_sidebar',        'Seitenleiste öffnen',

    'menu_empty',                    '(Menü ist nicht konfiguriert)',
    'menu_loading',                  '(Menü wird geladen...)',

    -- ✅ LEGACY KEYS (keep)
    'language_label',                'Sprache',
    'login',                         'Anmelden',
    'register',                      'Registrieren',
    'search_placeholder',            'Suchen...',
    'search_aria',                   'Suchen',
    'contact_info_title',            'Kontaktinformationen',
    'call_aria',                     'Anrufen',
    'email_aria',                    'E-Mail',
    'close_aria',                    'Schließen',
    'open_menu_aria',                'Menü öffnen',
    'open_sidebar_aria',             'Seitenleiste öffnen'
  ) AS CHAR),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
