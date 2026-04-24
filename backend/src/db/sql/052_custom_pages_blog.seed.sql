-- =============================================================
-- FILE: 052_custom_pages_blog.seed.sql (FINAL / FULL / NO DROP)
-- Energetische Massage — Blog (6 posts) — module_key='blog'
-- ✅ custom_pages: module_key only in parent
-- ✅ custom_pages_i18n: module_key YOK
-- ✅ TR / EN / DE
-- ✅ content: LONGTEXT JSON-string {"html":"..."}
-- ✅ images/storage_image_ids: LONGTEXT JSON-string
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

START TRANSACTION;

-- -------------------------------------------------------------
-- COMMON
-- -------------------------------------------------------------
SET @MODULE_KEY := 'blog';
SET @EMPTY_ARR := '[]';

-- =============================================================
-- BLOG POST #1 — Colon cleansing / gut health
-- =============================================================
SET @PAGE_BLOG_1 := '22222222-2222-3333-4444-555555555501';
SET @IMG_BLOG_1  := 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1754079840/uploads/anastasia/blog-images/chatgpt-image-1-aau-2025-222332-1754079838699-746555796.webp';
SET @IMAGES_1 := CONCAT('["', REPLACE(@IMG_BLOG_1, '"', '\"'), '"]');

INSERT INTO `custom_pages`
(`id`,`module_key`,`is_published`,`featured`,`display_order`,`order_num`,
 `featured_image`,`featured_image_asset_id`,
 `image_url`,`storage_asset_id`,
 `images`,`storage_image_ids`,
 `created_at`,`updated_at`)
VALUES
(@PAGE_BLOG_1,@MODULE_KEY,1,1,110,110,
 @IMG_BLOG_1,NULL,
 @IMG_BLOG_1,NULL,
 @IMAGES_1,@EMPTY_ARR,
 NOW(3),NOW(3))
ON DUPLICATE KEY UPDATE
  `module_key`        = VALUES(`module_key`),
  `is_published`      = VALUES(`is_published`),
  `featured`          = VALUES(`featured`),
  `display_order`     = VALUES(`display_order`),
  `order_num`         = VALUES(`order_num`),
  `featured_image`    = VALUES(`featured_image`),
  `image_url`         = VALUES(`image_url`),
  `images`            = VALUES(`images`),
  `storage_image_ids` = VALUES(`storage_image_ids`),
  `updated_at`        = VALUES(`updated_at`);

-- I18N — BLOG #1 (TR/EN/DE)
INSERT INTO `custom_pages_i18n`
(`id`,`page_id`,`locale`,`title`,`slug`,`content`,`summary`,
 `featured_image_alt`,`meta_title`,`meta_description`,`tags`,
 `created_at`,`updated_at`)
