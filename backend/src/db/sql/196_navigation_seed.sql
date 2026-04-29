-- =============================================================
-- FILE: 196_navigation_seed.sql
-- Default header menu (with dropdowns) + footer sections + footer links
-- 3 locales: tr, en, de
-- =============================================================

SET @loc_tr = 'tr', @loc_en = 'en', @loc_de = 'de';

-- ---- FOOTER SECTIONS ----------------------------------------------------
INSERT INTO footer_sections (id, slug, is_active, display_order) VALUES
  ('fs-astrology', 'astrology', 1, 10),
  ('fs-fal',       'fal',       1, 20),
  ('fs-company',   'company',   1, 30),
  ('fs-legal',     'legal',     1, 40)
ON DUPLICATE KEY UPDATE display_order = VALUES(display_order);

INSERT INTO footer_sections_i18n (id, footer_section_id, locale, title) VALUES
  ('fs-i-astro-tr', 'fs-astrology', @loc_tr, 'Astroloji'),
  ('fs-i-astro-en', 'fs-astrology', @loc_en, 'Astrology'),
  ('fs-i-astro-de', 'fs-astrology', @loc_de, 'Astrologie'),
  ('fs-i-fal-tr',   'fs-fal',       @loc_tr, 'Fal & Tarot'),
  ('fs-i-fal-en',   'fs-fal',       @loc_en, 'Divination'),
  ('fs-i-fal-de',   'fs-fal',       @loc_de, 'Wahrsagung'),
  ('fs-i-comp-tr',  'fs-company',   @loc_tr, 'Şirket'),
  ('fs-i-comp-en',  'fs-company',   @loc_en, 'Company'),
  ('fs-i-comp-de',  'fs-company',   @loc_de, 'Unternehmen'),
  ('fs-i-leg-tr',   'fs-legal',     @loc_tr, 'Yasal'),
  ('fs-i-leg-en',   'fs-legal',     @loc_en, 'Legal'),
  ('fs-i-leg-de',   'fs-legal',     @loc_de, 'Rechtliches')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ---- HEADER MENU --------------------------------------------------------
-- Top-level items
INSERT INTO menu_items (id, location, type, url, is_active, display_order) VALUES
  ('mi-h-home',         'header', 'custom', '/',                          1, 10),
  ('mi-h-burclar',      'header', 'custom', '/burclar',                   1, 20),
  ('mi-h-astrology',    'header', 'custom', NULL,                         1, 30),  -- dropdown parent
  ('mi-h-fal',          'header', 'custom', NULL,                         1, 40),  -- dropdown parent
  ('mi-h-numeroloji',   'header', 'custom', '/numeroloji',                1, 50),
  ('mi-h-consultants',  'header', 'custom', '/consultants',               1, 60),
  ('mi-h-blog',         'header', 'custom', '/blog',                      1, 70),
  ('mi-h-about',        'header', 'custom', '/about',                     1, 80)
ON DUPLICATE KEY UPDATE display_order = VALUES(display_order);

-- Astrology dropdown children
INSERT INTO menu_items (id, location, parent_id, type, url, is_active, display_order) VALUES
  ('mi-h-astro-birth',    'header', 'mi-h-astrology', 'custom', '/birth-chart',                  1, 10),
  ('mi-h-astro-sinastri', 'header', 'mi-h-astrology', 'custom', '/sinastri',                     1, 20),
  ('mi-h-astro-yildiz',   'header', 'mi-h-astrology', 'custom', '/yildizname',                   1, 30),
  ('mi-h-astro-bigthree', 'header', 'mi-h-astrology', 'custom', '/big-three',                    1, 40),
  ('mi-h-astro-yukselen', 'header', 'mi-h-astrology', 'custom', '/yukselen-burc-hesaplayici',    1, 50),
  ('mi-h-astro-daily',    'header', 'mi-h-astrology', 'custom', '/daily',                        1, 60)
ON DUPLICATE KEY UPDATE display_order = VALUES(display_order);

-- Fal & Tarot dropdown children
INSERT INTO menu_items (id, location, parent_id, type, url, is_active, display_order) VALUES
  ('mi-h-fal-tarot',  'header', 'mi-h-fal', 'custom', '/tarot',         1, 10),
  ('mi-h-fal-coffee', 'header', 'mi-h-fal', 'custom', '/kahve-fali',    1, 20),
  ('mi-h-fal-dream',  'header', 'mi-h-fal', 'custom', '/ruya-tabiri',   1, 30)
ON DUPLICATE KEY UPDATE display_order = VALUES(display_order);

