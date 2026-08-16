-- =============================================================
-- 033_consultant_services_seed.sql
-- T29-1: Hizmet paketleri örnek seed'i.
--
-- Her ONAYLI danışmana:
--   1) Ücretsiz ön görüşme ("Ücretsiz Tanışma Görüşmesi")
--   2) 3 genel ücretli paket (hızlı / standart / detaylı)
--   3) Uzmanlık alanına (expertise) göre kategori-özel örnek paketler
--
-- KURAL: Tüm satırlar INSERT IGNORE — (consultant_id, slug) UNIQUE.
-- Böylece deploy'da yeniden seed çalışsa bile danışmanın düzenlediği
-- paketler ASLA ezilmez; seed yalnızca bir kerelik şablon görevi görür.
-- Danışman /me/consultant/services üzerinden hepsini düzenler/siler.
--
-- Deterministik id: MD5(consultant_id + slug) → sabit UUID (8-4-4-4-12),
-- tekrar seed'de aynı id üretilir, INSERT IGNORE no-op olur.
-- =============================================================

-- ---- 1) GENEL PAKETLER (tüm onaylı danışmanlar) -------------------------

-- 1a) Ücretsiz Tanışma Görüşmesi (ön görüşme)
INSERT IGNORE INTO consultant_services
  (id, consultant_id, name, slug, description, duration_minutes, price, currency, media_type, is_free, is_active, sort_order)
SELECT
  CONCAT(SUBSTRING(MD5(CONCAT(c.id,'free-intro')),1,8),'-',SUBSTRING(MD5(CONCAT(c.id,'free-intro')),9,4),'-4',SUBSTRING(MD5(CONCAT(c.id,'free-intro')),14,3),'-8',SUBSTRING(MD5(CONCAT(c.id,'free-intro')),18,3),'-',SUBSTRING(MD5(CONCAT(c.id,'free-intro')),21,12)),
  c.id, 'Ücretsiz Tanışma Görüşmesi', 'free-intro',
  'Ücretsiz ön görüşme: ihtiyaçlarınızı ve beklentilerinizi paylaşmak, birlikte çalışma uygunluğunu değerlendirmek için kısa bir tanışma sohbeti.',
  15, 0.00, 'TRY', 'audio', 1, 1, 1
FROM consultants c WHERE c.approval_status = 'approved';

-- 1b) Hızlı Soru Seansı
INSERT IGNORE INTO consultant_services
  (id, consultant_id, name, slug, description, duration_minutes, price, currency, media_type, is_free, is_active, sort_order)
SELECT
  CONCAT(SUBSTRING(MD5(CONCAT(c.id,'hizli-soru')),1,8),'-',SUBSTRING(MD5(CONCAT(c.id,'hizli-soru')),9,4),'-4',SUBSTRING(MD5(CONCAT(c.id,'hizli-soru')),14,3),'-8',SUBSTRING(MD5(CONCAT(c.id,'hizli-soru')),18,3),'-',SUBSTRING(MD5(CONCAT(c.id,'hizli-soru')),21,12)),
  c.id, 'Hızlı Soru Seansı', 'hizli-soru',
  'Tek bir konuya odaklanan kısa seans. Net bir sorunuza hızlı ve öz bir yorum.',
  20, 400.00, 'TRY', 'audio', 0, 1, 2
FROM consultants c WHERE c.approval_status = 'approved';

-- 1c) Standart Danışmanlık Seansı
INSERT IGNORE INTO consultant_services
  (id, consultant_id, name, slug, description, duration_minutes, price, currency, media_type, is_free, is_active, sort_order)
SELECT
  CONCAT(SUBSTRING(MD5(CONCAT(c.id,'standart-danismanlik')),1,8),'-',SUBSTRING(MD5(CONCAT(c.id,'standart-danismanlik')),9,4),'-4',SUBSTRING(MD5(CONCAT(c.id,'standart-danismanlik')),14,3),'-8',SUBSTRING(MD5(CONCAT(c.id,'standart-danismanlik')),18,3),'-',SUBSTRING(MD5(CONCAT(c.id,'standart-danismanlik')),21,12)),
  c.id, 'Standart Danışmanlık Seansı', 'standart-danismanlik',
  'Kapsamlı bireysel danışmanlık seansı. Güncel durumunuzu ve sorularınızı detaylıca ele alırız.',
  45, 900.00, 'TRY', 'audio', 0, 1, 3