VALUES
(
  UUID(),
  @PAGE_BLOG_1,
  'tr',
  'Kolon Temizliği: Bağırsak Sağlığının ve İkinci Beynin Önemi',
  'kolon-temizligi-bagirsak-sagligi',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Bağırsak Sağlığı ve "İkinci Beyin"</h2>',
      '<p>Bağırsaklarımız çoğu zaman "vücudun ikinci beyni" olarak anılır. Çünkü sindirim dışında; bağışıklık, enerji düzeyi, ruh hâli ve cilt sağlığı gibi birçok alanı etkileyen karmaşık bir denge sistemine sahiptir.</p>',

      '<h3>Asidik beslenme ve yük birikimi</h3>',
      '<p>Zaman içinde bağırsaklarda çeşitli toksinler birikebilir. Şeker, beyaz un, ultra işlenmiş ürünler ve gazlı içecekler gibi asidik beslenme alışkanlıkları bu dengenin bozulmasına katkı sağlayabilir.</p>',

      '<h3>Doğal destek önerileri</h3>',
      '<ol>',
      '<li><strong>Su:</strong> Gün içinde yeterli su tüketimi sindirimi ve atılımı destekler.</li>',
      '<li><strong>Ilık limonlu su:</strong> Sabah rutininize ekleyebileceğiniz basit bir alışkanlıktır.</li>',
      '<li><strong>Lif:</strong> Yeşil yapraklı sebzeler, kök sebzeler ve lifli meyveler bağırsak hareketlerini destekler.</li>',
      '<li><strong>Chia / keten tohumu:</strong> Lif ve faydalı yağlar bakımından zengindir.</li>',
      '<li><strong>Fermente gıdalar:</strong> Örn. lahana turşusu, kombucha gibi probiyotik kaynaklar.</li>',
      '<li><strong>Bitki çayları:</strong> Nane, rezene, papatya, zencefil gibi seçenekler rahatlatıcı olabilir.</li>',
      '</ol>',

      '<h3>Kaçınılması önerilenler</h3>',
      '<p>Rafine şeker, beyaz un ürünleri, işlenmiş gıdalar, gazlı içecekler ve kızartmalar bağırsak dengesini olumsuz etkileyebilir.</p>',

      '<p><strong>Not:</strong> Bu yazı bilgilendirme amaçlıdır. Sağlık durumunuz veya özel bir diyet planınız varsa profesyonel görüş almanız önerilir.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Bağırsak sağlığı; sindirim, bağışıklık ve ruh hâli üzerinde belirleyicidir. Doğal yöntemlerle bağırsak dengesini desteklemek uzun vadeli iyilik hâline katkı sağlar.',
  'Bağırsak sağlığı ve kolon temizliği',
  'Kolon Temizliği ve Bağırsak Sağlığı | Energetische Massage',
  'Bağırsak sağlığının bağışıklık ve ruh hâliyle ilişkisi; su, lif, fermente gıdalar ve doğal alışkanlıklarla destek önerileri.',
  'bagirsak sagligi,kolon,detoks,lif,fermente,probiyotik,dogal yasam',
  NOW(3),NOW(3)
),
(
  UUID(),
  @PAGE_BLOG_1,
  'en',
  'Colon Cleansing: The Importance of Gut Health and the Second Brain',
  'colon-cleansing-gut-health',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Gut Health and the "Second Brain"</h2>',
      '<p>The gut is often called the "second brain" because it influences far more than digestion. It plays a role in immunity, energy levels, mood, and even skin health.</p>',

      '<h3>Acid-forming habits and burden build-up</h3>',
      '<p>Over time, a modern diet heavy in sugar, white flour, ultra-processed foods, and soft drinks may disrupt gut balance and contribute to unnecessary burden.</p>',

      '<h3>Natural ways to support your gut</h3>',
      '<ol>',
      '<li><strong>Water:</strong> Consistent hydration supports digestion and elimination.</li>',
      '<li><strong>Warm lemon water:</strong> A simple morning routine many people enjoy.</li>',
      '<li><strong>Fiber:</strong> Leafy greens, root vegetables, and fiber-rich fruits support regularity.</li>',
      '<li><strong>Chia / flax:</strong> Rich in fiber and beneficial fats.</li>',
      '<li><strong>Fermented foods:</strong> Such as sauerkraut or kombucha as probiotic sources.</li>',
      '<li><strong>Herbal teas:</strong> Mint, fennel, chamomile, and ginger can be soothing.</li>',
      '</ol>',

      '<h3>Common foods to limit</h3>',
      '<p>Refined sugar, white flour products, processed foods, sodas, and deep-fried items may negatively affect gut balance.</p>',

      '<p><strong>Note:</strong> This article is for informational purposes only. If you have a medical condition or follow a specific diet, consult a qualified professional.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Gut health impacts digestion, immunity, and mental well-being. Practical, natural habits—hydration, fiber, fermented foods—can support long-term wellness.',
  'Gut health and colon support',
  'Colon Cleansing & Gut Health | Energetische Massage',
  'A practical overview of gut health: hydration, fiber, fermented foods, and natural routines that support balance and long-term well-being.',
  'gut health,colon,fiber,fermented foods,probiotics,natural wellness',
  NOW(3),NOW(3)
),
(
  UUID(),
  @PAGE_BLOG_1,
  'de',
  'Darmreinigung: Die Bedeutung der Darmgesundheit und des zweiten Gehirns',
  'darmreinigung-darmgesundheit',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Darmgesundheit und das „zweite Gehirn"</h2>',
      '<p>Der Darm wird häufig als „zweites Gehirn" bezeichnet, weil er weit mehr als nur die Verdauung beeinflusst. Er spielt eine Rolle für Immunsystem, Energie, Stimmung und sogar die Haut.</p>',

      '<h3>Säurebildende Gewohnheiten und Belastung</h3>',
      '<p>Eine Ernährung mit viel Zucker, Weißmehl, stark verarbeiteten Lebensmitteln und Softdrinks kann das Gleichgewicht im Darm ungünstig beeinflussen.</p>',

      '<h3>Natürliche Unterstützung im Alltag</h3>',
      '<ol>',
      '<li><strong>Wasser:</strong> Ausreichend trinken unterstützt Verdauung und Ausscheidung.</li>',
      '<li><strong>Warmes Zitronenwasser:</strong> Eine einfache Morgenroutine.</li>',
      '<li><strong>Ballaststoffe:</strong> Blattgemüse, Wurzelgemüse und ballaststoffreiches Obst fördern die Darmbewegung.</li>',
      '<li><strong>Chia / Leinsamen:</strong> Reich an Ballaststoffen und gesunden Fetten.</li>',
      '<li><strong>Fermentiertes:</strong> Zum Beispiel Sauerkraut oder Kombucha als natürliche Probiotika.</li>',
      '<li><strong>Kräutertees:</strong> Minze, Fenchel, Kamille und Ingwer können wohltuend sein.</li>',
      '</ol>',

      '<h3>Was man häufig reduzieren sollte</h3>',
      '<p>Raffinierter Zucker, Weißmehlprodukte, hoch verarbeitete Lebensmittel, Softdrinks und Frittiertes können die Darmbalance belasten.</p>',

      '<p><strong>Hinweis:</strong> Dieser Beitrag dient der Information. Bei Beschwerden oder besonderen Ernährungsformen bitte medizinischen Rat einholen.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Der Darm beeinflusst Verdauung, Immunabwehr und Wohlbefinden. Mit Wasser, Ballaststoffen und fermentierten Lebensmitteln lässt sich die Darmbalance natürlich unterstützen.',
  'Darmgesundheit & natürliche Unterstützung',
  'Darmreinigung & Darmgesundheit | Energetische Massage',
  'Darmgesundheit im Überblick: praktische Routinen wie Wasser, Ballaststoffe und fermentierte Lebensmittel zur Unterstützung der Balance und des Wohlbefindens.',
  'darmgesundheit,darmreinigung,ballaststoffe,fermentiert,probiotika,natuerlich',
  NOW(3),NOW(3)
)
ON DUPLICATE KEY UPDATE
  `title`              = VALUES(`title`),
  `slug`               = VALUES(`slug`),
  `content`            = VALUES(`content`),
  `summary`            = VALUES(`summary`),
  `featured_image_alt` = VALUES(`featured_image_alt`),
  `meta_title`         = VALUES(`meta_title`),
  `meta_description`   = VALUES(`meta_description`),
  `tags`               = VALUES(`tags`),
  `updated_at`         = VALUES(`updated_at`);

-- =============================================================
-- BLOG POST #2 — Natural energy boosters (caffeine-free)
-- =============================================================
SET @PAGE_BLOG_2 := '22222222-2222-3333-4444-555555555502';
SET @IMG_BLOG_2  := 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1754082397/uploads/anastasia/blog-images/9-1754082394528-976665892.webp';
SET @IMAGES_2 := CONCAT('["', REPLACE(@IMG_BLOG_2, '"', '\"'), '"]');

INSERT INTO `custom_pages`
(`id`,`module_key`,`is_published`,`featured`,`display_order`,`order_num`,
 `featured_image`,`featured_image_asset_id`,
 `image_url`,`storage_asset_id`,
 `images`,`storage_image_ids`,
 `created_at`,`updated_at`)
VALUES
(@PAGE_BLOG_2,@MODULE_KEY,1,1,120,120,
 @IMG_BLOG_2,NULL,
 @IMG_BLOG_2,NULL,
 @IMAGES_2,@EMPTY_ARR,
 NOW(3),NOW(3))
ON DUPLICATE KEY UPDATE
  `module_key`        = VALUES(`module_key`),
  `is_published`      = VALUES(`is_published`),
  `featured`          = VALUES(`featured`),
  `display_order`     = VALUES(`display_order`),
  `order_num`         = VALUES(`order_num`),
  `featured_image`    = VALUES(`featured_image`),
  `image_url`         = VALUES(`image_url`),
  `images`            = VALUES(`images`),
  `storage_image_ids` = VALUES(`storage_image_ids`),
  `updated_at`        = VALUES(`updated_at`);

INSERT INTO `custom_pages_i18n`
(`id`,`page_id`,`locale`,`title`,`slug`,`content`,`summary`,
 `featured_image_alt`,`meta_title`,`meta_description`,`tags`,
 `created_at`,`updated_at`)
