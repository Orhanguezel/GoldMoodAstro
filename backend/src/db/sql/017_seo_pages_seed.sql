-- =============================================================
-- 017_seo_pages_seed.sql
-- Sayfa-bazlı SEO ayarları kataloğu (FULL — 2026-04-28 genişletildi).
--
-- Tek bir site_settings satırı (`seo_pages`, locale='tr'/'en'/'de') altında
-- tüm sayfalar için { title, description, og_image, no_index } alanları tutulur.
--
-- Admin panel "SEO Ayarları" sekmesinden her sayfa için inline düzenlenir.
-- Frontend `generateMetadata()` ile bu key'i okuyup uygular
-- (`fetchSeoPageObject(locale, pageKey)` + `mergeSeoPageIntoSeo()`).
--
-- ─── Sayfa key kataloğu ────────────────────────────────────────────────────
-- TEMEL: home, birth-chart, consultants, consultant-detail, pricing, daily,
--        blog, blog-post, about, contact, faqs
-- BURÇLAR: burclar, burclar-sign, burclar-bugun, burclar-haftalik,
--          burclar-aylik, burclar-ask, burclar-kariyer, burclar-saglik,
--          burclar-uyumlulik, burclar-pair-uyumu, burclar-transit
-- DOĞUM HARİTASI: yukselen-burc-hesaplayici, big-three
-- HİBRİT FEATURE'LAR: yildizname, yildizname-result, tarot, tarot-reading,
--                    kahve-fali, kahve-fali-result, ruya-tabiri, ruya-tabiri-result,
--                    sinastri, sinastri-result
-- =============================================================