-- Header menu i18n
INSERT INTO menu_items_i18n (id, menu_item_id, locale, title) VALUES
  -- Top level
  ('mi-i-home-tr', 'mi-h-home', @loc_tr, 'Ana Sayfa'),
  ('mi-i-home-en', 'mi-h-home', @loc_en, 'Home'),
  ('mi-i-home-de', 'mi-h-home', @loc_de, 'Startseite'),

  ('mi-i-burc-tr', 'mi-h-burclar', @loc_tr, 'Burçlar'),
  ('mi-i-burc-en', 'mi-h-burclar', @loc_en, 'Zodiac'),
  ('mi-i-burc-de', 'mi-h-burclar', @loc_de, 'Sternzeichen'),

  ('mi-i-astro-tr', 'mi-h-astrology', @loc_tr, 'Astroloji'),
  ('mi-i-astro-en', 'mi-h-astrology', @loc_en, 'Astrology'),
  ('mi-i-astro-de', 'mi-h-astrology', @loc_de, 'Astrologie'),

  ('mi-i-fal-tr', 'mi-h-fal', @loc_tr, 'Fal & Tarot'),
  ('mi-i-fal-en', 'mi-h-fal', @loc_en, 'Divination'),
  ('mi-i-fal-de', 'mi-h-fal', @loc_de, 'Wahrsagung'),

  ('mi-i-num-tr', 'mi-h-numeroloji', @loc_tr, 'Numeroloji'),
  ('mi-i-num-en', 'mi-h-numeroloji', @loc_en, 'Numerology'),
  ('mi-i-num-de', 'mi-h-numeroloji', @loc_de, 'Numerologie'),

  ('mi-i-cons-tr', 'mi-h-consultants', @loc_tr, 'Danışmanlar'),
  ('mi-i-cons-en', 'mi-h-consultants', @loc_en, 'Consultants'),
  ('mi-i-cons-de', 'mi-h-consultants', @loc_de, 'Berater'),

  ('mi-i-blog-tr', 'mi-h-blog', @loc_tr, 'Blog'),
  ('mi-i-blog-en', 'mi-h-blog', @loc_en, 'Blog'),
  ('mi-i-blog-de', 'mi-h-blog', @loc_de, 'Blog'),

  ('mi-i-about-tr', 'mi-h-about', @loc_tr, 'Hakkımızda'),
  ('mi-i-about-en', 'mi-h-about', @loc_en, 'About'),
  ('mi-i-about-de', 'mi-h-about', @loc_de, 'Über uns'),

  -- Astrology dropdown
  ('mi-i-birth-tr', 'mi-h-astro-birth', @loc_tr, 'Doğum Haritası'),
  ('mi-i-birth-en', 'mi-h-astro-birth', @loc_en, 'Birth Chart'),
  ('mi-i-birth-de', 'mi-h-astro-birth', @loc_de, 'Geburtshoroskop'),

  ('mi-i-syn-tr', 'mi-h-astro-sinastri', @loc_tr, 'Sinastri'),
  ('mi-i-syn-en', 'mi-h-astro-sinastri', @loc_en, 'Synastry'),
  ('mi-i-syn-de', 'mi-h-astro-sinastri', @loc_de, 'Synastrie'),

  ('mi-i-yld-tr', 'mi-h-astro-yildiz', @loc_tr, 'Yıldızname'),
  ('mi-i-yld-en', 'mi-h-astro-yildiz', @loc_en, 'Yildizname'),
  ('mi-i-yld-de', 'mi-h-astro-yildiz', @loc_de, 'Yildizname'),

  ('mi-i-big-tr', 'mi-h-astro-bigthree', @loc_tr, 'Big Three'),
  ('mi-i-big-en', 'mi-h-astro-bigthree', @loc_en, 'Big Three'),
  ('mi-i-big-de', 'mi-h-astro-bigthree', @loc_de, 'Big Three'),

  ('mi-i-yks-tr', 'mi-h-astro-yukselen', @loc_tr, 'Yükselen Burç'),
  ('mi-i-yks-en', 'mi-h-astro-yukselen', @loc_en, 'Rising Sign'),
  ('mi-i-yks-de', 'mi-h-astro-yukselen', @loc_de, 'Aszendent'),

  ('mi-i-daily-tr', 'mi-h-astro-daily', @loc_tr, 'Günlük Yorum'),
  ('mi-i-daily-en', 'mi-h-astro-daily', @loc_en, 'Daily Reading'),
  ('mi-i-daily-de', 'mi-h-astro-daily', @loc_de, 'Tägliche Deutung'),

  -- Fal dropdown
  ('mi-i-tarot-tr', 'mi-h-fal-tarot', @loc_tr, 'Tarot'),
  ('mi-i-tarot-en', 'mi-h-fal-tarot', @loc_en, 'Tarot'),
  ('mi-i-tarot-de', 'mi-h-fal-tarot', @loc_de, 'Tarot'),

  ('mi-i-coffee-tr', 'mi-h-fal-coffee', @loc_tr, 'Kahve Falı'),
  ('mi-i-coffee-en', 'mi-h-fal-coffee', @loc_en, 'Coffee Reading'),
  ('mi-i-coffee-de', 'mi-h-fal-coffee', @loc_de, 'Kaffeesatzlesen'),

  ('mi-i-dream-tr', 'mi-h-fal-dream', @loc_tr, 'Rüya Tabiri'),
  ('mi-i-dream-en', 'mi-h-fal-dream', @loc_en, 'Dream Interpretation'),
  ('mi-i-dream-de', 'mi-h-fal-dream', @loc_de, 'Traumdeutung')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ---- FOOTER MENU --------------------------------------------------------
