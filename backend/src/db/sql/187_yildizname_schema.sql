-- =============================================================
-- 187_yildizname_schema.sql
-- FAZ 24 / T24-1 — Yıldızname (Ebced)
-- Türk-İslam yıldızname geleneği: ad + anne adı + DOB → ebced sayısı
-- → mod 28 → 28 Ay Menzili'nden biri → yorum.
-- =============================================================

CREATE TABLE IF NOT EXISTS yildizname_results (
  id CHAR(36) PRIMARY KEY,
  menzil_no TINYINT NOT NULL,             -- 1..28 (Ay menzilleri)
  name_ar VARCHAR(50) NOT NULL,           -- Arapça menzil adı (Şeretan, Butayn, Süreyya, vs.)
  name_tr VARCHAR(80) NOT NULL,           -- Türkçe karşılık
  short_summary VARCHAR(255),             -- 1 cümle özet (UI kart)
  content TEXT NOT NULL,                  -- Yorumlu metin (200-400 kelime)
  category JSON,                          -- ["aşk","iş","seyahat","sağlık"]
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY yildizname_results_menzil_uq (menzil_no),
  KEY yildizname_results_active_idx (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS yildizname_readings (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),                                -- nullable (misafir)
  guest_session_id VARCHAR(100),
  name VARCHAR(120) NOT NULL,
  mother_name VARCHAR(120) NOT NULL,
  birth_year SMALLINT NOT NULL,
  ebced_total INT NOT NULL,
  menzil_no TINYINT NOT NULL,
  result_text TEXT,                                 -- yildizname_results.content kopyası
  llm_extra TEXT,                                   -- harita ile harmanlanmış 300 kelime ek (opsiyonel)
  locale CHAR(8) NOT NULL DEFAULT 'tr',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY yildizname_readings_user_idx (user_id),
  KEY yildizname_readings_menzil_idx (menzil_no),
  CONSTRAINT fk_yildizname_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 28 Ay Menzili seed (klasik İslam astronomi geleneği) ────────────────
-- Her menzil bir kategori temasıyla anılır. Astrolog ileride yorumları derinleştirecek;
-- şimdilik kısa baseline metinler — admin /admin/astrology-kb veya ileride özel bir editor.
INSERT INTO yildizname_results (id, menzil_no, name_ar, name_tr, short_summary, content, category) VALUES
('a0000000-0000-4000-8000-000000000001', 1, 'Şeretan', 'Koç Burnu',
 'Atılganlık, yeni başlangıç, cesaret menzili.',
 'Bu menzilde doğan veya bu menzile düşen kişi, doğal bir başlatıcıdır. Hayatta cesur kararlar alır, harekete geçmek için uzun düşünmez. Yeni dönemler ve fırsatlar için elverişli zaman; eski takıntıları geride bırakmak kolaydır.', '["başlangıç","cesaret","iş"]'),
('a0000000-0000-4000-8000-000000000002', 2, 'Butayn', 'Karın',
 'İçsel taşıma, gizli güç, sabırla olgunlaşma.',
 'Bu menzil görünür olmayan içsel bir taşımayı simgeler. Gerçek değerin ortaya çıkması zaman alır ama sağlam temele oturur. Hamile olanlar için, projelerini olgunlaştıranlar için elverişli.', '["sabır","içe dönüş","aile"]'),
('a0000000-0000-4000-8000-000000000003', 3, 'Süreyya', 'Ülker Yıldızı',
 'Bolluk, koruma, manevi destek menzili.',
 'Süreyya yıldız kümesi, halk inancında nazardan koruyan, kısmet açan menzildir. Bu menzile düşenler için maddi/manevi bolluk akışı kolaydır; sevdiklerinin koruması üzerlerinde hissedilir.', '["bolluk","koruma","aile"]'),
('a0000000-0000-4000-8000-000000000004', 4, 'Debaran', 'Boğa Gözü',
 'Sebat, istikrar, somut başarı menzili.',
 'Aldebaran yıldızı bu menzilin merkezindedir; klasik gelenekte "gerçek olanı görmek" temasıyla anılır. Bu menzile düşenler kararlı, sebatkar ve uzun vadede başarılıdır.', '["istikrar","kararlılık","iş"]'),
('a0000000-0000-4000-8000-000000000005', 5, 'Hekaa', 'Üç Yıldız',
 'Hareket, yolculuk, yeni ufuklar menzili.',
 'Bu menzil seyahat, taşınma ve fiziksel yer değişikliği temasıyla anılır. Bu menzile düşenler için yola çıkmak, yeni bir şehir/ülke tanımak elverişlidir.', '["seyahat","yenilik","iş"]'),
('a0000000-0000-4000-8000-000000000006', 6, 'Hena', 'İkizler Eli',
 'İletişim, bağlantı, yeni tanışıklar menzili.',
 'Sosyal ilişkiler, yeni dostluklar ve önemli iletişimlerin yoğunlaştığı bir menzil. Anlaşmalar, sözleşmeler ve müzakereler için elverişli zaman.', '["iletişim","sosyal","iş"]'),
('a0000000-0000-4000-8000-000000000007', 7, 'Zira', 'Aslan Pençesi',
 'Görünür güç, otorite, liderlik menzili.',
 'Bu menzile düşenler için kabul görme, takdir edilme ve liderlik fırsatları yakındır. Sahnenin tam ortasında olmak için elverişli.', '["liderlik","görünürlük","kariyer"]'),
('a0000000-0000-4000-8000-000000000008', 8, 'Nesre', 'Kartal',
 'Yükseliş, geniş bakış, vizyon menzili.',
 'Bir adım geri çekilip büyük resmi görmek için ideal menzil. Stratejik kararlar, uzun vadeli planlar ve kişisel yükseliş için zaman.', '["vizyon","strateji","kariyer"]'),
('a0000000-0000-4000-8000-000000000009', 9, 'Tarf', 'Bakış',
 'Net görüş, gerçeği fark etme menzili.',
 'Yanılsamaların eridiği, gerçeğin daha net göründüğü bir dönem. İlişkilerde maskesi düşen ne varsa fark edilir; bu zorlu ama özgürleştirici bir menzildir.', '["farkındalık","ilişki","gerçek"]'),
('a0000000-0000-4000-8000-000000000010', 10, 'Cebhe', 'Alın',
 'İrade, kararlılık, doğrudanlık menzili.',
 'Cebhe alın anlamına gelir — önemli bir karar verme, doğrudan davranma ve niyetini açıkça ortaya koyma zamanı. Erteleme zamanı değil.', '["karar","irade","iş"]'),
('a0000000-0000-4000-8000-000000000011', 11, 'Zübra', 'Sırt',
 'Yük taşıma, sorumluluk, dayanıklılık menzili.',
 'Bu menzil dayanıklılık ve sorumluluk üstlenme temasıyla anılır. Zorlu bir dönem geçirmek bile olsa, taşıyabilecek güç içinizde.', '["sorumluluk","dayanıklılık","aile"]'),
('a0000000-0000-4000-8000-000000000012', 12, 'Sarfe', 'Çevrilme',
 'Dönüşüm, eski olandan ayrılma menzili.',
 'Bir döngünün tamamlanıp yenisinin başladığı eşik. Eski alışkanlıklar, ilişkiler veya işlerden ayrılmak için elverişli zaman; yeniye yer açılır.', '["dönüşüm","bırakma","yenilik"]'),
('a0000000-0000-4000-8000-000000000013', 13, 'Avva', 'Havlama',
 'Sesini duyurma, ifade, yaratıcılık menzili.',
 'Susmuş olanı söylemek, içte tutulanı ifade etmek için ideal menzil. Yaratıcı projeler, yazı, müzik ve sanat için elverişli.', '["ifade","yaratıcılık","sosyal"]'),
('a0000000-0000-4000-8000-000000000014', 14, 'Simak', 'Yüksek',
 'Zirve, başarıya yaklaşma, teslim olma menzili.',
 'Uzun çabaların meyvesini verdiği menzil. Ancak zirvede teslim olma — kibre kapılmamak, alçakgönüllülüğü korumak önemli.', '["başarı","zirve","kariyer"]'),
('a0000000-0000-4000-8000-000000000015', 15, 'Gafr', 'Örtü',
 'Sığınma, içe çekilme, dinlenme menzili.',
 'Bu menzil bir geçici sığınmayı simgeler. Yorgunluk birikmişse mola alma zamanı; içsel toparlanma için elverişli.', '["dinlenme","içsel","sağlık"]'),
('a0000000-0000-4000-8000-000000000016', 16, 'Zubana', 'Terazi Kefesi',
 'Denge arayışı, adalet, ilişki menzili.',
 'İki uç arasında orta yolu bulmak, adil olmak ve ilişkide denge kurmak için elverişli. Karar vermek için soğukkanlılık önemli.', '["denge","ilişki","adalet"]'),
('a0000000-0000-4000-8000-000000000017', 17, 'İklil', 'Taç',
 'Onurlandırma, takdir görme, statü menzili.',
 'Sosyal kabul, ödül, terfi gibi takdir işaretlerinin yakın olduğu menzil. Kendine olan saygıyı yenilemek için iyi zaman.', '["takdir","statü","kariyer"]'),
('a0000000-0000-4000-8000-000000000018', 18, 'Kalb', 'Akrep Kalbi',
 'Yoğun duygu, derin bağ, dönüştürücü ilişki menzili.',
 'Antares yıldızı bu menzilin merkezindedir. Yoğun duygusal anlar, derin bağlar veya ilişkide dönüştürücü deneyimler için zaman. Yüzeyde kalmak zor.', '["aşk","derinlik","dönüşüm"]'),
('a0000000-0000-4000-8000-000000000019', 19, 'Şevle', 'Akrep İğnesi',
 'Keskin gerçek, uyarı, dikkat menzili.',
 'Bu menzil bir uyarıyı simgeler — bir konuda dikkat eksikliği veya görmezden gelinen bir gerçek var. Yüzleşmenin zamanı.', '["uyarı","farkındalık","sağlık"]'),
('a0000000-0000-4000-8000-000000000020', 20, 'Naaim', 'Devekuşları',
 'Hız, koşu, hedef peşinde menzil.',
 'Hareketli, hızlı, amaca odaklı bir dönem. Tek bir yolda inatla ilerlemek için elverişli; çoklu görevden uzak dur.', '["odak","hız","iş"]'),
('a0000000-0000-4000-8000-000000000021', 21, 'Belde', 'Boş Yer',
 'Belirsizlik, ara dönem, beklenti menzili.',
 'Ne eskinin ne de yeninin olduğu bir geçiş alanı. Acele karar verme, sezgilerini dinle ve anı kabul et.', '["ara dönem","sabır","içsel"]'),
('a0000000-0000-4000-8000-000000000022', 22, 'Sad-z-zabih', 'Kurban Şanslısı',
 'Sınama, fedakarlık, derin öğreti menzili.',
 'Bu menzil bir sınamayı ve sonrasında derin bir öğretiyi simgeler. Zor ama ruhu olgunlaştıran bir dönem.', '["sınama","öğreti","içsel"]'),
('a0000000-0000-4000-8000-000000000023', 23, 'Sad-bula', 'Yutma Şanslısı',
 'Affetme, kapatma, içselleştirme menzili.',
 'Geçmişin acısını affetme, geride bırakma ve içselleştirme zamanı. Kendini de affetmek bu menzilin ana mesajı.', '["af","kapatma","içsel"]'),
('a0000000-0000-4000-8000-000000000024', 24, 'Sad-süud', 'Şansların Şanslısı',
 'Kısmet açılması, müjdeli haber menzili.',
 'Halk inancında en şanslı menzillerden biri. Maddi/manevi açılma, beklenmedik müjde, sürpriz haber için elverişli.', '["şans","müjde","bolluk"]'),
('a0000000-0000-4000-8000-000000000025', 25, 'Sad-ahbiye', 'Çadırların Şanslısı',
 'Yuva, aile, kök salma menzili.',
 'Ev kurma, taşınma, evlenme veya aileye yeni bir üye ekleme için elverişli menzil. Köklenme zamanı.', '["aile","yuva","istikrar"]'),
('a0000000-0000-4000-8000-000000000026', 26, 'Mukaddem', 'Ön',
 'Hazırlık, tohum atma menzili.',
 'Yakın geleceğe hazırlık dönemi. Şu an atılan tohumlar, önümüzdeki menzilde meyvesini verir. Sabır ve özen önemli.', '["hazırlık","planlama","iş"]'),
('a0000000-0000-4000-8000-000000000027', 27, 'Müahhar', 'Son',
 'Tamamlama, son rötuş, kapanış menzili.',
 'Açık kalanı kapatmak, bir döngüyü bilinçli sonlandırmak için ideal menzil. Net bir vedaya zaman ayırın.', '["kapanış","tamamlama","ilişki"]'),
('a0000000-0000-4000-8000-000000000028', 28, 'Reşa', 'Bağlanan İp',
 'Dayanışma, bağlılık, ortak amaç menzili.',
 'Tek başına değil — bir topluluk, dostluk veya ortaklık ile birlikte hareket etmek için elverişli menzil. Birlik gücü.', '["dayanışma","ortaklık","sosyal"]')
ON DUPLICATE KEY UPDATE
  name_tr = VALUES(name_tr),
  short_summary = VALUES(short_summary),
  content = VALUES(content),
  category = VALUES(category);