VALUES
(
  UUID(),
  @PAGE_BLOG_2,
  'tr',
  'Doğal Enerji Artırıcılar: Kimyasal ve Kafeinsiz Çözümler',
  'dogal-enerji-artiricilar-kafeinsiz-cozumler',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Doğal Enerji: Gün Boyu Zinde Kalmanın Yolları</h2>',
      '<p>Kahve ve şeker kısa süreli bir yükseliş sağlayabilir; ancak çoğu zaman sonrasında daha belirgin bir yorgunluk bırakır. Sürdürülebilir enerji için temel, doğal alışkanlıklardır.</p>',

      '<h3>Günlük rutinde etkili adımlar</h3>',
      '<ul>',
      '<li><strong>Uyku düzeni:</strong> Aynı saatlerde yatıp kalkmak biyolojik ritmi dengeler.</li>',
      '<li><strong>Sabah ışığı:</strong> Güneş ışığı güne zinde başlamayı destekler.</li>',
      '<li><strong>Dengeli beslenme:</strong> Tam tahıl, sebze, meyve ve sağlıklı yağlar gün boyu stabil enerji sağlar.</li>',
      '<li><strong>Hareket:</strong> Kısa yürüyüş, yoga veya esneme oksijenlenmeyi artırır.</li>',
      '<li><strong>Nefes:</strong> Basit nefes egzersizleri zihinsel berraklığı güçlendirebilir.</li>',
      '</ul>',

      '<h3>Doğal destekler</h3>',
      '<p>Kafeinsiz bitki çayları (zencefil, rooibos, nane) ve dengeli bir su tüketimi, gün içinde canlılık hissini artırmaya yardımcı olabilir.</p>',

      '<p><strong>Not:</strong> Bitkisel takviye veya adaptogen kullanımını düşünüyorsanız sağlık profesyoneline danışmanız önerilir.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Kimyasal veya kafein bağımlılığı olmadan; uyku, beslenme, hareket, nefes ve doğal desteklerle enerji seviyesini artırmanın pratik yolları.',
  'Doğal enerji ve zindelik',
  'Doğal Enerji Artırıcılar | Energetische Massage',
  'Uyku düzeni, sabah ışığı, dengeli beslenme, hareket ve nefes pratikleriyle kafeinsiz sürdürülebilir enerji yaklaşımları.',
  'enerji,zindelik,uyku,nefes,beslenme,yuruyus,bitki cayi,kafeinsiz',
  NOW(3),NOW(3)
),
(
  UUID(),
  @PAGE_BLOG_2,
  'en',
  'Natural Energy Boosters: Chemical and Caffeine-Free Solutions',
  'natural-energy-boosters-caffeine-free',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Natural Energy: Staying Vibrant All Day</h2>',
      '<p>Coffee and sugar can provide a short lift, but often come with an energy crash. Sustainable energy is built on simple, consistent habits.</p>',

      '<h3>High-impact daily steps</h3>',
      '<ul>',
      '<li><strong>Sleep routine:</strong> Consistent sleep/wake times support your natural rhythm.</li>',
      '<li><strong>Morning light:</strong> Sunlight helps you feel awake and aligned.</li>',
      '<li><strong>Balanced meals:</strong> Whole grains, vegetables, fruits, and healthy fats support steady energy.</li>',
      '<li><strong>Movement:</strong> A short walk, yoga, or stretching boosts oxygen flow.</li>',
      '<li><strong>Breathing:</strong> Simple breathing practices can improve mental clarity.</li>',
      '</ul>',

      '<h3>Gentle natural supports</h3>',
      '<p>Caffeine-free herbal teas (ginger, rooibos, mint) and consistent hydration can help you feel more energized throughout the day.</p>',

      '<p><strong>Note:</strong> If you consider herbal supplements or adaptogens, consult a qualified health professional.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'No chemicals, no caffeine dependency: practical routines—sleep, nutrition, movement, breathing, and gentle herbal options—to support stable daily energy.',
  'Natural energy and vitality',
  'Natural Energy Boosters | Energetische Massage',
  'Sustainable, caffeine-free energy approaches: sleep rhythm, morning light, balanced nutrition, movement, and breathing practices for everyday vitality.',
  'energy,vitality,sleep,breathing,nutrition,movement,herbal tea,caffeine-free',
  NOW(3),NOW(3)
),
(
  UUID(),
  @PAGE_BLOG_2,
  'de',
  'Natürliche Energiebooster: Chemie- und Koffeinfreie Lösungen',
  'natuerliche-energiebooster-koffeinfrei',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Natürliche Energie: Den ganzen Tag leistungsfähig</h2>',
      '<p>Kaffee und Zucker wirken oft nur kurzfristig und führen anschließend zu einem Energieabfall. Nachhaltige Energie entsteht durch einfache, konsequente Gewohnheiten.</p>',

      '<h3>Wirksame Schritte im Alltag</h3>',
      '<ul>',
      '<li><strong>Schlafroutine:</strong> Feste Zeiten stabilisieren den Biorhythmus.</li>',
      '<li><strong>Morgenlicht:</strong> Tageslicht hilft beim Wachwerden und Ausrichten.</li>',
      '<li><strong>Ausgewogene Mahlzeiten:</strong> Vollkorn, Gemüse, Obst und gesunde Fette geben gleichmäßige Energie.</li>',
      '<li><strong>Bewegung:</strong> Spaziergang, Yoga oder Dehnen verbessern die Sauerstoffversorgung.</li>',
      '<li><strong>Atmung:</strong> Atemübungen können Klarheit und Fokus fördern.</li>',
      '</ul>',

      '<h3>Sanfte natürliche Unterstützung</h3>',
      '<p>Koffeinfreie Kräutertees (Ingwer, Rooibos, Minze) und ausreichendes Trinken unterstützen das Vitalitätsgefühl über den Tag.</p>',

      '<p><strong>Hinweis:</strong> Bei Nahrungsergänzung oder Adaptogenen bitte vorher medizinischen Rat einholen.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Ohne Chemie und Koffein: Schlaf, Ernährung, Bewegung, Atmung und sanfte Kräuteroptionen als praktische Wege zu stabiler Tagesenergie.',
  'Natürliche Energie und Vitalität',
  'Natürliche Energiebooster | Energetische Massage',
  'Koffeinfreie, nachhaltige Energie im Alltag: Schlafrhythmus, Morgenlicht, ausgewogene Ernährung, Bewegung und Atemroutinen.',
  'energie,vitalitaet,schlaf,atmung,ernaehrung,bewegung,kraeutertee,koffeinfrei',
  NOW(3),NOW(3)
)
ON DUPLICATE KEY UPDATE
  `title`              = VALUES(`title`),
  `slug`               = VALUES(`slug`),
  `content`            = VALUES(`content`),
  `summary`            = VALUES(`summary`),
  `featured_image_alt` = VALUES(`featured_image_alt`),
  `meta_title`         = VALUES(`meta_title`),
  `meta_description`   = VALUES(`meta_description`),
  `tags`               = VALUES(`tags`),
  `updated_at`         = VALUES(`updated_at`);

