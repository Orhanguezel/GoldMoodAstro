-- =============================================================
-- 098_zodiac_kb_seed.sql
-- 12 Burç derin profilleri (kind='sign') + Aries örnek sign_section'lar
-- image_url storage_assets ile aynı path (141'de tanımlı zodiac PNG'leri)
-- =============================================================

INSERT INTO astrology_kb (id, kind, key1, key2, key3, locale, title, content, short_summary, tone, source, image_url) VALUES
-- Koç
(UUID(), 'sign', 'aries', NULL, NULL, 'tr', 'Koç Burcu (Aries)',
'Koç burcu, zodyakın ilk burcudur ve baharın başlangıcını simgeler. Ateş elementi ve öncü niteliktedir. Yönetici gezegeni Mars''tır. Koçlar cesur, enerjik, bağımsız ve maceracıdırlar. Yeni başlangıçların ve eylemin temsilcisidirler. Bir Koç için hayat, sürekli fethedilmesi gereken bir macera alanıdır. Sabırsızlıkları ve fevrilikleri gölge yanları olsa da, dürüstlükleri ve içtenlikleri onları vazgeçilmez kılar.',
'Cesur, enerjik ve öncü ruhlu Koç burcu, maceranın ve başlangıçların simgesidir.', 'warm', 'GoldMoodAstro Editorial', '/uploads/zodiac/aries.png'),
-- Boğa
(UUID(), 'sign', 'taurus', NULL, NULL, 'tr', 'Boğa Burcu (Taurus)',
'Boğa burcu, zodyakın ikinci burcudur ve toprağın en verimli halini temsil eder. Toprak elementi ve sabit niteliktedir. Yönetici gezegeni Venüs''tür. Boğalar sabırlı, güvenilir, pratik ve estetik değerlere düşkündürler. Maddi dünyadaki güzellikleri takdir etme ve onları koruma yetenekleri çok güçlüdür. Değişimden pek hoşlanmazlar ama sadakatleri ve dayanıklılıkları ile tanınırlar.',
'Sabırlı, güvenilir ve estetik tutkunu Boğa burcu, yaşamın somut güzelliklerini korur.', 'warm', 'GoldMoodAstro Editorial', '/uploads/zodiac/taurus.png'),
-- İkizler
(UUID(), 'sign', 'gemini', NULL, NULL, 'tr', 'İkizler Burcu (Gemini)',
'İkizler burcu, zodyakın üçüncü burcudur ve zihinsel çevikliği temsil eder. Hava elementi ve değişken niteliktedir. Yönetici gezegeni Merkür''dür. İkizler meraklı, iletişimci, uyumlu ve sosyaldirler. Bilgiye açlıkları onları her zaman yeni şeyler öğrenmeye ve paylaşmaya iter. Çabuk sıkılabilirler ama girdikleri her ortamda neşe ve hareketlilik yaratırlar.',
'Meraklı, iletişimci ve çok yönlü İkizler burcu, bilginin ve sosyal bağların temsilcisidir.', 'warm', 'GoldMoodAstro Editorial', '/uploads/zodiac/gemini.png'),
-- Yengeç
(UUID(), 'sign', 'cancer', NULL, NULL, 'tr', 'Yengeç Burcu (Cancer)',
'Yengeç burcu, zodyakın dördüncü burcudur ve duygusal derinliği simgeler. Su elementi ve öncü niteliktedir. Yönetici gezegeni Ay''dır. Yengeçler hassas, korumacı, sezgisel ve evcil bir yapıya sahiptirler. Aile ve geçmişle olan bağları çok güçlüdür. Dışarıdan sert görünebilirler (yengecin kabuğu gibi) ama içeride son derece yumuşak ve şefkatli bir ruh taşırlar.',
'Hassas, korumacı ve sezgisel Yengeç burcu, duygusal güvenliğin ve ailenin limanıdır.', 'warm', 'GoldMoodAstro Editorial', '/uploads/zodiac/cancer.png'),
-- Aslan
(UUID(), 'sign', 'leo', NULL, NULL, 'tr', 'Aslan Burcu (Leo)',
'Aslan burcu, zodyakın beşinci burcudur ve yaşam enerjisinin zirvesini temsil eder. Ateş elementi ve sabit niteliktedir. Yönetici gezegeni Güneş''tir. Aslanlar cömert, yaratıcı, özgüvenli ve lider ruhludur. İlgi odağı olmaktan ve takdir edilmekten hoşlanırlar. Kocaman bir kalpleri vardır ve sevdikleri için her türlü fedakarlığı yapmaya hazırdırlar.',
'Cömert, yaratıcı ve özgüvenli Aslan burcu, zodyakın parlayan yıldızı ve lideridir.', 'warm', 'GoldMoodAstro Editorial', '/uploads/zodiac/leo.png'),
-- Başak
(UUID(), 'sign', 'virgo', NULL, NULL, 'tr', 'Başak Burcu (Virgo)',
'Başak burcu, zodyakın altıncı burcudur ve analiz yeteneğini simgeler. Toprak elementi ve değişken niteliktedir. Yönetici gezegeni Merkür''dür. Başaklar titiz, çalışkan, pratik ve hizmet odaklıdırlar. Detaylara olan dikkatleri ve mükemmelleştirme arzuları onları harika birer problem çözücü yapar. Sağlık ve hijyen konularına önem verirler.',
'Titiz, çalışkan ve analizci Başak burcu, yaşamı daha verimli ve düzenli kılmak için çalışır.', 'warm', 'GoldMoodAstro Editorial', '/uploads/zodiac/virgo.png'),
-- Terazi
(UUID(), 'sign', 'libra', NULL, NULL, 'tr', 'Terazi Burcu (Libra)',
'Terazi burcu, zodyakın yedinci burcudur ve dengeyi temsil eder. Hava elementi ve öncü niteliktedir. Yönetici gezegeni Venüs''tür. Teraziler adil, diplomatik, estetik ve sosyal uyuma önem veren kişilerdir. İlişkiler onların hayatında merkezi bir yer tutar. Yalnız kalmaktan hoşlanmazlar ve her zaman barışçıl bir ortam yaratmaya çalışırlar.',
'Adil, diplomatik ve estetik duyarlı Terazi burcu, dengenin ve ikili ilişkilerin ustasıdır.', 'warm', 'GoldMoodAstro Editorial', '/uploads/zodiac/libra.png'),
-- Akrep
(UUID(), 'sign', 'scorpio', NULL, NULL, 'tr', 'Akrep Burcu (Scorpio)',
'Akrep burcu, zodyakın sekizinci burcudur ve dönüşümü simgeler. Su elementi ve sabit niteliktedir. Yönetici gezegenleri Mars ve Plüton''dur. Akrepler derin, tutkulu, gizemli ve son derece dirençlidirler. Yüzeydekiyle yetinmezler, her şeyin en derinine inmek isterler. Krizlerden güçlenerek çıkma yetenekleri benzersizdir.',
'Derin, tutkulu ve dönüşümün gücünü taşıyan Akrep burcu, zodyakın en gizemli ve dirençli burcudur.', 'warm', 'GoldMoodAstro Editorial', '/uploads/zodiac/scorpio.png'),
-- Yay
(UUID(), 'sign', 'sagittarius', NULL, NULL, 'tr', 'Yay Burcu (Sagittarius)',
'Yay burcu, zodyakın dokuzuncu burcudur ve keşif arzusunu temsil eder. Ateş elementi ve değişken niteliktedir. Yönetici gezegeni Jüpiter''dir. Yaylar iyimser, özgürlükçü, felsefi ve maceracıdırlar. Sürekli yeni ufuklar ararlar, hem fiziksel hem de zihinsel olarak seyahat etmeyi severler. Dürüstlükleri bazen patavatsızlığa varsa da kalpleri her zaman iyilikten yanadır.',
'İyimser, özgürlükçü ve macera tutkunu Yay burcu, anlam arayışının ve keşfin temsilcisidir.', 'warm', 'GoldMoodAstro Editorial', '/uploads/zodiac/sagittarius.png'),
-- Oğlak
(UUID(), 'sign', 'capricorn', NULL, NULL, 'tr', 'Oğlak Burcu (Capricorn)',
'Oğlak burcu, zodyakın onuncu burcudur ve zirveye giden yolu simgeler. Toprak elementi ve öncü niteliktedir. Yönetici gezegeni Satürn''dür. Oğlaklar disiplinli, sabırlı, hırslı ve sorumluluk sahibidirler. Hayatta somut başarılar elde etmek ve toplumsal statü kazanmak onlar için önemlidir. Dağın zirvesine emin adımlarla tırmanan keçiler gibi, hedeflerine ulaşmakta son derece kararlıdırlar.',
'Disiplinli, hırslı ve sorumluluk sahibi Oğlak burcu, başarıya giden sabırlı yolculuğun simgesidir.', 'warm', 'GoldMoodAstro Editorial', '/uploads/zodiac/capricorn.png'),
-- Kova
(UUID(), 'sign', 'aquarius', NULL, NULL, 'tr', 'Kova Burcu (Aquarius)',
'Kova burcu, zodyakın on birinci burcudur ve geleceği temsil eder. Hava elementi ve sabit niteliktedir. Yönetici gezegenleri Satürn ve Uranüs''tür. Kovalar özgün, bağımsız, hümanist ve entelektüeldirler. Toplumun genel geçer kurallarını sorgular ve her zaman daha ilerici çözümler üretirler. Arkadaşlık ve kolektif projeler hayatlarında önemli bir yer tutar.',
'Özgün, hümanist ve bağımsız Kova burcu, geleceğin vizyonunu ve toplumsal değişimi taşır.', 'warm', 'GoldMoodAstro Editorial', '/uploads/zodiac/aquarius.png'),
-- Balık
(UUID(), 'sign', 'pisces', NULL, NULL, 'tr', 'Balık Burcu (Pisces)',
'Balık burcu, zodyakın on ikinci ve son burcudur; tüm burçların deneyimini içinde barındırır. Su elementi ve değişken niteliktedir. Yönetici gezegenleri Jüpiter ve Neptün''dür. Balıklar şefkatli, hayalperest, sezgisel ve fedakardır. Maddi dünya ile manevi dünya arasında bir köprü gibidirler. Sanatsal yetenekleri ve evrensel bir sevgi anlayışları vardır.',
'Şefkatli, sezgisel ve hayalperest Balık burcu, evrensel sevginin ve ruhsal derinliğin limanıdır.', 'warm', 'GoldMoodAstro Editorial', '/uploads/zodiac/pisces.png')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  content = VALUES(content),
  short_summary = VALUES(short_summary),
  image_url = VALUES(image_url);

