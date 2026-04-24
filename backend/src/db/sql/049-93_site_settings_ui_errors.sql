-- =============================================================
-- 049-93_site_settings_ui_errors.sql (UI Errors)
-- Energetische Massage - UI Errors (site_settings.ui_errors)
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at) VALUES
(
  UUID(),
  'ui_errors',
  'tr',
  CAST(JSON_OBJECT(
    'ui_404_title',         'Sayfa Bulunamadı',
    'ui_404_subtitle',      'Aradığınız sayfa bulunamadı veya taşınmış olabilir.',
    'ui_404_back_home',     'Ana Sayfaya Dön',

    'ui_500_title',         'Bir Hata Oluştu',
    'ui_500_subtitle',      'Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
    'ui_500_try_again',     'Tekrar Dene',

    'ui_generic_error',     'Bir hata oluştu.',
    'ui_loading',           'Yükleniyor...'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_errors',
  'en',
  CAST(JSON_OBJECT(
    'ui_404_title',         'Page Not Found',
    'ui_404_subtitle',      'The page you are looking for may have been moved or does not exist.',
    'ui_404_back_home',     'Back To Home',

    'ui_500_title',         'Something Went Wrong',
    'ui_500_subtitle',      'An unexpected error occurred. Please try again later.',
    'ui_500_try_again',     'Try Again',

    'ui_generic_error',     'An error occurred.',
    'ui_loading',           'Loading...'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_errors',
  'de',
  CAST(JSON_OBJECT(
    'ui_404_title',         'Seite nicht gefunden',
    'ui_404_subtitle',      'Die gesuchte Seite wurde möglicherweise verschoben oder existiert nicht.',
    'ui_404_back_home',     'Zur Startseite',

    'ui_500_title',         'Ein Fehler ist aufgetreten',
    'ui_500_subtitle',      'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
    'ui_500_try_again',     'Erneut versuchen',

    'ui_generic_error',     'Ein Fehler ist aufgetreten.',
    'ui_loading',           'Wird geladen...'
  ) AS CHAR),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