-- Astroloji column
INSERT INTO menu_items (id, location, section_id, type, url, is_active, display_order) VALUES
  ('mi-f-astro-birth',    'footer', 'fs-astrology', 'custom', '/birth-chart',  1, 10),
  ('mi-f-astro-sinastri', 'footer', 'fs-astrology', 'custom', '/sinastri',     1, 20),
  ('mi-f-astro-yildiz',   'footer', 'fs-astrology', 'custom', '/yildizname',   1, 30),
  ('mi-f-astro-big',      'footer', 'fs-astrology', 'custom', '/big-three',    1, 40),
  ('mi-f-astro-burclar',  'footer', 'fs-astrology', 'custom', '/burclar',      1, 50)
ON DUPLICATE KEY UPDATE display_order = VALUES(display_order);

-- Fal column
INSERT INTO menu_items (id, location, section_id, type, url, is_active, display_order) VALUES
  ('mi-f-fal-tarot',  'footer', 'fs-fal', 'custom', '/tarot',       1, 10),
  ('mi-f-fal-coffee', 'footer', 'fs-fal', 'custom', '/kahve-fali',  1, 20),
  ('mi-f-fal-dream',  'footer', 'fs-fal', 'custom', '/ruya-tabiri', 1, 30),
  ('mi-f-fal-num',    'footer', 'fs-fal', 'custom', '/numeroloji',  1, 40)
ON DUPLICATE KEY UPDATE display_order = VALUES(display_order);

-- Şirket column
INSERT INTO menu_items (id, location, section_id, type, url, is_active, display_order) VALUES
  ('mi-f-comp-about', 'footer', 'fs-company', 'custom', '/about',       1, 10),
  ('mi-f-comp-cons',  'footer', 'fs-company', 'custom', '/consultants', 1, 20),
  ('mi-f-comp-blog',  'footer', 'fs-company', 'custom', '/blog',        1, 30),
  ('mi-f-comp-cont',  'footer', 'fs-company', 'custom', '/contact',     1, 40)
ON DUPLICATE KEY UPDATE display_order = VALUES(display_order);

-- Yasal column
INSERT INTO menu_items (id, location, section_id, type, url, is_active, display_order) VALUES
  ('mi-f-leg-kvkk',    'footer', 'fs-legal', 'custom', '/kvkk',                1, 10),
  ('mi-f-leg-privacy', 'footer', 'fs-legal', 'custom', '/gizlilik',            1, 20),
  ('mi-f-leg-terms',   'footer', 'fs-legal', 'custom', '/kullanim-sartlari',   1, 30),
  ('mi-f-leg-cookie',  'footer', 'fs-legal', 'custom', '/cerez-politikasi',    1, 40)
ON DUPLICATE KEY UPDATE display_order = VALUES(display_order);