-- =============================================================
-- BLOG POST #3 — Seasonal nutrition
-- =============================================================
SET @PAGE_BLOG_3 := '22222222-2222-3333-4444-555555555503';
SET @IMG_BLOG_3  := 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1754082437/uploads/anastasia/blog-images/8-1754082432377-633729971.webp';
SET @IMAGES_3 := CONCAT('["', REPLACE(@IMG_BLOG_3, '"', '\"'), '"]');

INSERT INTO `custom_pages`
(`id`,`module_key`,`is_published`,`featured`,`display_order`,`order_num`,
 `featured_image`,`featured_image_asset_id`,
 `image_url`,`storage_asset_id`,
 `images`,`storage_image_ids`,
 `created_at`,`updated_at`)
VALUES
(@PAGE_BLOG_3,@MODULE_KEY,1,0,130,130,
 @IMG_BLOG_3,NULL,
 @IMG_BLOG_3,NULL,
 @IMAGES_3,@EMPTY_ARR,
 NOW(3),NOW(3))
ON DUPLICATE KEY UPDATE
  `module_key`        = VALUES(`module_key`),
  `is_published`      = VALUES(`is_published`),
  `featured`          = VALUES(`featured`),
  `display_order`     = VALUES(`display_order`),
  `order_num`         = VALUES(`order_num`),
  `featured_image`    = VALUES(`featured_image`),
  `image_url`         = VALUES(`image_url`),
  `images`            = VALUES(`images`),
  `storage_image_ids` = VALUES(`storage_image_ids`),
  `updated_at`        = VALUES(`updated_at`);

INSERT INTO `custom_pages_i18n`
(`id`,`page_id`,`locale`,`title`,`slug`,`content`,`summary`,
 `featured_image_alt`,`meta_title`,`meta_description`,`tags`,
 `created_at`,`updated_at`)
VALUES
(
  UUID(),
  @PAGE_BLOG_3,
  'tr',
  'Mevsimsel Beslenme: Doğanın Ritimleriyle Sağlıklı Kalmak',
  'mevsimsel-beslenme-doganin-ritmiyle-saglikli-kalmak',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Mevsimsel Beslenme Neden Önemli?</h2>',
      '<p>Mevsimlere göre beslenmek; taze, besleyici ve vücudun ihtiyaçlarına daha uygun ürünleri seçmek anlamına gelir. Bu yaklaşım sağlığı destekler, çevresel etkiyi azaltır ve çoğu zaman daha ekonomiktir.</p>',

      '<h3>Mevsimlere göre pratik öneriler</h3>',
      '<ul>',
      '<li><strong>İlkbahar:</strong> Yeşillikler ve daha hafif öğünler.</li>',
      '<li><strong>Yaz:</strong> Su oranı yüksek sebze-meyveler ve ferah tarifler.</li>',
      '<li><strong>Sonbahar:</strong> Kök sebzeler, baklagiller ve bağışıklık odaklı seçimler.</li>',
      '<li><strong>Kış:</strong> Sıcak çorbalar, lahana grubu sebzeler ve narenciye.</li>',
      '</ul>',

      '<h3>Uygulama ipuçları</h3>',
      '<p>Yerel pazarları takip edin, tabağınıza renk ve çeşit katın ve tariflerinizi mevsime göre güncelleyin.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Mevsimsel beslenme; tazelik, besin değeri, çevre ve bütçe açısından avantaj sağlar. Mevsime uygun seçimlerle sağlıklı dengeyi destekleyin.',
  'Mevsimsel beslenme ve sağlık',
  'Mevsimsel Beslenme | Energetische Massage',
  'Mevsimlere göre beslenmenin faydaları ve pratik ipuçları: yerel ürünler, dengeli seçimler ve doğanın ritmiyle uyum.',
  'mevsimsel beslenme,saglik,yerel urunler,bagisiklik,sebze,meyve',
  NOW(3),NOW(3)
),
(
  UUID(),
  @PAGE_BLOG_3,
  'en',
  'Seasonal Nutrition: Staying Healthy in Tune with Nature''s Rhythms',
  'seasonal-nutrition-natures-rhythms',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Why Eating Seasonally Matters</h2>',
      '<p>Seasonal nutrition means choosing fresher, more nourishing foods that align with the body''s needs throughout the year. It supports health, reduces environmental impact, and is often more budget-friendly.</p>',

      '<h3>Practical seasonal ideas</h3>',
      '<ul>',
      '<li><strong>Spring:</strong> Fresh greens and lighter meals.</li>',
      '<li><strong>Summer:</strong> Water-rich produce and refreshing recipes.</li>',
      '<li><strong>Autumn:</strong> Root vegetables, legumes, and immune-supporting choices.</li>',
      '<li><strong>Winter:</strong> Warm soups, cruciferous vegetables, and citrus fruits.</li>',
      '</ul>',

      '<h3>How to apply it</h3>',
      '<p>Visit local markets, add variety and color to your plate, and adjust recipes based on the season.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Seasonal eating supports freshness, nutrients, and sustainability. Use simple seasonal choices to stay balanced and healthy year-round.',
  'Seasonal eating and health',
  'Seasonal Nutrition | Energetische Massage',
  'Benefits and practical tips for seasonal nutrition: local produce, balanced choices, and staying aligned with nature''s yearly rhythm.',
  'seasonal nutrition,health,local produce,immunity,vegetables,fruit',
  NOW(3),NOW(3)
),
(
  UUID(),
  @PAGE_BLOG_3,
  'de',
  'Saisonale Ernährung: Mit dem Rhythmus der Natur gesund bleiben',
  'saisonale-ernaehrung-rhythmus-der-natur',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Warum saisonale Ernährung sinnvoll ist</h2>',
      '<p>Saisonal zu essen bedeutet, frische und nährstoffreiche Lebensmittel zu wählen, die zu Jahreszeit und Körperbedürfnissen passen. Das unterstützt die Gesundheit, schont die Umwelt und ist oft auch günstiger.</p>',

      '<h3>Praktische Ideen nach Jahreszeit</h3>',
      '<ul>',
      '<li><strong>Frühling:</strong> Frische Kräuter und leichte Mahlzeiten.</li>',
      '<li><strong>Sommer:</strong> Wasserreiches Obst und Gemüse, erfrischende Rezepte.</li>',
      '<li><strong>Herbst:</strong> Wurzelgemüse, Hülsenfrüchte und immunstärkende Auswahl.</li>',
      '<li><strong>Winter:</strong> Warme Suppen, Kohlgemüse und Zitrusfrüchte.</li>',
      '</ul>',

      '<h3>So gelingt die Umsetzung</h3>',
      '<p>Wochenmärkte nutzen, mehr Farbe und Vielfalt auf den Teller bringen und Rezepte saisonal anpassen.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Saisonal essen bedeutet mehr Frische und Nährstoffe - und oft weniger Umweltbelastung. Mit einfachen saisonalen Entscheidungen bleiben Sie das ganze Jahr im Gleichgewicht.',
  'Saisonale Ernährung und Gesundheit',
  'Saisonale Ernährung | Energetische Massage',
  'Saisonale Ernährung: Vorteile und praktische Tipps für lokale Produkte, ausgewogene Auswahl und ein gesundes Jahr im Rhythmus der Natur.',
  'saisonal,ernaehrung,gesundheit,wochenmarkt,immunsystem,gemuese,obst',
  NOW(3),NOW(3)
)
ON DUPLICATE KEY UPDATE
  `title`              = VALUES(`title`),
  `slug`               = VALUES(`slug`),
  `content`            = VALUES(`content`),
  `summary`            = VALUES(`summary`),
  `featured_image_alt` = VALUES(`featured_image_alt`),
  `meta_title`         = VALUES(`meta_title`),
  `meta_description`   = VALUES(`meta_description`),
  `tags`               = VALUES(`tags`),
  `updated_at`         = VALUES(`updated_at`);

