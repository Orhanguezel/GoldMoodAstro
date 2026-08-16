-- =============================================================
-- 196b_footer_stripe_de_legal_links.sql
-- Stripe DE satış kanalı yasal sayfalarının footer "Yasal" bölümüne eklenmesi
-- (Impressum her sayfadan erişilebilir olmalı — §5 TMG).
-- 196 authoritative-reseed'inden SONRA koşar; ON DUPLICATE ile idempotent.
-- Not: /legal/[slug] tek URL ile tüm dillerde çalışır (by-slug çözümü
-- sayfayı bulur, içerik istenen dilde döner) — mevcut konvansiyonla aynı.
-- =============================================================
SET @loc_tr = 'tr', @loc_en = 'en', @loc_de = 'de';

INSERT INTO menu_items (id, location, section_id, type, url, is_active, display_order) VALUES
  ('mi-f-leg-impressum',  'footer', 'fs-legal', 'custom', '/legal/impressum',             1, 90),
  ('mi-f-leg-datenschutz','footer', 'fs-legal', 'custom', '/legal/datenschutzerklaerung', 1, 100),
  ('mi-f-leg-agb',        'footer', 'fs-legal', 'custom', '/legal/agb',                   1, 110),
  ('mi-f-leg-widerruf',   'footer', 'fs-legal', 'custom', '/legal/widerrufsbelehrung',    1, 120)
ON DUPLICATE KEY UPDATE url = VALUES(url), is_active = VALUES(is_active), display_order = VALUES(display_order);

INSERT INTO menu_items_i18n (id, menu_item_id, locale, title) VALUES
  ('mi-fi-limp-tr', 'mi-f-leg-impressum',   @loc_tr, 'Impressum'),
  ('mi-fi-limp-en', 'mi-f-leg-impressum',   @loc_en, 'Imprint'),
  ('mi-fi-limp-de', 'mi-f-leg-impressum',   @loc_de, 'Impressum'),
  ('mi-fi-lds-tr',  'mi-f-leg-datenschutz', @loc_tr, 'Veri Koruma (DSGVO)'),
  ('mi-fi-lds-en',  'mi-f-leg-datenschutz', @loc_en, 'Privacy (GDPR)'),
  ('mi-fi-lds-de',  'mi-f-leg-datenschutz', @loc_de, 'Datenschutzerklärung'),
  ('mi-fi-lagb-tr', 'mi-f-leg-agb',         @loc_tr, 'Genel İşlem Koşulları (AGB)'),
  ('mi-fi-lagb-en', 'mi-f-leg-agb',         @loc_en, 'Terms and Conditions'),
  ('mi-fi-lagb-de', 'mi-f-leg-agb',         @loc_de, 'AGB'),
  ('mi-fi-lwid-tr', 'mi-f-leg-widerruf',    @loc_tr, 'Cayma Hakkı (AB)'),
  ('mi-fi-lwid-en', 'mi-f-leg-widerruf',    @loc_en, 'Withdrawal Notice'),
  ('mi-fi-lwid-de', 'mi-f-leg-widerruf',    @loc_de, 'Widerrufsbelehrung')
ON DUPLICATE KEY UPDATE title = VALUES(title);
