-- =============================================================
-- 121_reviews_seed.sql
-- Astrolog yorumları (placeholder): 3 danışman x 3 yorum = 9 review.
-- user_id / booking_id NULL — bu seed kayıtları "gönderilmiş ama auth yok"
-- (display amaçlı). Admin panelden ekle/sil/düzenle yapılabilir.
-- =============================================================

INSERT INTO reviews (
  id, target_type, target_id, user_id, name, email, booking_id, rating,
  is_active, is_approved, is_verified, display_order, submitted_locale,
  helpful_count
) VALUES
-- ── Zeynep Yıldız (20...001) — astrology, birth_chart, relationship ──
('60000000-0000-4000-8000-000000000101','consultant','20000000-0000-4000-8000-000000000001',NULL,'Ayşe K.',NULL,NULL,5,1,1,1,10,'tr',8),
('60000000-0000-4000-8000-000000000102','consultant','20000000-0000-4000-8000-000000000001',NULL,'Mehmet B.',NULL,NULL,5,1,1,0,20,'tr',3),
('60000000-0000-4000-8000-000000000103','consultant','20000000-0000-4000-8000-000000000001',NULL,'Selin Y.',NULL,NULL,4,1,1,1,30,'tr',5),

-- ── Ömer Toprak (20...002) — tarot, numerology ──
('60000000-0000-4000-8000-000000000201','consultant','20000000-0000-4000-8000-000000000002',NULL,'Burcu Ş.',NULL,NULL,5,1,1,1,10,'tr',6),
('60000000-0000-4000-8000-000000000202','consultant','20000000-0000-4000-8000-000000000002',NULL,'Cem A.',NULL,NULL,4,1,1,0,20,'tr',2),
('60000000-0000-4000-8000-000000000203','consultant','20000000-0000-4000-8000-000000000002',NULL,'Deniz K.',NULL,NULL,5,1,1,1,30,'tr',4),

-- ── Selin Ay (20...003) — astrology, mood, career ──
('60000000-0000-4000-8000-000000000301','consultant','20000000-0000-4000-8000-000000000003',NULL,'Elif T.',NULL,NULL,5,1,1,1,10,'tr',9),
('60000000-0000-4000-8000-000000000302','consultant','20000000-0000-4000-8000-000000000003',NULL,'Hakan U.',NULL,NULL,5,1,1,1,20,'tr',5),
('60000000-0000-4000-8000-000000000303','consultant','20000000-0000-4000-8000-000000000003',NULL,'Pınar M.',NULL,NULL,4,1,1,0,30,'tr',1)
ON DUPLICATE KEY UPDATE
  rating       = VALUES(rating),
  is_active    = VALUES(is_active),
  is_approved  = VALUES(is_approved),
  is_verified  = VALUES(is_verified),
  display_order= VALUES(display_order),
  helpful_count= VALUES(helpful_count);

-- ── i18n metinleri (TR — sadece submitted_locale ile aynı) ──
INSERT INTO review_i18n (id, review_id, locale, title, comment) VALUES
-- Zeynep Yıldız
('61000000-0000-4000-8000-000000000101','60000000-0000-4000-8000-000000000101','tr','Tam isabet','Doğum haritamı detaylı bir şekilde yorumladı, sorularıma sabırla cevap verdi. İlişki analizi tahminleri tutuyor.'),
('61000000-0000-4000-8000-000000000102','60000000-0000-4000-8000-000000000102','tr','Profesyonel yaklaşım','Yıllık öngörüler bölümü çok detaylıydı. Kararsız kaldığım iş kararında yön bulmamı sağladı.'),
('61000000-0000-4000-8000-000000000103','60000000-0000-4000-8000-000000000103','tr','Empatik ve net','Sezgisel okumaları beni şaşırttı. Sadece yorum değil, bir bakış açısı kazandırdı. Tekrar görüşmeyi istiyorum.'),
-- Ömer Toprak
('61000000-0000-4000-8000-000000000201','60000000-0000-4000-8000-000000000201','tr','Numeroloji harika','Hayat yolu sayım üzerine yaptığı analiz beklentilerimin çok üstündeydi. Açıklayıcı ve içten bir görüşmeydi.'),
('61000000-0000-4000-8000-000000000202','60000000-0000-4000-8000-000000000202','tr','Tarot okuması','Kart yorumlarında çok netti, gereksiz şeyler eklemedi. Süre kısa ama dolu doluydu.'),
('61000000-0000-4000-8000-000000000203','60000000-0000-4000-8000-000000000203','tr','İsim enerjisi yorumu','İsim değişikliği düşünüyordum, anlamlı ve mantıklı bir öneri sundu. Şimdi daha rahatım.'),
-- Selin Ay
('61000000-0000-4000-8000-000000000301','60000000-0000-4000-8000-000000000301','tr','Ruhsal rehberlik','Sadece astroloji değil, koçluk hissi de veriyor. Stresli dönemimde yön bulmama yardımcı oldu.'),
('61000000-0000-4000-8000-000000000302','60000000-0000-4000-8000-000000000302','tr','Sezgileri güçlü','Söylemediğim şeyleri bile fark etti. Kariyer sorularımdaki belirsizliği netleştirdi.'),
('61000000-0000-4000-8000-000000000303','60000000-0000-4000-8000-000000000303','tr','Yaşam koçluğu seansı','Astroloji + koçluk birleşimi farklı. Pratik adımlarla bitirdik, çok memnun kaldım.')
ON DUPLICATE KEY UPDATE
  title   = VALUES(title),
  comment = VALUES(comment);
