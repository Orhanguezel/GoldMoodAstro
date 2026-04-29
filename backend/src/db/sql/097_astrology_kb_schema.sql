-- =============================================================
-- 097_astrology_kb_schema.sql
-- Astrolog ekibi tarafından yazılan / küratör edilen
-- "altın metinler" — gezegen×burç, gezegen×ev, açı, vs.
-- LLM bu metinleri "knowledge base" olarak kullanır,
-- kullanıcıya kişiselleştirilmiş yorum üretir (hibrit yaklaşım).
-- =============================================================

CREATE TABLE IF NOT EXISTS astrology_kb (
  id CHAR(36) PRIMARY KEY,

  -- Kombinasyon türü
  kind ENUM(
    'planet_sign',
    'planet_house',
    'sign_house',
    'aspect',
    'sign',
    'house',
    'planet',
    'transit',
    'synastry',
    'sign_section',
    'misc'
  ) NOT NULL,

  -- Anahtar bileşenleri (kind'a göre dolu/boş)
  -- planet_sign:    key1=planet (sun..pluto), key2=sign (aries..pisces)
  -- planet_house:   key1=planet,             key2=house (1..12)
  -- aspect:         key1=planet_a, key2=planet_b, key3=aspect_type (conjunction, sextile, square, trine, opposition)
  key1 VARCHAR(40) NOT NULL,
  key2 VARCHAR(40),
  key3 VARCHAR(40),

  locale VARCHAR(8) NOT NULL DEFAULT 'tr',

  -- İçerik
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,           -- Astrolog metni (markdown destekli)
  short_summary VARCHAR(500),      -- 1-2 cümle özet (UI tooltip için)

  -- Metin tonu — LLM prompt'una iletilir
  tone ENUM('neutral','warm','professional','poetic','direct') NOT NULL DEFAULT 'warm',

  -- Embedding (Anthropic veya OpenAI'den hesaplanır, anti-copy-paste için)
  embedding JSON,

  -- Atıf bilgisi (Wikipedia, klasik kitap vs.)
  source VARCHAR(255),
  author VARCHAR(120),

  -- Görsel (sign için zodyak ikonu, planet için gezegen sembolü vb.)
  -- Path: storage_assets.public_url ile aynı (örn. /uploads/zodiac/aries.png)
  image_url VARCHAR(500),

  is_active TINYINT NOT NULL DEFAULT 1,
  reviewed_by CHAR(36),    -- astrolog user_id (FK opsiyonel)
  reviewed_at DATETIME(3),

  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  UNIQUE KEY astrology_kb_combo_uq (kind, key1, key2, key3, locale),
  KEY astrology_kb_lookup_idx (kind, key1, key2, locale, is_active),
  KEY astrology_kb_active_idx (is_active, kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Seed: küçük başlangıç seti (12 gezegen+burç + 5 açı + 3 ev) ───
-- Astrolog ekibi sonradan admin panelden tamamlayacak.
INSERT INTO astrology_kb (id, kind, key1, key2, key3, locale, title, content, short_summary, tone, source) VALUES
-- Güneş yerleşimleri (12 burç)
('80000000-0000-4000-8000-000000000001','planet_sign','sun','aries',NULL,'tr','Güneş Koç''ta','Cesaret, başlangıç enerjisi ve kendi yolunu çizme arzusu sende doğal. Yeni bir şeye atılmadan önce uzun düşünmek seni sıkar; eylem, en güçlü öğretmenin. Liderlik damarın açıkça görünür — kimse söylemese bile öne geçerken sezgisel hareket edersin.','Cesur, başlangıç enerjili, doğal lider eğilimli.','warm',NULL),
('80000000-0000-4000-8000-000000000002','planet_sign','sun','taurus',NULL,'tr','Güneş Boğa''da','İstikrar, somut güzellik ve kendi tempon senin için kutsal. Acele edenlere kuşkuyla bakar, kendi ritminde ilerlemekten vazgeçmezsin. Sevgi, para, doğa — beş duyunla deneyimlediklerinde gerçek olan ne varsa, hayatının zemini odur.','İstikrarlı, duyusal, kendi ritmiyle ilerleyen.','warm',NULL),
('80000000-0000-4000-8000-000000000003','planet_sign','sun','gemini',NULL,'tr','Güneş İkizler''de','Merak, sözcükler ve bağlantı — üç direktekisi. Her konuyu öğrenebilirsin ama bir konuya kilitlenmek seni boğar. Hayatına çeşit, esneklik ve sürekli yeni soru gerek; tekdüzelik ruhunu söndürür.','Meraklı, çok yönlü, iletişimi seven.','warm',NULL),
('80000000-0000-4000-8000-000000000004','planet_sign','sun','cancer',NULL,'tr','Güneş Yengeç''te','Duygusal hafıza, aile ve aidiyet seni temellendirir. Hisset­tiklerini gizleyebilirsin ama hiç unutmazsın. En güçlü olduğun an, sevdiklerinle bir yuva — fiziksel ya da duygusal — kurarken.','Duygusal hafıza güçlü, korumacı, aidiyet odaklı.','warm',NULL),
('80000000-0000-4000-8000-000000000005','planet_sign','sun','leo',NULL,'tr','Güneş Aslan''da','İçinde ışık vermesi gereken bir yan var — sahnenin senin olduğu hissi sebepsiz değil. Kibirden değil, hak ettiğin için fark edilmek istersin. Cömert kalbin, ne zaman bilirsen, en büyük gücün.','Cömert, görünmek isteyen, sıcak ışıklı.','warm',NULL),
('80000000-0000-4000-8000-000000000006','planet_sign','sun','virgo',NULL,'tr','Güneş Başak''ta','Detay, hizmet ve mükemmelleşme arzusu. Bir işi düzgün yapmadan rahat edemezsin; bu sıkıcılık değil, içsel bir vazifedir. Eleştirin önce kendine — bu yüzden başkalarına sert görünebilirsin.','Detay sevgisi, iş ahlakı, sürekli iyileştirme.','warm',NULL),
('80000000-0000-4000-8000-000000000007','planet_sign','sun','libra',NULL,'tr','Güneş Terazi''de','Denge, estetik ve ilişki — üç kalbinin atışı. Tek başına olduğunda bile birinin gözünden bakarsın. Karar verirken iki yönü de görmen seni adil yapar; ama bu seni bazen kararsız da gösterir.','İlişkisel, estetik duyarlı, denge arayan.','warm',NULL),
('80000000-0000-4000-8000-000000000008','planet_sign','sun','scorpio',NULL,'tr','Güneş Akrep''te','Yüzeyle yetinmezsin — gerçek, her şeyin altındadır ve sen oraya gider­sin. Yoğun bağlanır, yoğun yaşarsın. Yıkım ve yeniden doğuş, hayatının ritmidir; bunu reddetmek yerine kabul ettiğinde dönüştürüyorsun.','Derin, dönüştürücü, yoğun bağlanan.','warm',NULL),
('80000000-0000-4000-8000-000000000009','planet_sign','sun','sagittarius',NULL,'tr','Güneş Yay''da','Ufuk, anlam ve özgürlük seni çağırır. Sıkışan kimseyle uzun kalmazsın; bedeninle ya da zihninle her zaman uzaklara gider, sınırları zorlarsın. Felsefe, seyahat, eğitim — büyümen orada.','Geniş ufuklu, özgürlüğüne düşkün, anlam arayan.','warm',NULL),
('80000000-0000-4000-8000-000000000010','planet_sign','sun','capricorn',NULL,'tr','Güneş Oğlak''ta','Disiplin, sorumluluk ve uzun vade — ciddiyetin lüks değil, kişiliğin. Genç yaştan olgun görünürsün; yaşlandıkça hafifleyip eğlenmeyi keşfedersin. Hedefe inatla yürürsün, geç kalmaktan korkmazsın.','Disiplinli, hedef odaklı, uzun vadeli.','warm',NULL),
('80000000-0000-4000-8000-000000000011','planet_sign','sun','aquarius',NULL,'tr','Güneş Kova''da','Sıradan kabul edilenleri sorgulamak, fark olduğun her noktada doğal. Toplulukla ilgilenirsin ama kalabalığın dilinden konuşmazsın. Geleceği bugünden okuyorsun — bu yüzden bazen yanlış anlaşılırsın.','Özgün, sorgulayan, geleceğe bakan.','warm',NULL),
('80000000-0000-4000-8000-000000000012','planet_sign','sun','pisces',NULL,'tr','Güneş Balık''ta','Sınırların geçirgen — hem güzelliği hem ağırlığı içine alırsın. Yaratıcı, sezgisel ve şefkatlisin. Kendini kaybetmemek için zaman zaman fiziksel sınırlar koymayı öğrenmen gerekiyor.','Sezgisel, şefkatli, yaratıcı, geçirgen.','warm',NULL),

-- Önemli açılar (sınırlı seed — astrolog 30+ açı kombinasyonu için yazacak)
('80000000-0000-4000-8000-000000000020','aspect','sun','moon','trine','tr','Güneş ↔ Ay (uyumlu açı)','İçindeki "yapmam gereken" ile "hissetmek istediğim" çoğu zaman aynı yöne bakar. Kendin olmakta zorlanmazsın; rasyonel kararların duygusal ihtiyaçlarınla genelde örtüşür.','Düşüncen ve hissin uyumlu.','warm',NULL),
('80000000-0000-4000-8000-000000000021','aspect','sun','moon','square','tr','Güneş ↔ Ay (gerilim açı)','İçinde iki ses sürekli pazarlık ediyor: "şunu yapmalıyım" ile "ama ben bunu hissetmiyorum". Bu gerilim sıkıcı görünebilir, oysa derin bir farkındalığın motorudur — hem aklını hem kalbini hesaba katmayı öğreniyorsun.','Akıl ve kalp arası gerilimi dönüştürebilen.','warm',NULL),
('80000000-0000-4000-8000-000000000022','aspect','mars','saturn','square','tr','Mars ↔ Satürn (gerilim açı)','"Hemen harekete geç" dürtün ile "düşün, plan yap" sesin sürekli çatışıyor. Bu çatışma seni acele kararlardan korur ama bazen seni felç eder. Zamanla, eylem ile sabır arasında kendi dengeni bulmayı öğreniyorsun.','Eylem ve sabır arasındaki gerilim.','professional',NULL),
('80000000-0000-4000-8000-000000000023','aspect','venus','jupiter','sextile','tr','Venüs ↔ Jüpiter (uyumlu açı)','Sevgi ifade etmek senin için doğal. Cömertsin, sevdiklerine bolca verirsin; karşılıksız vermek ruhunu doyurur. Hayatın güzel anlarını görmeye yatkınsın — bu tesadüf değil, bir yetenek.','Cömert, hayatın güzelliğini gören.','warm',NULL),
('80000000-0000-4000-8000-000000000024','aspect','sun','pluto','conjunction','tr','Güneş ⊕ Plüton (kavuşum)','Kimliğin yoğun bir dönüştürücü güçle iç içe. Hayatında yıkımlar ve yeniden doğuşlar olağan; her krizden farklı bir benlikle çıkıyorsun. İktidar dinamikleri seni hem cezbeder hem ister-istemez sınar.','Dönüşüm yoluyla tanımlanan kimlik.','direct',NULL),

-- Önemli ev seed'i
('80000000-0000-4000-8000-000000000040','sign_house','scorpio','8',NULL,'tr','Akrep 8. ev''de','8. ev, dönüşüm, ortak kaynaklar ve gizli olanın evi. Akrep buradayken bu temalar daha da yoğun: derin ilişkiler, miras, krizden çıkış senin doğal toprağın. Yüzeyde kalmak seni rahatsız eder; gerçek olanı görme içtepin var.','Derin dönüşüm alanı.','professional',NULL)

ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  content = VALUES(content),
  short_summary = VALUES(short_summary);