-- Footer menu i18n
INSERT INTO menu_items_i18n (id, menu_item_id, locale, title) VALUES
  -- Astroloji column
  ('mi-fi-fbirth-tr', 'mi-f-astro-birth', @loc_tr, 'Doğum Haritası'),
  ('mi-fi-fbirth-en', 'mi-f-astro-birth', @loc_en, 'Birth Chart'),
  ('mi-fi-fbirth-de', 'mi-f-astro-birth', @loc_de, 'Geburtshoroskop'),
  ('mi-fi-fsyn-tr',   'mi-f-astro-sinastri', @loc_tr, 'Sinastri'),
  ('mi-fi-fsyn-en',   'mi-f-astro-sinastri', @loc_en, 'Synastry'),
  ('mi-fi-fsyn-de',   'mi-f-astro-sinastri', @loc_de, 'Synastrie'),
  ('mi-fi-fyld-tr',   'mi-f-astro-yildiz', @loc_tr, 'Yıldızname'),
  ('mi-fi-fyld-en',   'mi-f-astro-yildiz', @loc_en, 'Yildizname'),
  ('mi-fi-fyld-de',   'mi-f-astro-yildiz', @loc_de, 'Yildizname'),
  ('mi-fi-fbig-tr',   'mi-f-astro-big', @loc_tr, 'Big Three'),
  ('mi-fi-fbig-en',   'mi-f-astro-big', @loc_en, 'Big Three'),
  ('mi-fi-fbig-de',   'mi-f-astro-big', @loc_de, 'Big Three'),
  ('mi-fi-fburc-tr',  'mi-f-astro-burclar', @loc_tr, 'Burçlar'),
  ('mi-fi-fburc-en',  'mi-f-astro-burclar', @loc_en, 'Zodiac Signs'),
  ('mi-fi-fburc-de',  'mi-f-astro-burclar', @loc_de, 'Sternzeichen'),

  -- Fal column
  ('mi-fi-ftarot-tr', 'mi-f-fal-tarot', @loc_tr, 'Tarot'),
  ('mi-fi-ftarot-en', 'mi-f-fal-tarot', @loc_en, 'Tarot'),
  ('mi-fi-ftarot-de', 'mi-f-fal-tarot', @loc_de, 'Tarot'),
  ('mi-fi-fcof-tr',   'mi-f-fal-coffee', @loc_tr, 'Kahve Falı'),
  ('mi-fi-fcof-en',   'mi-f-fal-coffee', @loc_en, 'Coffee Reading'),
  ('mi-fi-fcof-de',   'mi-f-fal-coffee', @loc_de, 'Kaffeesatzlesen'),
  ('mi-fi-fdrm-tr',   'mi-f-fal-dream', @loc_tr, 'Rüya Tabiri'),
  ('mi-fi-fdrm-en',   'mi-f-fal-dream', @loc_en, 'Dream Interpretation'),
  ('mi-fi-fdrm-de',   'mi-f-fal-dream', @loc_de, 'Traumdeutung'),
  ('mi-fi-fnum-tr',   'mi-f-fal-num', @loc_tr, 'Numeroloji'),
  ('mi-fi-fnum-en',   'mi-f-fal-num', @loc_en, 'Numerology'),
  ('mi-fi-fnum-de',   'mi-f-fal-num', @loc_de, 'Numerologie'),

  -- Şirket column
  ('mi-fi-cabt-tr',  'mi-f-comp-about', @loc_tr, 'Hakkımızda'),
  ('mi-fi-cabt-en',  'mi-f-comp-about', @loc_en, 'About'),
  ('mi-fi-cabt-de',  'mi-f-comp-about', @loc_de, 'Über uns'),
  ('mi-fi-ccons-tr', 'mi-f-comp-cons',  @loc_tr, 'Danışmanlar'),
  ('mi-fi-ccons-en', 'mi-f-comp-cons',  @loc_en, 'Consultants'),
  ('mi-fi-ccons-de', 'mi-f-comp-cons',  @loc_de, 'Berater'),
  ('mi-fi-cblog-tr', 'mi-f-comp-blog',  @loc_tr, 'Blog'),
  ('mi-fi-cblog-en', 'mi-f-comp-blog',  @loc_en, 'Blog'),
  ('mi-fi-cblog-de', 'mi-f-comp-blog',  @loc_de, 'Blog'),
  ('mi-fi-ccnt-tr',  'mi-f-comp-cont',  @loc_tr, 'İletişim'),
  ('mi-fi-ccnt-en',  'mi-f-comp-cont',  @loc_en, 'Contact'),
  ('mi-fi-ccnt-de',  'mi-f-comp-cont',  @loc_de, 'Kontakt'),

  -- Yasal column
  ('mi-fi-lkvkk-tr', 'mi-f-leg-kvkk',   @loc_tr, 'KVKK'),
  ('mi-fi-lkvkk-en', 'mi-f-leg-kvkk',   @loc_en, 'GDPR'),
  ('mi-fi-lkvkk-de', 'mi-f-leg-kvkk',   @loc_de, 'DSGVO'),
  ('mi-fi-lpriv-tr', 'mi-f-leg-privacy', @loc_tr, 'Gizlilik Politikası'),
  ('mi-fi-lpriv-en', 'mi-f-leg-privacy', @loc_en, 'Privacy Policy'),
  ('mi-fi-lpriv-de', 'mi-f-leg-privacy', @loc_de, 'Datenschutz'),
  ('mi-fi-ltrm-tr',  'mi-f-leg-terms',  @loc_tr, 'Kullanım Şartları'),
  ('mi-fi-ltrm-en',  'mi-f-leg-terms',  @loc_en, 'Terms of Use'),
  ('mi-fi-ltrm-de',  'mi-f-leg-terms',  @loc_de, 'Nutzungsbedingungen'),
  ('mi-fi-lcok-tr',  'mi-f-leg-cookie', @loc_tr, 'Çerez Politikası'),
  ('mi-fi-lcok-en',  'mi-f-leg-cookie', @loc_en, 'Cookie Policy'),
  ('mi-fi-lcok-de',  'mi-f-leg-cookie', @loc_de, 'Cookie-Richtlinie')
ON DUPLICATE KEY UPDATE title = VALUES(title);