-- =============================================================
-- Sign Sections (Aries Example — şablon, astrolog kalan 11×5 = 55 satır ekleyecek)
-- =============================================================
INSERT INTO astrology_kb (id, kind, key1, key2, key3, locale, title, content, short_summary, tone, source, image_url) VALUES
(UUID(), 'sign_section', 'aries', 'personality', NULL, 'tr', 'Koç Burcu Kişilik Özellikleri',
'Koç burcu bireyleri, zodyakın çocukları gibidirler; saf bir enerji ve bitmek bilmeyen bir yaşam sevinci ile doludurlar. Dürüstlük onlar için en temel erdemdir. Ne hissediyorlarsa onu söylerler ve maske takmaktan nefret ederler. Cesaretleri, başkalarının geri durduğu yerlerde onların öne atılmasını sağlar. Ancak bu cesaret bazen düşüncesizce risk almalarına da neden olabilir.',
'Koç burcunun temel kişilik özellikleri: dürüstlük, cesaret ve saf enerji.', 'warm', 'GoldMoodAstro Editorial', NULL),

(UUID(), 'sign_section', 'aries', 'love', NULL, 'tr', 'Koç Burcu ve Aşk',
'Aşkta Koç, tutkulu ve doğrudan bir yaklaşım sergiler. Birini beğendiklerinde bunu gizlemezler ve fethetmek için ellerinden geleni yaparlar. İlişkilerinde heyecan ve macera ararlar. Sadıktırlar ancak kısıtlanmaktan hoşlanmazlar. Onlar için aşk, her gün yeniden keşfedilmesi gereken bir ateştir.',
'Koç burcunun aşk hayatı: tutku, heyecan ve doğrudanlık.', 'warm', 'GoldMoodAstro Editorial', NULL),

(UUID(), 'sign_section', 'aries', 'career', NULL, 'tr', 'Koç Burcu ve Kariyer',
'İş hayatında Koçlar, doğal liderlik vasıflarıyla öne çıkarlar. Emir almaktan ziyade emir vermeyi veya kendi işlerinin patronu olmayı tercih ederler. Rekabetçi ortamlar onları motive eder. Bir projeyi başlatmakta ustadırlar ancak detaylarla uğraşmak ve bitirmek konusunda sabırsız olabilirler. Girişimcilik, spor ve askeri alanlar onlar için idealdir.',
'Koç burcunun kariyer yolu: liderlik, rekabet ve girişimcilik.', 'warm', 'GoldMoodAstro Editorial', NULL)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  content = VALUES(content),
  short_summary = VALUES(short_summary);
