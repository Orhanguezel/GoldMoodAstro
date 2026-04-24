
-- =============================================================
-- FILE: 041_admin_settings.sql (energetische-massage-bonn)
-- Admin Panel UI Configurations (Theme, Layout, Page Meta)
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
-- =============================================================
-- GLOBAL: Admin UI Defaults (Theme/Layout)
-- =============================================================
(
  UUID(),
  'ui_admin_config',
  '*',
  CAST(JSON_OBJECT(
    'default_locale', 'tr',
    'theme', JSON_OBJECT(
      'mode', 'light',
      'preset', 'zinc',
      'font', 'inter'
    ),
    'layout', JSON_OBJECT(
      'sidebar_variant', 'inset',
      'sidebar_collapsible', 'icon',
      'navbar_style', 'sticky',
      'content_layout', 'centered'
    ),
    'branding', JSON_OBJECT(
      'app_name', 'Energetische Massage Panel',
      'app_copyright', 'Energetische Massage',
      'html_lang', 'de',
      'theme_color', '#FDFCFB',
      'favicon_16', '/favicon/favicon-16.svg',
      'favicon_32', '/favicon/favicon-32.svg',
      'apple_touch_icon', '/favicon/apple-touch-icon.svg',
      'meta', JSON_OBJECT(
        'title', 'Energetische Massage - Energetische Massage Bonn | Anastasia König',
        'description', 'Energetische Massage: Ganzheitliche energetische Massage in Bonn. Anastasia König bietet mobile Körperarbeit bei Ihnen zu Hause. Heilende Berührung mit Herz.',
        'og_url', 'https://energetische-massage-bonn.de/',
        'og_title', 'Energetische Massage - Energetische Massage Bonn',
        'og_description', 'Ganzheitliche energetische Massage in Bonn. Heilende Berührung mit Herz. Mobile Körperarbeit von Anastasia König.',
        'og_image', '/logo/koenig-energetik-icon.svg',
        'twitter_card', 'summary_large_image'
      )
    )
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),

-- =============================================================
-- LOCALIZED: Admin Page Meta (TR)
-- =============================================================
(
  UUID(),
  'ui_admin_pages',
  'tr',
  CAST(JSON_OBJECT(
    'dashboard', JSON_OBJECT(
      'title', 'Özet Paneli',
      'description', 'Sistem genel bakış ve metrikler',
      'metrics', JSON_ARRAY('revenue', 'users', 'bookings', 'sessions')
    ),
    'users', JSON_OBJECT(
      'title', 'Kullanıcı Yönetimi',
      'description', 'Sistem kullanıcılarını yönet'
    ),
    'bookings', JSON_OBJECT(
      'title', 'Randevu Takvimi',
      'description', 'Gelen ve onaylanan randevular'
    ),
    'services', JSON_OBJECT(
      'title', 'Hizmetler',
      'description', 'Masaj ve terapi hizmetleri'
    ),
    'reviews', JSON_OBJECT(
      'title', 'Değerlendirmeler',
      'description', 'Müşteri yorumları ve onaylama'
    ),
    'site_settings', JSON_OBJECT(
      'title', 'Site Ayarları',
      'description', 'Genel site konfigürasyonu'
    )
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),

-- =============================================================
-- LOCALIZED: Admin Page Meta (EN)
-- =============================================================
(
  UUID(),
  'ui_admin_pages',
  'en',
  CAST(JSON_OBJECT(
    'dashboard', JSON_OBJECT(
      'title', 'Dashboard Overview',
      'description', 'System overview and metrics',
      'metrics', JSON_ARRAY('revenue', 'users', 'bookings', 'sessions')
    ),
    'users', JSON_OBJECT(
      'title', 'User Management',
      'description', 'Manage system users'
    ),
    'bookings', JSON_OBJECT(
      'title', 'Booking Calendar',
      'description', 'Incoming and confirmed appointments'
    ),
    'services', JSON_OBJECT(
      'title', 'Services',
      'description', 'Massage and therapy services'
    ),
    'reviews', JSON_OBJECT(
      'title', 'Reviews',
      'description', 'Customer reviews and moderation'
    ),
    'site_settings', JSON_OBJECT(
      'title', 'Site Settings',
      'description', 'General site configuration'
    )
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),

-- =============================================================
-- LOCALIZED: Admin Page Meta (DE)
-- =============================================================
(
  UUID(),
  'ui_admin_pages',
  'de',
  CAST(JSON_OBJECT(
    'dashboard', JSON_OBJECT(
      'title', 'Übersicht',
      'description', 'Systemübersicht und Metriken',
      'metrics', JSON_ARRAY('revenue', 'users', 'bookings', 'sessions')
    ),
    'users', JSON_OBJECT(
      'title', 'Benutzerverwaltung',
      'description', 'Systembenutzer verwalten'
    ),
    'bookings', JSON_OBJECT(
      'title', 'Terminkalender',
      'description', 'Eingehende und bestätigte Termine'
    ),
    'services', JSON_OBJECT(
      'title', 'Dienstleistungen',
      'description', 'Massage- und Therapiedienstleistungen'
    ),
    'reviews', JSON_OBJECT(
      'title', 'Bewertungen',
      'description', 'Kundenbewertungen und Moderation'
    ),
    'site_settings', JSON_OBJECT(
      'title', 'Seiteneinstellungen',
      'description', 'Allgemeine Seitenkonfiguration'
    )
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
)

ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