-- =============================================================
-- BLOG POST #4 — Energetic relaxation massage (closed eyes)
-- =============================================================
SET @PAGE_BLOG_4 := '22222222-2222-3333-4444-555555555504';
SET @IMG_BLOG_4  := 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1600&q=80';
SET @IMAGES_4 := CONCAT('["', REPLACE(@IMG_BLOG_4, '"', '\"'), '"]');

INSERT INTO `custom_pages`
(`id`,`module_key`,`is_published`,`featured`,`display_order`,`order_num`,
 `featured_image`,`featured_image_asset_id`,
 `image_url`,`storage_asset_id`,
 `images`,`storage_image_ids`,
 `created_at`,`updated_at`)
VALUES
(@PAGE_BLOG_4,@MODULE_KEY,1,0,140,140,
 @IMG_BLOG_4,NULL,
 @IMG_BLOG_4,NULL,
 @IMAGES_4,@EMPTY_ARR,
 NOW(3),NOW(3))
ON DUPLICATE KEY UPDATE
  `module_key`        = VALUES(`module_key`),
  `is_published`      = VALUES(`is_published`),
  `featured`          = VALUES(`featured`),
  `display_order`     = VALUES(`display_order`),
  `order_num`         = VALUES(`order_num`),
  `featured_image`    = VALUES(`featured_image`),
  `image_url`         = VALUES(`image_url`),
  `images`            = VALUES(`images`),
  `storage_image_ids` = VALUES(`storage_image_ids`),
  `updated_at`        = VALUES(`updated_at`);

INSERT INTO `custom_pages_i18n`
(`id`,`page_id`,`locale`,`title`,`slug`,`content`,`summary`,
 `featured_image_alt`,`meta_title`,`meta_description`,`tags`,
 `created_at`,`updated_at`)
