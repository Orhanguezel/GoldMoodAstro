-- =============================================================
-- 033_consultant_services_seed.sql
-- T29-1: Mevcut tüm danışmanlara default 1 servis atanır (mevcut session_price/duration ile).
-- Fatma'ya AdviceMy benzeri 5 paket eklenir (1 ücretsiz tanışma + 4 ücretli).
-- =============================================================

-- 1) Tüm danışmanlara default ana servis (mevcut consultants.session_price/duration'dan)
INSERT INTO consultant_services (id, consultant_id, name, slug, description, duration_minutes, price, currency, is_free, is_active, sort_order)
SELECT
  CONCAT('cs000000-', SUBSTRING(MD5(c.id),1,4),'-4000-8000-', SUBSTRING(MD5(CONCAT(c.id,'default')),1,12)) AS id,
  c.id,
  CONCAT(c.session_duration, ' dk Bireysel Seans') AS name,
  CONCAT('bireysel-', c.session_duration, 'dk') AS slug,
  'Standart bireysel danışmanlık seansı.' AS description,
  c.session_duration,
  c.session_price,
  c.currency,
  0 AS is_free,
  1 AS is_active,
  10 AS sort_order
FROM consultants c
WHERE c.approval_status = 'approved'
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), is_active = 1;

-- 2) Fatma için 5 paket (consultant_id = 20000000-0000-4000-8000-000000000006)
SET @FATMA := '20000000-0000-4000-8000-000000000006';

INSERT INTO consultant_services (id, consultant_id, name, slug, description, duration_minutes, price, currency, is_free, is_active, sort_order) VALUES
('cs100000-0001-4000-8000-000000000001', @FATMA, 'Birbirimizi Tanıyalım', 'birbirimizi-taniyalim', 'Ücretsiz ön görüşme: ihtiyaçlarınızı ve beklentilerinizi paylaşmak ve birlikte çalışma uygunluğunu değerlendirmek için kısa bir tanışma sohbeti.', 15, 0.00, 'TRY', 1, 1, 1),
('cs100000-0001-4000-8000-000000000002', @FATMA, 'Horary Astroloji Sorusu', 'horary-soru', 'Tek bir konuya odaklanan kısa horary astroloji yorumu. "Ne zaman?" / "Olur mu?" tipi sorulara ışık tutar.', 20, 750.00, 'TRY', 0, 1, 2),
('cs100000-0001-4000-8000-000000000003', @FATMA, 'Doğum Saati Rektifikasyonu', 'rektifikasyon', 'Doğum saatinizi bilmiyorsanız hayat olaylarınızdan yola çıkarak haritanızı yeniden çıkarırız.', 60, 2500.00, 'TRY', 0, 1, 3),
('cs100000-0001-4000-8000-000000000004', @FATMA, 'İlişki / Sinastri Analizi', 'iliski-sinastri', 'Çiftlerin doğum haritalarının karşılaştırılması, ilişki dinamikleri ve potansiyeli üzerine derinlemesine yorum.', 60, 2500.00, 'TRY', 0, 1, 4),
('cs100000-0001-4000-8000-000000000005', @FATMA, 'Genel Doğum Haritası Analizi', 'dogum-haritasi-genel', 'Tam kapsamlı doğum haritası okuması: kişilik, kariyer, ilişki, ruhsal yön ve transit etkiler.', 90, 3500.00, 'TRY', 0, 1, 5)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), description = VALUES(description),
  duration_minutes = VALUES(duration_minutes), price = VALUES(price),
  is_free = VALUES(is_free), is_active = 1, sort_order = VALUES(sort_order);