FROM consultants c WHERE c.approval_status = 'approved';

-- 1d) Detaylı Analiz Seansı
INSERT IGNORE INTO consultant_services
  (id, consultant_id, name, slug, description, duration_minutes, price, currency, media_type, is_free, is_active, sort_order)
SELECT
  CONCAT(SUBSTRING(MD5(CONCAT(c.id,'detayli-analiz')),1,8),'-',SUBSTRING(MD5(CONCAT(c.id,'detayli-analiz')),9,4),'-4',SUBSTRING(MD5(CONCAT(c.id,'detayli-analiz')),14,3),'-8',SUBSTRING(MD5(CONCAT(c.id,'detayli-analiz')),18,3),'-',SUBSTRING(MD5(CONCAT(c.id,'detayli-analiz')),21,12)),
  c.id, 'Detaylı Analiz Seansı', 'detayli-analiz',
  'Derinlemesine inceleme ve uzun vadeli yönlendirme içeren geniş kapsamlı seans.',
  75, 1500.00, 'TRY', 'audio', 0, 1, 4
FROM consultants c WHERE c.approval_status = 'approved';

-- ---- 2) KATEGORİ-ÖZEL PAKETLER (expertise içeriyorsa) -------------------

-- astrology → Doğum Haritası Yorumu
INSERT IGNORE INTO consultant_services
  (id, consultant_id, name, slug, description, duration_minutes, price, currency, media_type, is_free, is_active, sort_order)
SELECT
  CONCAT(SUBSTRING(MD5(CONCAT(c.id,'dogum-haritasi-yorumu')),1,8),'-',SUBSTRING(MD5(CONCAT(c.id,'dogum-haritasi-yorumu')),9,4),'-4',SUBSTRING(MD5(CONCAT(c.id,'dogum-haritasi-yorumu')),14,3),'-8',SUBSTRING(MD5(CONCAT(c.id,'dogum-haritasi-yorumu')),18,3),'-',SUBSTRING(MD5(CONCAT(c.id,'dogum-haritasi-yorumu')),21,12)),
  c.id, 'Doğum Haritası Yorumu', 'dogum-haritasi-yorumu',
  'Doğum haritanızdaki gezegen yerleşimleri ve açılarla kişilik, potansiyel ve güncel etkiler üzerine yorum.',
  60, 1800.00, 'TRY', 'audio', 0, 1, 11
FROM consultants c
WHERE c.approval_status = 'approved' AND JSON_CONTAINS(c.expertise, '"astrology"');

-- birth_chart → Detaylı Doğum Haritası Analizi
INSERT IGNORE INTO consultant_services
  (id, consultant_id, name, slug, description, duration_minutes, price, currency, media_type, is_free, is_active, sort_order)
SELECT
  CONCAT(SUBSTRING(MD5(CONCAT(c.id,'detayli-dogum-haritasi')),1,8),'-',SUBSTRING(MD5(CONCAT(c.id,'detayli-dogum-haritasi')),9,4),'-4',SUBSTRING(MD5(CONCAT(c.id,'detayli-dogum-haritasi')),14,3),'-8',SUBSTRING(MD5(CONCAT(c.id,'detayli-dogum-haritasi')),18,3),'-',SUBSTRING(MD5(CONCAT(c.id,'detayli-dogum-haritasi')),21,12)),
  c.id, 'Detaylı Doğum Haritası Analizi', 'detayli-dogum-haritasi',
  'Tam kapsamlı doğum haritası okuması: kişilik, kariyer, ilişki, ruhsal yön ve transit etkiler.',
  90, 2800.00, 'TRY', 'audio', 0, 1, 12
FROM consultants c
WHERE c.approval_status = 'approved' AND JSON_CONTAINS(c.expertise, '"birth_chart"');

-- birth_chart → Rektifikasyon
INSERT IGNORE INTO consultant_services
  (id, consultant_id, template_id, category_slug, name, slug, description, duration_minutes, price, currency, media_type, is_free, is_active, sort_order)