VALUES
(
  UUID(),
  @PAGE_BLOG_4,
  'tr',
  'Gözler Kapalı Enerjetik Masaj: Seans Nasıl İlerler?',
  'gozler-kapali-enerjetik-masaj',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>İçe dönmek için sakin bir alan</h2>',
      '<p>Enerjetik rahatlama masajında amaç, bedenin ve zihnin "dışarıda" değil, içeride toplanmasına alan açmaktır. Seanslar sessiz, yumuşak ve net sınırlar içinde ilerler.</p>',

      '<h3>Neden gözler kapalı?</h3>',
      '<p>Uygulayıcı olarak çoğu zaman gözlerimi kapalı tutarım. Böylece dokunuşu daha bilinçli, daha yavaş ve daha duyarlı bir şekilde sürdürebilirim. Nefesin ritmini, kaslardaki gerilimi ve bedenin verdiği küçük sinyalleri daha net takip etmek kolaylaşır.</p>',

      '<h3>Seans akışı</h3>',
      '<ol>',
      '<li><strong>Kısa ön görüşme:</strong> O gün nasıl hissettiğin, sınırlar ve ihtiyaçlar netleşir.</li>',
      '<li><strong>Rahatlama:</strong> Gözler kapalı, sakin bir ritimle dokunuşlar başlar.</li>',
      '<li><strong>Farkındalık:</strong> Nefes, beden hissi ve gevşemeye alan açılır.</li>',
      '<li><strong>Kapanış:</strong> Yavaşça günlük hayata dönüş ve kısa bir değerlendirme.</li>',
      '</ol>',

      '<h3>Ne beklemelisin?</h3>',
      '<ul>',
      '<li>Yumuşak ve saygılı bir yaklaşım</li>',
      '<li>Net sınırlar ve açık iletişim</li>',
      '<li>Derin dinlenme hissi ve beden farkındalığı</li>',
      '</ul>',

      '<p><em>Not:</em> Bu içerik bilgilendirme amaçlıdır. Seanslar tıbbi tanı/tedavi yerine geçmez.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Gözler kapalı enerjetik masaj seansları: sakin bir ritim, net sınırlar ve içe dönüş için güvenli bir alan.',
  'Gözler kapalı enerjetik masaj',
  'Gözler Kapalı Enerjetik Masaj | Energetische Massage',
  'Enerjetik rahatlama masajında seans akışı, neden gözler kapalı çalışıldığı ve ne beklenebileceği üzerine kısa bir rehber.',
  'enerjetik masaj,rahatlama,beden farkindaligi,nefes,bonn,seans',
  NOW(3),NOW(3)
),
(
  UUID(),
  @PAGE_BLOG_4,
  'en',
  'Energetic Massage with Closed Eyes: What to Expect',
  'energetic-massage-closed-eyes',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>A calm space to come home to yourself</h2>',
      '<p>In an energetic relaxation massage, the intention is to create room for inner quiet. Sessions are gentle, respectful, and held within clear boundaries.</p>',

      '<h3>Why closed eyes?</h3>',
      '<p>As a practitioner, I often keep my eyes closed. It helps me stay present and work more slowly and sensitively, noticing breath rhythm and subtle tension patterns in the body.</p>',

      '<h3>Session flow</h3>',
      '<ol>',
      '<li><strong>Short check-in:</strong> how you feel today, boundaries, and needs.</li>',
      '<li><strong>Settling:</strong> gentle touch in a calm rhythm.</li>',
      '<li><strong>Awareness:</strong> breathing, body perception, and letting go.</li>',
      '<li><strong>Closing:</strong> a slow return and a brief reflection.</li>',
      '</ol>',

      '<h3>What you can expect</h3>',
      '<ul>',
      '<li>Mindful, respectful touch</li>',
      '<li>Clear boundaries and open communication</li>',
      '<li>A sense of rest and increased body awareness</li>',
      '</ul>',

      '<p><em>Note:</em> This article is for information only. Sessions are not a substitute for medical diagnosis or treatment.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Closed-eye energetic massage sessions: a calm rhythm, clear boundaries, and a protected space to relax inward.',
  'Closed-eye energetic massage',
  'Energetic Massage with Closed Eyes | Energetische Massage',
  'A short guide to what a closed-eye energetic relaxation massage can feel like, how a session flows, and what to expect.',
  'energetic massage,relaxation,body awareness,breath,bonn,session',
  NOW(3),NOW(3)
),
(
  UUID(),
  @PAGE_BLOG_4,
  'de',
  'Energetische Massage mit geschlossenen Augen: Was Sie erwartet',
  'energetische-massage-geschlossene-augen',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Ein ruhiger Raum zum Ankommen</h2>',
      '<p>Bei einer energetischen Entspannungsmassage steht das nach innen gerichtete Erleben im Vordergrund. Die Behandlung ist achtsam, respektvoll und klar abgegrenzt.</p>',

      '<h3>Warum mit geschlossenen Augen?</h3>',
      '<p>Als Behandlerin arbeite ich häufig mit geschlossenen Augen. Das unterstützt Präsenz und ein langsames, sensibles Tempo - und hilft, Atmung und feine Spannungssignale bewusster wahrzunehmen.</p>',

      '<h3>Ablauf einer Sitzung</h3>',
      '<ol>',
      '<li><strong>Kurzgespräch:</strong> Wie fühlen Sie sich heute? Grenzen und Bedürfnisse.</li>',
      '<li><strong>Ankommen:</strong> Berührung in ruhigem Rhythmus.</li>',
      '<li><strong>Körperwahrnehmung:</strong> Atmung, Wahrnehmung, Loslassen.</li>',
      '<li><strong>Abschluss:</strong> Langsames Zurückkommen und kurze Reflexion.</li>',
      '</ol>',

      '<h3>Was Sie erwarten können</h3>',
      '<ul>',
      '<li>Achtsame, respektvolle Berührung</li>',
      '<li>Klare Grenzen und offene Kommunikation</li>',
      '<li>Ruhe und gesteigerte Körperwahrnehmung</li>',
      '</ul>',

      '<p><em>Hinweis:</em> Dieser Beitrag dient der Information. Die Sitzungen ersetzen keine medizinische Diagnose oder Behandlung.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Energetische Massage mit geschlossenen Augen: ruhiger Rhythmus, klare Grenzen und ein geschützter Raum zum Loslassen.',
  'Energetische Massage mit geschlossenen Augen',
  'Energetische Massage mit geschlossenen Augen | Energetische Massage',
  'Was bei einer energetischen Entspannungsmassage mit geschlossenen Augen erwartet werden kann - Ablauf, Haltung und Rahmen.',
  'energetische massage,entspannung,koerperwahrnehmung,atmung,bonn,sitzung',
  NOW(3),NOW(3)
)
ON DUPLICATE KEY UPDATE
  `title`              = VALUES(`title`),
  `slug`               = VALUES(`slug`),
  `content`            = VALUES(`content`),
  `summary`            = VALUES(`summary`),
  `featured_image_alt` = VALUES(`featured_image_alt`),
  `meta_title`         = VALUES(`meta_title`),
  `meta_description`   = VALUES(`meta_description`),
  `tags`               = VALUES(`tags`),
  `updated_at`         = VALUES(`updated_at`);

-- =============================================================
-- BLOG POST #5 — Boundaries & consent
-- =============================================================
SET @PAGE_BLOG_5 := '22222222-2222-3333-4444-555555555505';
SET @IMG_BLOG_5  := 'https://images.unsplash.com/photo-1525097487452-6278ff080c31?auto=format&fit=crop&w=1600&q=80';
SET @IMAGES_5 := CONCAT('["', REPLACE(@IMG_BLOG_5, '"', '\"'), '"]');

INSERT INTO `custom_pages`
(`id`,`module_key`,`is_published`,`featured`,`display_order`,`order_num`,
 `featured_image`,`featured_image_asset_id`,
 `image_url`,`storage_asset_id`,
 `images`,`storage_image_ids`,
 `created_at`,`updated_at`)
VALUES
(@PAGE_BLOG_5,@MODULE_KEY,1,0,150,150,
 @IMG_BLOG_5,NULL,
 @IMG_BLOG_5,NULL,
 @IMAGES_5,@EMPTY_ARR,
 NOW(3),NOW(3))
ON DUPLICATE KEY UPDATE
  `module_key`        = VALUES(`module_key`),
  `is_published`      = VALUES(`is_published`),
  `featured`          = VALUES(`featured`),
  `display_order`     = VALUES(`display_order`),
  `order_num`         = VALUES(`order_num`),
  `featured_image`    = VALUES(`featured_image`),
  `image_url`         = VALUES(`image_url`),
  `images`            = VALUES(`images`),
  `storage_image_ids` = VALUES(`storage_image_ids`),
  `updated_at`        = VALUES(`updated_at`);

INSERT INTO `custom_pages_i18n`
(`id`,`page_id`,`locale`,`title`,`slug`,`content`,`summary`,
 `featured_image_alt`,`meta_title`,`meta_description`,`tags`,
 `created_at`,`updated_at`)