-- TR ──────────────────────────────────────────────────────────────────────
INSERT INTO site_settings (id, `key`, locale, value) VALUES
('01000000-0000-4000-8000-000000000040', 'seo_pages', 'tr', '{
  "home":                       { "title": "", "description": "", "og_image": "", "no_index": false },
  "birth-chart":                { "title": "", "description": "", "og_image": "", "no_index": false },
  "consultants":                { "title": "", "description": "", "og_image": "", "no_index": false },
  "consultant-detail":          { "title": "", "description": "", "og_image": "", "no_index": false },
  "pricing":                    { "title": "", "description": "", "og_image": "", "no_index": false },
  "daily":                      { "title": "", "description": "", "og_image": "", "no_index": false },
  "blog":                       { "title": "", "description": "", "og_image": "", "no_index": false },
  "blog-post":                  { "title": "", "description": "", "og_image": "", "no_index": false },
  "about":                      { "title": "", "description": "", "og_image": "", "no_index": false },
  "contact":                    { "title": "", "description": "", "og_image": "", "no_index": false },
  "faqs":                       { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar":                    { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-sign":               { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-bugun":              { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-haftalik":           { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-aylik":              { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-ask":                { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-kariyer":            { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-saglik":             { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-uyumlulik":          { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-pair-uyumu":         { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-transit":            { "title": "", "description": "", "og_image": "", "no_index": false },
  "yukselen-burc-hesaplayici":  { "title": "", "description": "", "og_image": "", "no_index": false },
  "big-three":                  { "title": "", "description": "", "og_image": "", "no_index": false },
  "yildizname":                 { "title": "", "description": "", "og_image": "", "no_index": false },
  "yildizname-result":          { "title": "", "description": "", "og_image": "", "no_index": false },
  "tarot":                      { "title": "", "description": "", "og_image": "", "no_index": false },
  "tarot-reading":              { "title": "", "description": "", "og_image": "", "no_index": false },
  "kahve-fali":                 { "title": "", "description": "", "og_image": "", "no_index": false },
  "kahve-fali-result":          { "title": "", "description": "", "og_image": "", "no_index": false },
  "ruya-tabiri":                { "title": "", "description": "", "og_image": "", "no_index": false },
  "ruya-tabiri-result":         { "title": "", "description": "", "og_image": "", "no_index": false },
  "sinastri":                   { "title": "", "description": "", "og_image": "", "no_index": false },
  "sinastri-result":            { "title": "", "description": "", "og_image": "", "no_index": false }
}'),
-- EN ──────────────────────────────────────────────────────────────────────
('01000000-0000-4000-8000-000000000041', 'seo_pages', 'en', '{
  "home":                       { "title": "", "description": "", "og_image": "", "no_index": false },
  "birth-chart":                { "title": "", "description": "", "og_image": "", "no_index": false },
  "consultants":                { "title": "", "description": "", "og_image": "", "no_index": false },
  "consultant-detail":          { "title": "", "description": "", "og_image": "", "no_index": false },
  "pricing":                    { "title": "", "description": "", "og_image": "", "no_index": false },
  "daily":                      { "title": "", "description": "", "og_image": "", "no_index": false },
  "blog":                       { "title": "", "description": "", "og_image": "", "no_index": false },
  "blog-post":                  { "title": "", "description": "", "og_image": "", "no_index": false },
  "about":                      { "title": "", "description": "", "og_image": "", "no_index": false },
  "contact":                    { "title": "", "description": "", "og_image": "", "no_index": false },
  "faqs":                       { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar":                    { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-sign":               { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-bugun":              { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-haftalik":           { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-aylik":              { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-ask":                { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-kariyer":            { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-saglik":             { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-uyumlulik":          { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-pair-uyumu":         { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-transit":            { "title": "", "description": "", "og_image": "", "no_index": false },
  "yukselen-burc-hesaplayici":  { "title": "", "description": "", "og_image": "", "no_index": false },
  "big-three":                  { "title": "", "description": "", "og_image": "", "no_index": false },
  "yildizname":                 { "title": "", "description": "", "og_image": "", "no_index": false },
  "yildizname-result":          { "title": "", "description": "", "og_image": "", "no_index": false },
  "tarot":                      { "title": "", "description": "", "og_image": "", "no_index": false },
  "tarot-reading":              { "title": "", "description": "", "og_image": "", "no_index": false },
  "kahve-fali":                 { "title": "", "description": "", "og_image": "", "no_index": false },
  "kahve-fali-result":          { "title": "", "description": "", "og_image": "", "no_index": false },
  "ruya-tabiri":                { "title": "", "description": "", "og_image": "", "no_index": false },
  "ruya-tabiri-result":         { "title": "", "description": "", "og_image": "", "no_index": false },
  "sinastri":                   { "title": "", "description": "", "og_image": "", "no_index": false },
  "sinastri-result":            { "title": "", "description": "", "og_image": "", "no_index": false }
}'),
-- DE ──────────────────────────────────────────────────────────────────────
('01000000-0000-4000-8000-000000000042', 'seo_pages', 'de', '{
  "home":                       { "title": "", "description": "", "og_image": "", "no_index": false },
  "birth-chart":                { "title": "", "description": "", "og_image": "", "no_index": false },
  "consultants":                { "title": "", "description": "", "og_image": "", "no_index": false },
  "consultant-detail":          { "title": "", "description": "", "og_image": "", "no_index": false },
  "pricing":                    { "title": "", "description": "", "og_image": "", "no_index": false },
  "daily":                      { "title": "", "description": "", "og_image": "", "no_index": false },
  "blog":                       { "title": "", "description": "", "og_image": "", "no_index": false },
  "blog-post":                  { "title": "", "description": "", "og_image": "", "no_index": false },
  "about":                      { "title": "", "description": "", "og_image": "", "no_index": false },
  "contact":                    { "title": "", "description": "", "og_image": "", "no_index": false },
  "faqs":                       { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar":                    { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-sign":               { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-bugun":              { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-haftalik":           { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-aylik":              { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-ask":                { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-kariyer":            { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-saglik":             { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-uyumlulik":          { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-pair-uyumu":         { "title": "", "description": "", "og_image": "", "no_index": false },
  "burclar-transit":            { "title": "", "description": "", "og_image": "", "no_index": false },
  "yukselen-burc-hesaplayici":  { "title": "", "description": "", "og_image": "", "no_index": false },
  "big-three":                  { "title": "", "description": "", "og_image": "", "no_index": false },
  "yildizname":                 { "title": "", "description": "", "og_image": "", "no_index": false },
  "yildizname-result":          { "title": "", "description": "", "og_image": "", "no_index": false },
  "tarot":                      { "title": "", "description": "", "og_image": "", "no_index": false },
  "tarot-reading":              { "title": "", "description": "", "og_image": "", "no_index": false },
  "kahve-fali":                 { "title": "", "description": "", "og_image": "", "no_index": false },
  "kahve-fali-result":          { "title": "", "description": "", "og_image": "", "no_index": false },
  "ruya-tabiri":                { "title": "", "description": "", "og_image": "", "no_index": false },
  "ruya-tabiri-result":         { "title": "", "description": "", "og_image": "", "no_index": false },
  "sinastri":                   { "title": "", "description": "", "og_image": "", "no_index": false },
  "sinastri-result":            { "title": "", "description": "", "og_image": "", "no_index": false }
}')
ON DUPLICATE KEY UPDATE value = VALUES(value);
