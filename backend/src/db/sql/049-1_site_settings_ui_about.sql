-- =============================================================
-- FILE: 049-1_site_settings_ui_about.sql (Energetische Massage - About UI) [FINAL / CLEAN]
-- site_settings.key = 'ui_about'
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
--  - Upsert: ON DUPLICATE KEY UPDATE (assumes UNIQUE(key, locale))
--  - NO arrays, NO what/why/goal, NO bullets
--  - Matches keys used by:
--    - src/pages/about.tsx
--    - src/components/containers/about/AboutSection.tsx
--    - src/components/containers/about/AboutPageContent.tsx
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

START TRANSACTION;

INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at)
VALUES

-- =============================================================
-- TR (Hakkımda)
-- =============================================================
(
  UUID(),
  'ui_about',
  'tr',
  CAST(
    JSON_OBJECT(
      -- Banner / Header
      'ui_about_page_title',        'Hakkımda',
      'ui_about_subprefix',         'Energetische Massage',
      'ui_about_sublabel',          'Hakkımda',
      'ui_about_page_lead',
        'Bonn''da enerjetik masaj: bilinçli dokunuş, net sınırlar ve sakin bir atmosferde kişiye özel seanslar.',

      -- SEO (pages/about.tsx)
      'ui_about_meta_title',        'Hakkımda | Energetische Massage',
      'ui_about_meta_description',
        'Anastasia König ve Energetische Massage: Bonn''da enerjetik masaj seansları. Achtsam dokunuş, net sınırlar ve derin gevşemeye alan.',
      'ui_about_page_description',
        'Energetische Massage hakkında: yaklaşım, güvenli alan ve Bonn''da enerjetik masaj seansları.',
      'ui_about_og_image',          '',

      -- AboutSection CTA
      'ui_about_view_all',          'Tümünü Gör',
      'ui_about_read_more',         'Devamı',

      -- About page content states (AboutPageContent.tsx + AboutSection.tsx)
      'ui_about_fallback_title',    'Energetische Massage',
      'ui_about_empty',             'Hakkımda içeriği bulunamadı.',
      'ui_about_error',             'İçerik yüklenemedi.',
      'ui_about_empty_text',
        'Hakkımda içeriği yakında burada yayınlanacaktır.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),

-- =============================================================
-- EN (About)
-- =============================================================
(
  UUID(),
  'ui_about',
  'en',
  CAST(
    JSON_OBJECT(
      -- Banner / Header
      'ui_about_page_title',        'About',
      'ui_about_subprefix',         'Energetische Massage',
      'ui_about_sublabel',          'About',
      'ui_about_page_lead',
        'Energetic massage sessions in Bonn with mindful touch, clear boundaries, and a calm atmosphere.',

      -- SEO
      'ui_about_meta_title',        'About | Energetische Massage',
      'ui_about_meta_description',
        'About Anastasia König and Energetische Massage: energetic massage sessions in Bonn, mindful touch, clear boundaries, and deep relaxation.',
      'ui_about_page_description',
        'About Energetische Massage: approach, safe space, and energetic massage sessions in Bonn.',
      'ui_about_og_image',          '',

      -- AboutSection CTA
      'ui_about_view_all',          'View all',
      'ui_about_read_more',         'Read more',

      -- Content states
      'ui_about_fallback_title',    'Energetische Massage',
      'ui_about_empty',             'About content not found.',
      'ui_about_error',             'Failed to load content.',
      'ui_about_empty_text',
        'About content will be published here soon.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),

-- =============================================================
-- DE (Über mich)
-- =============================================================
(
  UUID(),
  'ui_about',
  'de',
  CAST(
    JSON_OBJECT(
      -- Banner / Header
      'ui_about_page_title',        'Über mich',
      'ui_about_subprefix',         'Energetische Massage',
      'ui_about_sublabel',          'Über mich',
      'ui_about_page_lead',
        'Energetische Massage in Bonn - achtsame Berührung, klare Grenzen und ruhige Atmosphäre.',

      -- SEO
      'ui_about_meta_title',        'Über mich | Energetische Massage',
      'ui_about_meta_description',
        'Über Anastasia König und Energetische Massage: energetische Massage in Bonn, achtsam, klar abgegrenzt und individuell.',
      'ui_about_page_description',
        'Über Energetische Massage: Ansatz, geschützter Rahmen und energetische Massage-Sitzungen in Bonn.',
      'ui_about_og_image',          '',

      -- AboutSection CTA
      'ui_about_view_all',          'Alle anzeigen',
      'ui_about_read_more',         'Mehr lesen',

      -- Content states
      'ui_about_fallback_title',    'Energetische Massage',
      'ui_about_empty',             'Über-mich-Inhalt nicht gefunden.',
      'ui_about_error',             'Inhalt konnte nicht geladen werden.',
      'ui_about_empty_text',
        'Der Über-mich-Inhalt wird bald hier veröffentlicht.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
)

ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = CURRENT_TIMESTAMP(3);

COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