VALUES
(
  UUID(),
  @PAGE_BLOG_5,
  'tr',
  'Net Sınırlar ve Güvenli Alan: Enerjetik Masaj Nedir, Ne Değildir?',
  'enerjetik-masaj-sinirlar-guven',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Güven, açık iletişim ve onay</h2>',
      '<p>Bir seansın iyi geçmesi için teknik kadar önemli olan şey: güven. Bu yüzden seans öncesinde kısa bir konuşma yaparız; sınırlar, hassasiyetler ve beklentiler netleşir.</p>',

      '<h3>Enerjetik masaj nedir?</h3>',
      '<ul>',
      '<li>Farkındalıklı dokunuş ve sakin bir ritim</li>',
      '<li>Beden algısı, nefes ve gevşemeye alan açmak</li>',
      '<li>Kişiye özel yaklaşım: o günün ihtiyacına göre</li>',
      '</ul>',

      '<h3>Ne değildir?</h3>',
      '<ul>',
      '<li>Tıbbi tanı veya tedavi değildir</li>',
      '<li>Sınırları belirsiz bir deneyim değildir</li>',
      '<li>Beklenti performansı değildir</li>',
      '</ul>',

      '<h3>Onay her zaman geçerlidir</h3>',
      '<p>Seans boyunca "dur" deme hakkın her zaman vardır. Konforun, sınırların ve güvenin her şeyden önce gelir.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Enerjetik masajda güvenin temeli: net sınırlar, açık iletişim ve onay. Seansın çerçevesi ve beklentiler.',
  'Enerjetik masajda sınırlar',
  'Enerjetik Masaj: Sınırlar ve Güven | Energetische Massage',
  'Enerjetik masaj seanslarında net sınırlar, açık iletişim ve onay neden önemlidir? Nedir ve ne değildir?',
  'enerjetik masaj,sinirlar,onay,guvenli alan,bonn,etik',
  NOW(3),NOW(3)
),
(
  UUID(),
  @PAGE_BLOG_5,
  'en',
  'Clear Boundaries and a Safe Space: What Energetic Massage Is (and Isn''t)',
  'energetic-massage-boundaries',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Trust, communication, and consent</h2>',
      '<p>A good session is built on safety. Before we begin, we have a short check-in to clarify boundaries, sensitivities, and what you need today.</p>',

      '<h3>What it is</h3>',
      '<ul>',
      '<li>Mindful touch and a calm rhythm</li>',
      '<li>Space for breath, body awareness, and relaxation</li>',
      '<li>Individual and respectful — shaped to your day</li>',
      '</ul>',

      '<h3>What it isn''t</h3>',
      '<ul>',
      '<li>Not medical diagnosis or treatment</li>',
      '<li>Not boundary-free or ambiguous</li>',
      '<li>Not something you need to "perform" for</li>',
      '</ul>',

      '<h3>Consent is always valid</h3>',
      '<p>You can pause or stop at any time. Comfort, boundaries, and respect come first.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Energetic massage is grounded in clear boundaries, open communication, and consent. A short guide to the session framework.',
  'Boundaries in energetic massage',
  'Energetic Massage Boundaries | Energetische Massage',
  'Why clear boundaries and consent matter in energetic massage sessions — what it is, what it isn''t, and how a safe space is created.',
  'energetic massage,boundaries,consent,safe space,bonn,ethics',
  NOW(3),NOW(3)
),
(
  UUID(),
  @PAGE_BLOG_5,
  'de',
  'Klare Grenzen und ein sicherer Raum: Was energetische Massage ist (und nicht ist)',
  'energetische-massage-grenzen',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Vertrauen, Kommunikation und Einverständnis</h2>',
      '<p>Eine gute Sitzung basiert auf Sicherheit. Vor Beginn klären wir in einem kurzen Gespräch Grenzen, Sensibilitäten und das, was Sie heute brauchen.</p>',

      '<h3>Was es ist</h3>',
      '<ul>',
      '<li>Achtsame Berührung in ruhigem Rhythmus</li>',
      '<li>Raum für Atmung, Körperwahrnehmung und Entspannung</li>',
      '<li>Individuell und respektvoll - angepasst an Ihren Tag</li>',
      '</ul>',

      '<h3>Was es nicht ist</h3>',
      '<ul>',
      '<li>Keine medizinische Diagnose oder Behandlung</li>',
      '<li>Kein unklar abgegrenztes Setting</li>',
      '<li>Keine Leistungserwartung</li>',
      '</ul>',

      '<h3>Einverständnis gilt jederzeit</h3>',
      '<p>Sie können jederzeit pausieren oder stoppen. Wohlbefinden, Grenzen und Respekt stehen an erster Stelle.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Energetische Massage lebt von klaren Grenzen, offener Kommunikation und Einverständnis. Ein kurzer Überblick zum Rahmen der Sitzung.',
  'Grenzen in der energetischen Massage',
  'Energetische Massage: Grenzen & Sicherheit | Energetische Massage',
  'Warum klare Grenzen und Einverständnis wichtig sind - was energetische Massage ist, was sie nicht ist und wie ein sicherer Raum entsteht.',
  'energetische massage,grenzen,einverstaendnis,sicherheit,bonn,ethik',
  NOW(3),NOW(3)
)
ON DUPLICATE KEY UPDATE
  `title`              = VALUES(`title`),
  `slug`               = VALUES(`slug`),
  `content`            = VALUES(`content`),
  `summary`            = VALUES(`summary`),
  `featured_image_alt` = VALUES(`featured_image_alt`),
  `meta_title`         = VALUES(`meta_title`),
  `meta_description`   = VALUES(`meta_description`),
  `tags`               = VALUES(`tags`),
  `updated_at`         = VALUES(`updated_at`);

-- =============================================================
-- BLOG POST #6 — Breath & nervous system
-- =============================================================
SET @PAGE_BLOG_6 := '22222222-2222-3333-4444-555555555506';
SET @IMG_BLOG_6  := 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80';
SET @IMAGES_6 := CONCAT('["', REPLACE(@IMG_BLOG_6, '"', '\"'), '"]');

INSERT INTO `custom_pages`
(`id`,`module_key`,`is_published`,`featured`,`display_order`,`order_num`,
 `featured_image`,`featured_image_asset_id`,
 `image_url`,`storage_asset_id`,
 `images`,`storage_image_ids`,
 `created_at`,`updated_at`)
VALUES
(@PAGE_BLOG_6,@MODULE_KEY,1,0,160,160,
 @IMG_BLOG_6,NULL,
 @IMG_BLOG_6,NULL,
 @IMAGES_6,@EMPTY_ARR,
 NOW(3),NOW(3))