SELECT
  CONCAT(SUBSTRING(MD5(CONCAT(c.id,'rektifikasyon')),1,8),'-',SUBSTRING(MD5(CONCAT(c.id,'rektifikasyon')),9,4),'-4',SUBSTRING(MD5(CONCAT(c.id,'rektifikasyon')),14,3),'-8',SUBSTRING(MD5(CONCAT(c.id,'rektifikasyon')),18,3),'-',SUBSTRING(MD5(CONCAT(c.id,'rektifikasyon')),21,12)),
  c.id,
  CONCAT(SUBSTRING(MD5('birth_chart|rektifikasyon'),1,8),'-',SUBSTRING(MD5('birth_chart|rektifikasyon'),9,4),'-4',SUBSTRING(MD5('birth_chart|rektifikasyon'),14,3),'-8',SUBSTRING(MD5('birth_chart|rektifikasyon'),18,3),'-',SUBSTRING(MD5('birth_chart|rektifikasyon'),21,12)),
  'birth_chart',
  'Rektifikasyon',
  'rektifikasyon',
  'Doğum saati bilinmeyen veya emin olunmayan danışanlar için yaşam olayları üzerinden doğum saati netleştirme çalışması.',
  60, 1800.00, 'TRY', 'audio', 0, 1, 13
FROM consultants c
WHERE c.approval_status = 'approved' AND JSON_CONTAINS(c.expertise, '"birth_chart"');

-- tarot → Tarot Açılımı
INSERT IGNORE INTO consultant_services
  (id, consultant_id, name, slug, description, duration_minutes, price, currency, media_type, is_free, is_active, sort_order)
SELECT
  CONCAT(SUBSTRING(MD5(CONCAT(c.id,'tarot-acilimi')),1,8),'-',SUBSTRING(MD5(CONCAT(c.id,'tarot-acilimi')),9,4),'-4',SUBSTRING(MD5(CONCAT(c.id,'tarot-acilimi')),14,3),'-8',SUBSTRING(MD5(CONCAT(c.id,'tarot-acilimi')),18,3),'-',SUBSTRING(MD5(CONCAT(c.id,'tarot-acilimi')),21,12)),
  c.id, 'Tarot Açılımı', 'tarot-acilimi',
  'Kartların sembolizmiyle sorularınıza rehberlik eden tarot açılımı ve yorumu.',
  30, 650.00, 'TRY', 'audio', 0, 1, 13
FROM consultants c
WHERE c.approval_status = 'approved' AND JSON_CONTAINS(c.expertise, '"tarot"');

-- numerology → Numeroloji Raporu
INSERT IGNORE INTO consultant_services
  (id, consultant_id, name, slug, description, duration_minutes, price, currency, media_type, is_free, is_active, sort_order)
SELECT
  CONCAT(SUBSTRING(MD5(CONCAT(c.id,'numeroloji-raporu')),1,8),'-',SUBSTRING(MD5(CONCAT(c.id,'numeroloji-raporu')),9,4),'-4',SUBSTRING(MD5(CONCAT(c.id,'numeroloji-raporu')),14,3),'-8',SUBSTRING(MD5(CONCAT(c.id,'numeroloji-raporu')),18,3),'-',SUBSTRING(MD5(CONCAT(c.id,'numeroloji-raporu')),21,12)),
  c.id, 'Numeroloji Raporu', 'numeroloji-raporu',
  'İsim ve doğum tarihinizden çıkarılan numeroloji haritası ve yaşam yolu yorumu.',
  30, 650.00, 'TRY', 'audio', 0, 1, 14
FROM consultants c
WHERE c.approval_status = 'approved' AND JSON_CONTAINS(c.expertise, '"numerology"');

-- relationship / relationship_advice → İlişki & Sinastri Analizi
INSERT IGNORE INTO consultant_services
  (id, consultant_id, name, slug, description, duration_minutes, price, currency, media_type, is_free, is_active, sort_order)
SELECT
  CONCAT(SUBSTRING(MD5(CONCAT(c.id,'iliski-sinastri')),1,8),'-',SUBSTRING(MD5(CONCAT(c.id,'iliski-sinastri')),9,4),'-4',SUBSTRING(MD5(CONCAT(c.id,'iliski-sinastri')),14,3),'-8',SUBSTRING(MD5(CONCAT(c.id,'iliski-sinastri')),18,3),'-',SUBSTRING(MD5(CONCAT(c.id,'iliski-sinastri')),21,12)),
  c.id, 'İlişki & Sinastri Analizi', 'iliski-sinastri',
  'İki kişinin haritalarının karşılaştırılması; ilişki dinamikleri, uyum ve potansiyel üzerine derin yorum.',
  60, 2200.00, 'TRY', 'audio', 0, 1, 15
