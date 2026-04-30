-- =============================================================
-- 122_reviews_fatma_seed.sql
-- Fatma Güçlü için 25 gerçek yorum (advicemy.com'dan transfer).
-- target_type='consultant', target_id=Fatma'nın consultant_id'si.
-- Hepsi 5 yıldız, doğrulanmış (is_verified=1) + onaylı (is_approved=1).
-- =============================================================
SET @FATMA := '20000000-0000-4000-8000-000000000006';

INSERT INTO reviews (id, target_type, target_id, name, rating, is_active, is_approved, is_verified, submitted_locale, created_at, updated_at) VALUES
('abcdef00-0000-4000-8000-000000000001', 'consultant', @FATMA, 'S∗∗∗ A∗∗∗',                  5, 1, 1, 1, 'tr', '2026-04-26 12:00:00', '2026-04-26 12:00:00'),
('abcdef00-0000-4000-8000-000000000002', 'consultant', @FATMA, 'E∗∗∗ ∗∗∗',                   5, 1, 1, 1, 'tr', '2026-04-14 12:00:00', '2026-04-14 12:00:00'),
('abcdef00-0000-4000-8000-000000000003', 'consultant', @FATMA, 'H∗∗∗ M∗∗∗',                  5, 1, 1, 1, 'tr', '2026-04-07 12:00:00', '2026-04-07 12:00:00'),
('abcdef00-0000-4000-8000-000000000004', 'consultant', @FATMA, 'B∗∗∗ B∗∗∗',                  5, 1, 1, 1, 'tr', '2026-04-07 11:00:00', '2026-04-07 11:00:00'),
('abcdef00-0000-4000-8000-000000000005', 'consultant', @FATMA, 'E∗∗∗ B∗∗∗',                  5, 1, 1, 1, 'tr', '2026-03-21 12:00:00', '2026-03-21 12:00:00'),
('abcdef00-0000-4000-8000-000000000006', 'consultant', @FATMA, 'B∗∗∗ D∗∗∗',                  5, 1, 1, 1, 'tr', '2026-03-19 12:00:00', '2026-03-19 12:00:00'),
('abcdef00-0000-4000-8000-000000000007', 'consultant', @FATMA, 'G∗∗∗',                       5, 1, 1, 1, 'tr', '2026-03-17 12:00:00', '2026-03-17 12:00:00'),
('abcdef00-0000-4000-8000-000000000008', 'consultant', @FATMA, 'S∗∗∗ I∗∗∗',                  5, 1, 1, 1, 'tr', '2026-03-15 12:00:00', '2026-03-15 12:00:00'),
('abcdef00-0000-4000-8000-000000000009', 'consultant', @FATMA, 'C∗∗∗ A∗∗∗',                  5, 1, 1, 1, 'tr', '2026-03-12 12:00:00', '2026-03-12 12:00:00'),
('abcdef00-0000-4000-8000-000000000010', 'consultant', @FATMA, 'E∗∗∗ Y∗∗∗',                  5, 1, 1, 1, 'tr', '2026-02-21 12:00:00', '2026-02-21 12:00:00'),
('abcdef00-0000-4000-8000-000000000011', 'consultant', @FATMA, 'E∗∗∗ Y∗∗∗',                  5, 1, 1, 1, 'tr', '2026-02-19 12:00:00', '2026-02-19 12:00:00'),
('abcdef00-0000-4000-8000-000000000012', 'consultant', @FATMA, 'E∗∗∗ O∗∗∗ ∗∗∗ K∗∗∗ ∗∗∗',     5, 1, 1, 1, 'tr', '2026-02-17 12:00:00', '2026-02-17 12:00:00'),
('abcdef00-0000-4000-8000-000000000013', 'consultant', @FATMA, 'H∗∗∗ P∗∗∗',                  5, 1, 1, 1, 'tr', '2026-02-11 12:00:00', '2026-02-11 12:00:00'),
('abcdef00-0000-4000-8000-000000000014', 'consultant', @FATMA, 'M∗∗∗ A∗∗∗',                  5, 1, 1, 1, 'tr', '2025-10-04 12:00:00', '2025-10-04 12:00:00'),
('abcdef00-0000-4000-8000-000000000015', 'consultant', @FATMA, 'G∗∗∗',                       5, 1, 1, 1, 'tr', '2025-09-24 12:00:00', '2025-09-24 12:00:00'),
('abcdef00-0000-4000-8000-000000000016', 'consultant', @FATMA, 'B∗∗∗ B∗∗∗ k∗∗∗',             5, 1, 1, 1, 'tr', '2025-09-21 12:00:00', '2025-09-21 12:00:00'),
('abcdef00-0000-4000-8000-000000000017', 'consultant', @FATMA, 'Ö∗∗∗',                       5, 1, 1, 1, 'tr', '2025-08-20 12:00:00', '2025-08-20 12:00:00'),
('abcdef00-0000-4000-8000-000000000018', 'consultant', @FATMA, 'K∗∗∗ K∗∗∗',                  5, 1, 1, 1, 'tr', '2025-07-24 12:00:00', '2025-07-24 12:00:00'),
('abcdef00-0000-4000-8000-000000000019', 'consultant', @FATMA, 'c∗∗∗ ç∗∗∗',                  5, 1, 1, 1, 'tr', '2025-05-07 12:00:00', '2025-05-07 12:00:00'),
('abcdef00-0000-4000-8000-000000000020', 'consultant', @FATMA, 'V∗∗∗ S∗∗∗',                  5, 1, 1, 1, 'tr', '2025-04-13 12:00:00', '2025-04-13 12:00:00'),
('abcdef00-0000-4000-8000-000000000021', 'consultant', @FATMA, 'A∗∗∗ ∗∗∗',                   5, 1, 1, 1, 'tr', '2025-04-12 12:00:00', '2025-04-12 12:00:00'),
('abcdef00-0000-4000-8000-000000000022', 'consultant', @FATMA, 'S∗∗∗ C∗∗∗',                  5, 1, 1, 1, 'tr', '2025-04-03 12:00:00', '2025-04-03 12:00:00'),
('abcdef00-0000-4000-8000-000000000023', 'consultant', @FATMA, 'G∗∗∗',                       5, 1, 1, 1, 'tr', '2025-03-25 12:00:00', '2025-03-25 12:00:00'),
('abcdef00-0000-4000-8000-000000000024', 'consultant', @FATMA, 'E∗∗∗ ∗∗∗',                   5, 1, 1, 1, 'tr', '2025-01-01 12:00:00', '2025-01-01 12:00:00'),
('abcdef00-0000-4000-8000-000000000025', 'consultant', @FATMA, 'Ö∗∗∗ ∗∗∗',                   5, 1, 1, 1, 'tr', '2024-12-23 12:00:00', '2024-12-23 12:00:00')
ON DUPLICATE KEY UPDATE name = VALUES(name), rating = VALUES(rating), is_approved = 1, is_verified = 1;

-- review_i18n: yorum metinleri (tr)
INSERT INTO review_i18n (id, review_id, locale, comment) VALUES
('abcdef01-0000-4000-8000-000000000001', 'abcdef00-0000-4000-8000-000000000001', 'tr', 'Enerjisine bayıldım resmen o kadar tatlı ve net bir şekilde yorumladı ki neredeyse terapi aldım gibi hissettim ayrıca uzun zamandır tanıdığım eski bir arkadaşım ile konuştum sanki. kesinlikle tavsiye ediyorum hanım efendinin güzel enerjisi ses tonu sorulara verdiği net ve öz cevaplar süperdi.'),
('abcdef01-0000-4000-8000-000000000002', 'abcdef00-0000-4000-8000-000000000002', 'tr', 'Enerjisi o kadar güzel ve huzur verici. Aklımdaki tüm soru işaretlerine sabırla ve net bir şekilde cevap verdi. Hem profesyonelliği hem de yaklaşımıyla kendimi çok iyi hissettirdi.'),
('abcdef01-0000-4000-8000-000000000003', 'abcdef00-0000-4000-8000-000000000003', 'tr', 'Bilginizin derinliği bir yana o kadar güven veren ve insanın içini rahatlatan bir enerjiniz var ki aşırı güzel bir doğum haritası bakımı gerçekleştirdik.'),
('abcdef01-0000-4000-8000-000000000004', 'abcdef00-0000-4000-8000-000000000004', 'tr', 'İşinin bu kadar ehli ve enerjisi bu kadar yüksek birisini görmemiştim. Önceliği danışanının memnuniyeti ve hayal satmıyor. Canı gönülden kendisini tavsiye ediyorum.'),
('abcdef01-0000-4000-8000-000000000005', 'abcdef00-0000-4000-8000-000000000005', 'tr', 'Bakımdan çok memnun kaldım çok tatlı bir enerjisi var sorularıma cevap buldum.'),
('abcdef01-0000-4000-8000-000000000006', 'abcdef00-0000-4000-8000-000000000006', 'tr', 'İnanılmaz güzel bir enerjisi var, analizleri çok yerinde ve öngörüleri müthiş. Kendisine çok teşekkür etmekle beraber bu yolda bana rehberlik etmesinden inanılmaz memnuniyet duyuyorum.'),
('abcdef01-0000-4000-8000-000000000007', 'abcdef00-0000-4000-8000-000000000007', 'tr', 'Çok güzel enerjisi ve yine nokta atışı tarihler ve yorumları için çok teşekkür ederim. Her zaman Fatma Hanım''dan danışmanlık aldıktan sonra içim rahatlıyor. Çok içten ve sizi anlayarak, haritanıza çok detaylı bakıp her sorunuzu incelikle yanıtlıyor. Ben hep danışıyorum, ve danışmaya devam edeceğim — herkese içtenlikle tavsiye ediyorum. Sevgilerimle.'),
('abcdef01-0000-4000-8000-000000000008', 'abcdef00-0000-4000-8000-000000000008', 'tr', 'Her meslek belli oranda hassasiyet, ince eleyip sık dokumak ve titizlik ister ama bazı meslekler daha fazla ister. Astrolojik danışmanlıkta onlardan birisi olsa gerek. Fatma hanım ise titizlik ve detay konusunda son derece hassas birisi, tavsiye ederim, kafasında acabalar olanlar için çok doğru bir tercih, ilgisi ve samimiyeti için tekrardan teşekkürler.'),
('abcdef01-0000-4000-8000-000000000009', 'abcdef00-0000-4000-8000-000000000009', 'tr', 'Gerçekten müthiş bir yorumlama nokta atışı tespitler harikaydı.'),
('abcdef01-0000-4000-8000-000000000010', 'abcdef00-0000-4000-8000-000000000010', 'tr', 'Fatma hanım''a pozitif enerjisi ve samimiyeti için tekrardan teşekkür ederim. Beni öncesinden tanıyormuşçasına danışmanlık süresinde geçmişteki yaşadıklarımı tarihler vererek nokta atışı yaptı. Detaylı bir şekilde sorularıma yanıt verip, öneriler ve öngörülerde bulundu. Zihnimdeki bulanıkların aydınlanmasına yardımcı oldu.'),
('abcdef01-0000-4000-8000-000000000011', 'abcdef00-0000-4000-8000-000000000011', 'tr', 'Fatma hanıma içtenliği, samimiyeti ve detaylı anlatım biçimi için teşekkür ederim. Danışmanlık esnasında adeta nokta atışları yapıp, sanki beni daha öncesinden tanıyormuşçasına yorumlar yaptı. Tavsiyeleri ve öngörüleri için kendisine tekrardan teşekkür ederim.'),
('abcdef01-0000-4000-8000-000000000012', 'abcdef00-0000-4000-8000-000000000012', 'tr', 'Kendisine çok teşekkür ederim benimle çok iyi ilgilendi emeklerine sağlık. Sorularıma içtenlikle cevap verdi. Bana verdiği tarihleri bekliyor olacağım.'),
('abcdef01-0000-4000-8000-000000000013', 'abcdef00-0000-4000-8000-000000000013', 'tr', 'Fatma hanımla ön görüşmemiz sonucunda nazik ve anlayışlı yaklaşımıyla beraber ilerleyen seansları kendisinden almam gerektiğine kesinlikle ikna oldum. Çok nazik ve duyarlı bir kişiliği ve tecrübesi var. Anlaşılmak ve kendinizle alakalı anlaşılmayan yerleri anlamak için tavsiye ederim.'),
('abcdef01-0000-4000-8000-000000000014', 'abcdef00-0000-4000-8000-000000000014', 'tr', 'Çok güzel ve harika bir danışmanlık aldım ve son derece motive edici bir danışmanlık hizmeti aldım. Kesinlikle tavsiye edebilirim. Çok teşekkür ederim Fatma Hanım.'),
('abcdef01-0000-4000-8000-000000000015', 'abcdef00-0000-4000-8000-000000000015', 'tr', 'Fatma Hanım''dan yeniden danışmanlık aldım ve yine bana çok iyi geldi. Yine her zamanki gibi çok tatlı, sıcak ve uzman yaklaşımıyla sorularımı dikkatlice ve detaylı şekilde, her yönden değerlendirdi. Hem pozitif enerjisi size geçiyor hem de verdiği tarihler ve detaylarla size yol gösteriyor. Kesinlikle herkese tavsiye ediyorum. Emeğine sağlık, sevgilerimle.'),
('abcdef01-0000-4000-8000-000000000016', 'abcdef00-0000-4000-8000-000000000016', 'tr', 'Fatma Hanım nevi şahsına münhasır mükemmel bir samimiyet ile hayatımda dair olanları ve olacakları o kadar net anlattı ki, bir yerlerden hayatımı izlediğini falan düşündüm bir ara. Bu kadar nokta atışı tespitler, doğum saatimi titizlikle sormuş olduğu sorulara verdiğim cevaplarla net tespit etmesi ve özellikle sormak istediğim soru hakkında neler planlıyorsam, ne kadar zamandır düşünüyorsam hepsini tek tek anlatarak beni şoke etmesi takdirlikti resmen. Hiç abartmıyorum şu an halen bu konuşmanın etkisindeyim ve 2 ay içinde olacakları söylediği her şeyi not aldım, kendisiyle tekrar iletişime geçeceğim sadece konuşmamız bile motivasyonumu arttırdı. Siz siz olun Fatma Hanım ile en az bir kere görüşün derim. Pişman olmayacaksınız. Yüreğinize sağlık.'),
('abcdef01-0000-4000-8000-000000000017', 'abcdef00-0000-4000-8000-000000000017', 'tr', 'Fatma Hanımdan 3 kere randevu aldım asla olmaz dediğim her şey tarihiyle beraber çıktı her şeyi açıklamalı bir şekilde anlatıyor herkese tavsiye ediyorum.'),
('abcdef01-0000-4000-8000-000000000018', 'abcdef00-0000-4000-8000-000000000018', 'tr', 'Fatma Hanım''ın enerjisini öncelikle ailece çok sevdik hatta benim danışmanlık randevum biter bitmez anında annem için de bir randevu aldım, rektifikasyon hizmetinden yararlandık ve ikimiz de çok memnun kaldık, gerek yaklaşımı gerek yorumları ve nokta atışlarıyla eline emeğine ağzına sağlık gönül rahatlığıyla danışmanlık için kendisine ulaşabilirsiniz.'),
('abcdef01-0000-4000-8000-000000000019', 'abcdef00-0000-4000-8000-000000000019', 'tr', 'Kendisi yolları gösteriyor. Böyle olursa böyle olur haberin olsun diyor. Teşekkür ederim.'),
('abcdef01-0000-4000-8000-000000000020', 'abcdef00-0000-4000-8000-000000000020', 'tr', 'Fatma hanım hem çok iyi bir dinleyici hem de müthiş bir enerjisi var. Astrologluğu ayrı insanlığı ayrı beş yıldız hak ediyor.'),
('abcdef01-0000-4000-8000-000000000021', 'abcdef00-0000-4000-8000-000000000021', 'tr', 'Fatma hanım çok iyi bir danışman gerek astrolojik bilgisi gerek tarot bilgisi ile soruma çok güzel cevap verdi ve yardımcı oldu. İnsanı rahatlatan ve mutlu eden çok güzel bir enerjisi var. Herkese tavsiye ediyorum.'),
('abcdef01-0000-4000-8000-000000000022', 'abcdef00-0000-4000-8000-000000000022', 'tr', 'Çok güzel bir seans oldu. Nokta atışlarıyla kafamdaki birçok sorunun cevabını verdi. Kendisine çok teşekkür ediyorum.'),
('abcdef01-0000-4000-8000-000000000023', 'abcdef00-0000-4000-8000-000000000023', 'tr', 'Fatma Hanım o kadar pozitif o kadar tatlı ki, öncelikle güzel enerjisiyle doldum diyebilirim. Tek soru danışmanlığı almama rağmen, süreci detaylıca anlatıp soru işareti bırakmadı. Gönlünüze ve emeğinize sağlık, tekrar danışmayı iple çekiyorum. Sevgi ve saygılarımla.'),
('abcdef01-0000-4000-8000-000000000024', 'abcdef00-0000-4000-8000-000000000024', 'tr', 'Çok samimi çok güzel bir seans oldu Fatma hanım çok detaylı bir şekilde aklımdaki bütün sorulara yanıt vererek ve beni dinleyerek çok yol gösterici oldu.'),
('abcdef01-0000-4000-8000-000000000025', 'abcdef00-0000-4000-8000-000000000025', 'tr', 'Çok güzel bir seans geçirdik. Detaylı güzel bir harita incelemesi yapıldı. Emeğinize sağlık.')
ON DUPLICATE KEY UPDATE comment = VALUES(comment);

-- consultants tablosundaki rating_avg + rating_count'u güncelle (sadece bu danışman için).
-- COLLATE: @FATMA (utf8mb4_0900_ai_ci) ile reviews.target_id (utf8mb4_unicode_ci) çakışmasını engeller.
UPDATE consultants SET
  rating_avg = (SELECT ROUND(AVG(rating), 2) FROM reviews
                WHERE target_type = 'consultant'
                  AND target_id COLLATE utf8mb4_unicode_ci = @FATMA COLLATE utf8mb4_unicode_ci
                  AND is_approved = 1 AND is_active = 1),
  rating_count = (SELECT COUNT(*) FROM reviews
                  WHERE target_type = 'consultant'
                    AND target_id COLLATE utf8mb4_unicode_ci = @FATMA COLLATE utf8mb4_unicode_ci
                    AND is_approved = 1 AND is_active = 1)
WHERE id COLLATE utf8mb4_unicode_ci = @FATMA COLLATE utf8mb4_unicode_ci;
