-- =============================================================
-- 049-1.8_site_settings_ui_cookie.sql
-- Energetische Massage - UI Cookie + Cookie Policy (site_settings)
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
--  - Re-runnable: ON DUPLICATE KEY UPDATE (requires UNIQUE(key, locale))
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

-- =============================================================
-- ui_cookie (Banner + Modal)
-- Keys used by:
-- - CookieConsentBanner.tsx:
--   cc_banner_title, cc_banner_desc, cc_banner_link_policy,
--   cc_banner_btn_settings, cc_banner_btn_reject, cc_banner_btn_accept,
--   cc_banner_aria_close
-- - CookieSettingsModal.tsx:
--   cc_title, cc_description,
--   cc_label_necessary, cc_desc_necessary,
--   cc_label_analytics, cc_desc_analytics,
--   cc_btn_save, cc_btn_cancel,
--   cc_aria_close
-- =============================================================

INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at) VALUES
(
  UUID(),
  'ui_cookie',
  'tr',
  CAST(JSON_OBJECT(
    -- Banner
    'cc_banner_title',          'Çerez Tercihleri',
    'cc_banner_desc',           'Sitemizin doğru şekilde çalışmasını sağlamak ve isteğe bağlı analiz yapmak için çerezler kullanıyoruz. Tercihlerinizi yönetebilirsiniz.',
    'cc_banner_link_policy',    'Çerez Politikası',
    'cc_banner_btn_settings',   'Çerez Ayarları',
    'cc_banner_btn_reject',     'Tümünü Reddet',
    'cc_banner_btn_accept',     'Tümünü Kabul Et',
    'cc_banner_aria_close',     'Kapat',

    -- Modal
    'cc_title',                 'Çerez Ayarları',
    'cc_description',           'Hangi çerez kategorilerine izin verdiğinizi seçebilirsiniz. Gerekli çerezler her zaman açıktır.',
    'cc_label_necessary',       'Gerekli',
    'cc_desc_necessary',        'Sitenin temel işlevleri (oturum, güvenlik, dil tercihi gibi) için zorunludur.',
    'cc_label_analytics',       'Analitik',
    'cc_desc_analytics',        'Site trafiğini ve performansı anlamamıza yardımcı olur (ör. sayfa görüntüleme).',
    'cc_btn_cancel',            'Vazgeç',
    'cc_btn_save',              'Kaydet',
    'cc_aria_close',            'Kapat'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_cookie',
  'en',
  CAST(JSON_OBJECT(
    -- Banner
    'cc_banner_title',          'Cookie Preferences',
    'cc_banner_desc',           'We use cookies to ensure the site works properly and to optionally analyze traffic. You can manage your preferences.',
    'cc_banner_link_policy',    'Cookie Policy',
    'cc_banner_btn_settings',   'Cookie Settings',
    'cc_banner_btn_reject',     'Reject All',
    'cc_banner_btn_accept',     'Accept All',
    'cc_banner_aria_close',     'Close',

    -- Modal
    'cc_title',                 'Cookie Settings',
    'cc_description',           'You can choose which cookie categories you allow. Necessary cookies are always enabled.',
    'cc_label_necessary',       'Necessary',
    'cc_desc_necessary',        'Required for core functions (session, security, language preference, etc.).',
    'cc_label_analytics',       'Analytics',
    'cc_desc_analytics',        'Helps us understand traffic and performance (e.g., page views).',
    'cc_btn_cancel',            'Cancel',
    'cc_btn_save',              'Save',
    'cc_aria_close',            'Close'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_cookie',
  'de',
  CAST(JSON_OBJECT(
    -- Banner
    'cc_banner_title',          'Cookie-Einstellungen',
    'cc_banner_desc',           'Wir verwenden Cookies, um die Website korrekt zu betreiben und optional den Traffic zu analysieren. Sie können Ihre Einstellungen verwalten.',
    'cc_banner_link_policy',    'Cookie-Richtlinie',
    'cc_banner_btn_settings',   'Cookie-Einstellungen',
    'cc_banner_btn_reject',     'Alle ablehnen',
    'cc_banner_btn_accept',     'Alle akzeptieren',
    'cc_banner_aria_close',     'Schließen',

    -- Modal
    'cc_title',                 'Cookie-Einstellungen',
    'cc_description',           'Wählen Sie aus, welche Cookie-Kategorien Sie zulassen. Notwendige Cookies sind immer aktiv.',
    'cc_label_necessary',       'Notwendig',
    'cc_desc_necessary',        'Erforderlich für Kernfunktionen (Sitzung, Sicherheit, Spracheinstellungen usw.).',
    'cc_label_analytics',       'Analyse',
    'cc_desc_analytics',        'Hilft uns, Traffic und Performance zu verstehen (z. B. Seitenaufrufe).',
    'cc_btn_cancel',            'Abbrechen',
    'cc_btn_save',              'Speichern',
    'cc_aria_close',            'Schließen'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- ui_cookie_policy (Cookie Policy Page)
-- Keys used by:
-- - src/pages/cookie-policy.tsx (Head + Banner):
--   ui_cookie_policy_page_title
--   ui_cookie_policy_meta_title
--   ui_cookie_policy_meta_description
--   ui_cookie_policy_page_description (optional fallback)
-- - CookiePolicyPageContent.tsx:
--   ui_cookie_policy_fallback_title
--   ui_cookie_policy_empty
--   ui_cookie_policy_empty_text
-- =============================================================

INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at) VALUES
(
  UUID(),
  'ui_cookie_policy',
  'tr',
  CAST(JSON_OBJECT(
    'ui_cookie_policy_page_title',        'Çerez Politikası',
    'ui_cookie_policy_meta_title',        'Çerez Politikası | Energetische Massage',
    'ui_cookie_policy_meta_description',  'Energetische Massage çerez politikası: çerez kategorileri, amaçları ve tercih yönetimi.',
    'ui_cookie_policy_page_description',  'Çerez kullanımımız ve tercihlerinizi nasıl yönetebileceğiniz hakkında bilgi edinin.',

    'ui_cookie_policy_fallback_title',    'Çerez Politikası',
    'ui_cookie_policy_empty',             'Çerez politikası içeriği bulunamadı.',
    'ui_cookie_policy_empty_text',        'Çerez politikası içeriği yakında yayınlanacaktır.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_cookie_policy',
  'en',
  CAST(JSON_OBJECT(
    'ui_cookie_policy_page_title',        'Cookie Policy',
    'ui_cookie_policy_meta_title',        'Cookie Policy | Energetische Massage',
    'ui_cookie_policy_meta_description',  'Energetische Massage cookie policy: cookie categories, purposes, and preference management.',
    'ui_cookie_policy_page_description',  'Learn how we use cookies and how you can manage your preferences.',

    'ui_cookie_policy_fallback_title',    'Cookie Policy',
    'ui_cookie_policy_empty',             'Cookie policy content not found.',
    'ui_cookie_policy_empty_text',        'Cookie policy content will be published soon.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_cookie_policy',
  'de',
  CAST(JSON_OBJECT(
    'ui_cookie_policy_page_title',        'Cookie-Richtlinie',
    'ui_cookie_policy_meta_title',        'Cookie-Richtlinie | Energetische Massage',
    'ui_cookie_policy_meta_description',  'Energetische Massage Cookie-Richtlinie: Kategorien, Zwecke und Verwaltung Ihrer Einstellungen.',
    'ui_cookie_policy_page_description',  'Erfahren Sie, wie wir Cookies verwenden und wie Sie Ihre Einstellungen verwalten können.',

    'ui_cookie_policy_fallback_title',    'Cookie-Richtlinie',
    'ui_cookie_policy_empty',             'Cookie-Richtlinie-Inhalt nicht gefunden.',
    'ui_cookie_policy_empty_text',        'Der Inhalt der Cookie-Richtlinie wird bald veröffentlicht.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

COMMIT;
