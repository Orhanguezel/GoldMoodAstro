-- =============================================================
-- 123_reviews_orhan_seed.sql
-- Orhan Güzel danışmanı için 8 pozitif yorum (reviews + review_i18n).
-- 120_review_schema.sql sonra çalışmalı (FK: reviews tablosuna).
-- 122_reviews_fatma_seed.sql ile aynı pattern.
-- =============================================================

SET @ORHAN_CONSULTANT := '20000000-0000-4000-8000-000000000008';

INSERT INTO reviews (id, target_type, target_id, name, rating, is_active, is_approved, is_verified, submitted_locale, created_at, updated_at) VALUES
('abcdef00-0000-4000-8000-0000000000c1', 'consultant', @ORHAN_CONSULTANT, 'D∗∗∗ K∗∗∗', 5, 1, 1, 1, 'tr', '2026-04-25 14:00:00', '2026-04-25 14:00:00'),
('abcdef00-0000-4000-8000-0000000000c2', 'consultant', @ORHAN_CONSULTANT, 'A∗∗∗ Ç∗∗∗', 5, 1, 1, 1, 'tr', '2026-04-22 11:30:00', '2026-04-22 11:30:00'),
('abcdef00-0000-4000-8000-0000000000c3', 'consultant', @ORHAN_CONSULTANT, 'M∗∗∗ T∗∗∗', 5, 1, 1, 1, 'tr', '2026-04-19 09:15:00', '2026-04-19 09:15:00'),
('abcdef00-0000-4000-8000-0000000000c4', 'consultant', @ORHAN_CONSULTANT, 'S∗∗∗ B∗∗∗', 5, 1, 1, 1, 'tr', '2026-04-15 16:45:00', '2026-04-15 16:45:00'),
('abcdef00-0000-4000-8000-0000000000c5', 'consultant', @ORHAN_CONSULTANT, 'F∗∗∗ E∗∗∗', 5, 1, 1, 1, 'tr', '2026-04-10 13:20:00', '2026-04-10 13:20:00'),
('abcdef00-0000-4000-8000-0000000000c6', 'consultant', @ORHAN_CONSULTANT, 'K∗∗∗ A∗∗∗', 5, 1, 1, 1, 'tr', '2026-04-04 10:00:00', '2026-04-04 10:00:00'),
('abcdef00-0000-4000-8000-0000000000c7', 'consultant', @ORHAN_CONSULTANT, 'Z∗∗∗ Ö∗∗∗', 4, 1, 1, 1, 'tr', '2026-03-28 15:00:00', '2026-03-28 15:00:00'),
('abcdef00-0000-4000-8000-0000000000c8', 'consultant', @ORHAN_CONSULTANT, 'B∗∗∗ Y∗∗∗', 5, 1, 1, 1, 'tr', '2026-03-21 12:30:00', '2026-03-21 12:30:00')
ON DUPLICATE KEY UPDATE rating = VALUES(rating);

-- Yorum içerikleri (review_i18n)
INSERT INTO review_i18n (id, review_id, locale, comment, created_at) VALUES
('bcdef000-0000-4000-8000-0000000000c1', 'abcdef00-0000-4000-8000-0000000000c1', 'tr', 'Doğum haritamı çok detaylı, anlaşılır biçimde açıkladı. Hayatımdaki tekrar eden döngüleri net görmemi sağladı. Kibar ve sabırlı bir rehber, mesajlaşmasıyla bile büyük katkı sağlıyor.', '2026-04-25 14:00:00'),
('bcdef000-0000-4000-8000-0000000000c2', 'abcdef00-0000-4000-8000-0000000000c2', 'tr', 'Sinastri analizinde inanılmaz isabetli yorumlar. Partnerimle aramızdaki dinamikleri görmek hem rahatlattı hem de gelişim alanlarımızı anlamamı sağladı.', '2026-04-22 11:30:00'),
('bcdef000-0000-4000-8000-0000000000c3', 'abcdef00-0000-4000-8000-0000000000c3', 'tr', 'Numeroloji konusunda gerçekten bilgili. Kader sayım hakkında o güne kadar duymadığım derinlikte yorumlar yaptı. Yazışma tarzı çok profesyonel.', '2026-04-19 09:15:00'),
('bcdef000-0000-4000-8000-0000000000c4', 'abcdef00-0000-4000-8000-0000000000c4', 'tr', 'Saturn return geçişimde Orhan Bey''den yazılı destek aldım. Hem teknik açıklamaları hem de pratik öneriler çok değerli. Net, sade, kapsamlı.', '2026-04-15 16:45:00'),
('bcdef000-0000-4000-8000-0000000000c5', 'abcdef00-0000-4000-8000-0000000000c5', 'tr', 'Tarot okumamda öne çıkan kartların sembolizmini özenle açıkladı. Rider-Waite''i hem klasik hem modern bakışla yorumlayabilen ender rehberlerden.', '2026-04-10 13:20:00'),
('bcdef000-0000-4000-8000-0000000000c6', 'abcdef00-0000-4000-8000-0000000000c6', 'tr', 'Kariyer haritası analizinde yıldızını çok iyi okuyan biri. Mevcut işime devam etmem mi yeni alanlara açılmam mı sorusunda zihnimi açacak şekilde yol gösterdi.', '2026-04-04 10:00:00'),
('bcdef000-0000-4000-8000-0000000000c7', 'abcdef00-0000-4000-8000-0000000000c7', 'tr', 'Yanıtı biraz uzun sürdü ama gelen analiz çok detaylı ve özenliydi. Sabırlı olmaya değer.', '2026-03-28 15:00:00'),
('bcdef000-0000-4000-8000-0000000000c8', 'abcdef00-0000-4000-8000-0000000000c8', 'tr', '12. ev temaları üzerine yaptığımız yazışma neredeyse terapi etkisi yarattı. Astrolojiyi sembolik bir öz-farkındalık dili olarak kullanan büyük bir rehber.', '2026-03-21 12:30:00')
ON DUPLICATE KEY UPDATE comment = VALUES(comment);
