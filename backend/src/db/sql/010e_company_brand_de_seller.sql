-- =============================================================
-- 010e_company_brand_de_seller.sql
-- Stripe tek-kimlik kararı (2026-08-16): müşteriye görünen satıcı/işletmeci
-- kimliği Orhan Güzel – Softwareentwicklung (DE) olarak tekilleştirildi.
-- Gerekçe: Stripe hesabı bu işletme adına; sitede farklı bir tüzel kişinin
-- (QUEBAB TR) satıcı görünmesi "üçüncü şahıs adına tahsilat" riski doğurur.
-- Footer/iletişim sayfaları alanları koşullu render eder; TR'ye özgü alanlar
-- (mersis, tax_no, trade_registry) bilinçli olarak boş bırakıldı.
-- =============================================================

INSERT INTO site_settings (id, `key`, locale, value) VALUES
('01000000-0000-4000-8000-000000000026', 'company_brand', '*',
 '{"name":"GoldMoodAstro","slogan":"Yıldızlarla tanışan modern astroloji","legal_name":"Orhan Güzel – Softwareentwicklung","address":"Stralsunder Str. 38, 41515 Grevenbroich, Deutschland","vat_id":"DE463832419","phone":"0212 807 09 59","email":"goldmoodastro@gmail.com"}')
ON DUPLICATE KEY UPDATE value = VALUES(value);