FROM consultants c
WHERE c.approval_status = 'approved'
  AND (JSON_CONTAINS(c.expertise, '"relationship"') OR JSON_CONTAINS(c.expertise, '"relationship_advice"'));

-- mood / spiritual_guidance → Ruhsal Rehberlik Seansı
INSERT IGNORE INTO consultant_services
  (id, consultant_id, name, slug, description, duration_minutes, price, currency, media_type, is_free, is_active, sort_order)
SELECT
  CONCAT(SUBSTRING(MD5(CONCAT(c.id,'ruhsal-rehberlik')),1,8),'-',SUBSTRING(MD5(CONCAT(c.id,'ruhsal-rehberlik')),9,4),'-4',SUBSTRING(MD5(CONCAT(c.id,'ruhsal-rehberlik')),14,3),'-8',SUBSTRING(MD5(CONCAT(c.id,'ruhsal-rehberlik')),18,3),'-',SUBSTRING(MD5(CONCAT(c.id,'ruhsal-rehberlik')),21,12)),
  c.id, 'Ruhsal Rehberlik Seansı', 'ruhsal-rehberlik',
  'İçsel denge ve farkındalık için manevi rehberlik; duygusal süreçlerinizde destekleyici bir seans.',
  45, 1100.00, 'TRY', 'audio', 0, 1, 16
FROM consultants c
WHERE c.approval_status = 'approved'
  AND (JSON_CONTAINS(c.expertise, '"mood"') OR JSON_CONTAINS(c.expertise, '"spiritual_guidance"'));

-- career → Kariyer & Para Danışmanlığı
INSERT IGNORE INTO consultant_services
  (id, consultant_id, name, slug, description, duration_minutes, price, currency, media_type, is_free, is_active, sort_order)
SELECT
  CONCAT(SUBSTRING(MD5(CONCAT(c.id,'kariyer-para')),1,8),'-',SUBSTRING(MD5(CONCAT(c.id,'kariyer-para')),9,4),'-4',SUBSTRING(MD5(CONCAT(c.id,'kariyer-para')),14,3),'-8',SUBSTRING(MD5(CONCAT(c.id,'kariyer-para')),18,3),'-',SUBSTRING(MD5(CONCAT(c.id,'kariyer-para')),21,12)),
  c.id, 'Kariyer & Para Danışmanlığı', 'kariyer-para',
  'İş hayatınızda doğru zamanlama, fırsatlar ve finansal akış üzerine odaklı danışmanlık.',
  45, 1100.00, 'TRY', 'audio', 0, 1, 17
FROM consultants c
WHERE c.approval_status = 'approved' AND JSON_CONTAINS(c.expertise, '"career"');

-- coffee → Kahve Falı Yorumu
INSERT IGNORE INTO consultant_services
  (id, consultant_id, name, slug, description, duration_minutes, price, currency, media_type, is_free, is_active, sort_order)
SELECT
  CONCAT(SUBSTRING(MD5(CONCAT(c.id,'kahve-fali-yorumu')),1,8),'-',SUBSTRING(MD5(CONCAT(c.id,'kahve-fali-yorumu')),9,4),'-4',SUBSTRING(MD5(CONCAT(c.id,'kahve-fali-yorumu')),14,3),'-8',SUBSTRING(MD5(CONCAT(c.id,'kahve-fali-yorumu')),18,3),'-',SUBSTRING(MD5(CONCAT(c.id,'kahve-fali-yorumu')),21,12)),
  c.id, 'Kahve Falı Yorumu', 'kahve-fali-yorumu',
  'Fincan fotoğraflarınızdaki sembollerin geleneksel anlamlarıyla kişisel yorumu.',
  20, 450.00, 'TRY', 'audio', 0, 1, 18
FROM consultants c
WHERE c.approval_status = 'approved' AND JSON_CONTAINS(c.expertise, '"coffee"');