ON DUPLICATE KEY UPDATE
  `module_key`        = VALUES(`module_key`),
  `is_published`      = VALUES(`is_published`),
  `featured`          = VALUES(`featured`),
  `display_order`     = VALUES(`display_order`),
  `order_num`         = VALUES(`order_num`),
  `featured_image`    = VALUES(`featured_image`),
  `image_url`         = VALUES(`image_url`),
  `images`            = VALUES(`images`),
  `storage_image_ids` = VALUES(`storage_image_ids`),
  `updated_at`        = VALUES(`updated_at`);

INSERT INTO `custom_pages_i18n`
(`id`,`page_id`,`locale`,`title`,`slug`,`content`,`summary`,
 `featured_image_alt`,`meta_title`,`meta_description`,`tags`,
 `created_at`,`updated_at`)
VALUES
(
  UUID(),
  @PAGE_BLOG_6,
  'tr',
  'Nefes ve Sinir Sistemi: Derin Gevşeme Nasıl Başlar?',
  'nefes-sinir-sistemi-derin-gevsme',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Rahatlama, bedende başlar</h2>',
      '<p>Gevşeme çoğu zaman "zihni susturmakla" değil, bedeni güvenli hissettirmekle başlar. Nefesin ritmi, sinir sisteminin tonunu etkileyebilir ve içeride daha yumuşak bir alan açabilir.</p>',

      '<h3>Basit bir pratik</h3>',
      '<ol>',
      '<li>Rahat bir oturuş bul.</li>',
      '<li>Burnundan nefes al, nefesi yavaşça uzat.</li>',
      '<li>Omuzları gevşet ve bedeni yerde hisset.</li>',
      '<li>2-3 dakika boyunca sadece ritmi takip et.</li>',
      '</ol>',

      '<h3>Masaj ile ilişkisi</h3>',
      '<p>Enerjetik masajda dokunuşun temposu ve nefesin düzeni birlikte çalışır: bedenin "acele" modundan çıkıp dinlenmeye geçmesi kolaylaşır.</p>',

      '<p><em>Not:</em> Bu yazı genel bilgilendirme amaçlıdır; tıbbi öneri yerine geçmez.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Nefes ritmi ve sinir sistemi ilişkisi: basit bir pratik ve enerjetik masajda ritmin neden önemli olduğuna dair kısa bir not.',
  'Nefes ve sinir sistemi',
  'Nefes ve Sinir Sistemi | Energetische Massage',
  'Rahatlama nasıl başlar? Nefes ritmi, sinir sistemi ve enerjetik masajda dokunuş temposu üzerine kısa bir rehber.',
  'nefes,rahatlama,sinir sistemi,farkindalik,enerjetik masaj,bonn',
  NOW(3),NOW(3)
),
(
  UUID(),
  @PAGE_BLOG_6,
  'en',
  'Breath and the Nervous System: Where Deep Relaxation Begins',
  'breath-nervous-system-relaxation',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Relaxation begins in the body</h2>',
      '<p>Often, relaxation starts not by "silencing the mind," but by helping the body feel safe. Breath rhythm can influence nervous system tone and open a softer inner space.</p>',

      '<h3>A simple practice</h3>',
      '<ol>',
      '<li>Find a comfortable seat.</li>',
      '<li>Breathe in through the nose and lengthen the exhale gently.</li>',
      '<li>Soften the shoulders and feel the ground under you.</li>',
      '<li>Follow the rhythm for 2-3 minutes.</li>',
      '</ol>',

      '<h3>How it relates to massage</h3>',
      '<p>In energetic massage, the pace of touch and the rhythm of breathing work together—supporting a shift from "hurry mode" into rest.</p>',

      '<p><em>Note:</em> This article is general information, not medical advice.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'A short note on breath rhythm and nervous system tone — plus a simple practice and how rhythm supports rest in energetic massage.',
  'Breath and the nervous system',
  'Breath & Nervous System | Energetische Massage',
  'How does relaxation begin? A brief guide on breath rhythm, nervous system tone, and why pacing matters in energetic massage.',
  'breath,relaxation,nervous system,mindfulness,energetic massage,bonn',
  NOW(3),NOW(3)
),
(
  UUID(),
  @PAGE_BLOG_6,
  'de',
  'Atmung und Nervensystem: Wie tiefe Entspannung beginnt',
  'atmung-nervensystem-entspannung',
  CONCAT(
    '{"html":"',
    REPLACE(REPLACE(REPLACE(CONCAT(
      '<h2>Entspannung beginnt im Körper</h2>',
      '<p>Entspannung startet oft nicht damit, den Kopf „still" zu machen, sondern damit, dem Körper Sicherheit zu geben. Der Atemrhythmus kann den Tonus des Nervensystems beeinflussen.</p>',

      '<h3>Eine einfache Übung</h3>',
      '<ol>',
      '<li>Finden Sie einen bequemen Sitz.</li>',
      '<li>Durch die Nase einatmen, die Ausatmung sanft verlängern.</li>',
      '<li>Schultern lösen und den Boden unter sich wahrnehmen.</li>',
      '<li>2-3 Minuten nur den Rhythmus verfolgen.</li>',
      '</ol>',

      '<h3>Bezug zur Massage</h3>',
      '<p>In der energetischen Massage arbeiten Berührungs-Tempo und Atmung zusammen - das kann den Übergang aus dem „Eile-Modus" in Ruhe unterstützen.</p>',

      '<p><em>Hinweis:</em> Dieser Beitrag ist allgemeine Information und ersetzt keine medizinische Beratung.</p>'
    ), '"', '\"'), '\n', '\\n'), '\r', ''),
    '"}'
  ),
  'Atemrhythmus und Nervensystem: kurze Übung und warum Rhythmus in der energetischen Massage den Wechsel in Ruhe unterstützen kann.',
  'Atmung und Nervensystem',
  'Atmung & Nervensystem | Energetische Massage',
  'Wie beginnt Entspannung? Kurzer Überblick zu Atemrhythmus, Nervensystem und warum Tempo in der energetischen Massage wichtig ist.',
  'atmung,entspannung,nervensystem,achtsamkeit,energetische massage,bonn',
  NOW(3),NOW(3)
)
ON DUPLICATE KEY UPDATE
  `title`              = VALUES(`title`),
  `slug`               = VALUES(`slug`),
  `content`            = VALUES(`content`),
  `summary`            = VALUES(`summary`),
  `featured_image_alt` = VALUES(`featured_image_alt`),
  `meta_title`         = VALUES(`meta_title`),
  `meta_description`   = VALUES(`meta_description`),
  `tags`               = VALUES(`tags`),
  `updated_at`         = VALUES(`updated_at`);

COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
