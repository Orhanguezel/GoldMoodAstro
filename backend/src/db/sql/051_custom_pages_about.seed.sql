-- =============================================================
-- FILE: 051_custom_pages_about.seed.sql (FINAL / FULL)
-- Energetische Massage — Kurumsal Sayfalar (About / Hakkımda / Über mich)
-- ✅ module_key PARENT: custom_pages.module_key = 'about'
-- ✅ NO categories + sub_categories
-- ✅ images + storage_image_ids JSON-string güvenli yazılır
-- ✅ TR / EN / DE içerik
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

START TRANSACTION;

-- -------------------------------------------------------------
-- SABİT SAYFA ID (custom_pages.id)
-- -------------------------------------------------------------
SET @PAGE_ABOUT := '11111111-2222-3333-4444-555555555573';

-- -------------------------------------------------------------
-- PARENT MODULE KEY
-- -------------------------------------------------------------
SET @MODULE_KEY := 'about';

-- -------------------------------------------------------------
-- GÖRSEL URL''LERİ
-- -------------------------------------------------------------
SET @IMG_ABOUT_MAIN :=
  '/uploads/anas-3.jpg';

-- Ek görseller (seyahatler / atmosfer)
SET @IMG_ABOUT_2 := 'https://images.unsplash.com/photo-1526779259212-939e64788e3c?auto=format&fit=crop&w=1600&q=80';
SET @IMG_ABOUT_3 := 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1600&q=80';
SET @IMG_ABOUT_4 := 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80';

SET @IMAGES_JSON := JSON_ARRAY(@IMG_ABOUT_MAIN, @IMG_ABOUT_2, @IMG_ABOUT_3, @IMG_ABOUT_4);
SET @STORAGE_IMAGE_IDS_JSON := JSON_ARRAY();

-- -------------------------------------------------------------
-- PARENT UPSERT (custom_pages)
-- -------------------------------------------------------------
INSERT INTO `custom_pages`
  (`id`,
   `module_key`,
   `is_published`,
   `featured`,
   `display_order`,
   `order_num`,
   `featured_image`,
   `featured_image_asset_id`,
   `image_url`,
   `storage_asset_id`,
   `images`,
   `storage_image_ids`,
   `created_at`,
   `updated_at`)
VALUES
  (
    @PAGE_ABOUT,
    @MODULE_KEY,
    1,
    0,
    10,
    10,
    @IMG_ABOUT_MAIN,
    NULL,
    @IMG_ABOUT_MAIN,
    NULL,
    CAST(@IMAGES_JSON AS CHAR),
    CAST(@STORAGE_IMAGE_IDS_JSON AS CHAR),
    NOW(3),
    NOW(3)
  )
ON DUPLICATE KEY UPDATE
  `module_key`               = VALUES(`module_key`),
  `is_published`             = VALUES(`is_published`),
  `featured`                 = VALUES(`featured`),
  `display_order`            = VALUES(`display_order`),
  `order_num`                = VALUES(`order_num`),
  `featured_image`           = VALUES(`featured_image`),
  `featured_image_asset_id`  = VALUES(`featured_image_asset_id`),
  `image_url`                = VALUES(`image_url`),
  `storage_asset_id`         = VALUES(`storage_asset_id`),
  `images`                   = VALUES(`images`),
  `storage_image_ids`        = VALUES(`storage_image_ids`),
  `updated_at`               = VALUES(`updated_at`);

-- -------------------------------------------------------------
-- I18N UPSERT - TR / EN / DE
-- -------------------------------------------------------------
INSERT INTO `custom_pages_i18n`
  (`id`,
   `page_id`,
   `locale`,
   `title`,
   `slug`,
   `content`,
   `summary`,
   `featured_image_alt`,
   `meta_title`,
   `meta_description`,
   `tags`,
   `created_at`,
   `updated_at`)
VALUES

-- =========================
-- DE — Über mich
-- =========================
(
  UUID(),
  @PAGE_ABOUT,
  'de',
  'Über mich',
  'ueber-mich',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<h2>Hallo, ich bin Anastasia König</h2>',
      '<p>In Bonn lade ich Sie bei <strong>Energetische Massage</strong> zu energetischen Massagen in ruhiger Atmosphäre ein. ',
      'Mein Fokus richtet sich nach innen: ankommen, loslassen, zur Ruhe finden - ohne Erwartungen. ',
      'Schon in meiner Weiterbildung in Thailand habe ich bemerkt, dass nicht nur die Hände für die Massage wichtig sind, ',
      'sondern die Gedanken, die man bei der Massage hat.</p>',

      '<p>In der Regel fange ich mit der <strong>Dankbarkeit</strong> an. Ich schließe meine Augen und beginne: ',
      '<em>Danke für meine heilenden Hände, danke für diesen Kunden, danke für diese Arbeit…</em> ',
      'Irgendwann spüre ich ein warmes Gefühl in der Brust, als ob mich diese Dankbarkeit umarmt ',
      'und ich ein wohliges Gefühl aus dem Herzen ausstrahle.</p>',

      '<p>Erst dann fange ich an, für dich vom Universum zu bitten. Jede Seele braucht immer etwas anderes. ',
      'Der eine mehr Selbstliebe - vielleicht mehr Durchhaltevermögen beim Aufhören mit dem Rauchen, ',
      'der andere mehr Selbstliebe beim Abnehmen. Jeder ist individuell, so auch die Bitten an das Universum. ',
      'Ich bitte zum Beispiel für mehr Selbstliebe, mehr Geduld, mehr Mut, mehr Klarheit, mehr Liebe, mehr Gesundheit… ',
      'Es ist immer individuell. Es ist immer das, was die Seele gerade braucht.</p>',

      '<p>Und dann fange ich an zu massieren. Ich spüre die Muskeln und die feinen Spannungen oft noch genauer ',
      'und kann Impulse setzen, die den Energiefluss unterstützen. So entsteht eine <strong>energetische Entspannungsmassage</strong>.</p>',

      '<h3>Meine Arbeitsweise</h3>',
      '<p>Während der Behandlung arbeite ich häufig mit geschlossenen Augen. Das unterstützt mich dabei, ',
      'präsenter zu bleiben und feine Spannungsmuster, Atmung und Signale des Nervensystems bewusst wahrzunehmen.</p>',

      '<h3>Reisen & Ausbildung</h3>',
      '<p>Techniken, die ich u. a. in Thailand und auf meinen Reisen gelernt habe, fließen in meine Arbeit ein. ',
      'Über die Jahre hat sich daraus eine intuitive, achtsame Praxis entwickelt - immer individuell und respektvoll.</p>',

      '<h3>Klare Grenzen, Vertrauen und Hygiene</h3>',
      '<p>Mir sind <strong>klare Grenzen</strong>, Sicherheit und ein wertschätzender Umgang sehr wichtig. ',
      'Der Raum wird sorgfältig vorbereitet; Hygiene ist selbstverständlich.</p>',

      '<h3>Termin</h3>',
      '<ul>',
      '<li>Nach Vereinbarung.</li>',
      '<li>Nur nach kurzem Vorgespräch und Einverständnis.</li>',
      '</ul>',

      '<p><em>Hinweis:</em> Die Sitzungen ersetzen keine medizinische Diagnose oder Behandlung. ',
      'Im Mittelpunkt stehen Entspannung und Körperwahrnehmung.</p>'
    )
  ),
  'Energetische Massage in Bonn: achtsame Berührung, Dankbarkeit und individuelle Impulse für Körper und Seele. Termine nach Vereinbarung.',
  'Anastasia König — Energetische Massage',
  'Energetische Massage | Über mich',
  'Energetische Massage in Bonn: achtsame Berührung, klare Grenzen und ein sicherer Raum. Individuelle Sitzungen mit Dankbarkeit und Intuition.',
  'energetische massage,bonn,energetische massage,anastasia koenig,energetische massage bonn,entspannung,koerperwahrnehmung,thai yoga massage,intuitiv,dankbarkeit',
  NOW(3),
  NOW(3)
),

-- =========================
-- TR — Hakkımda
-- =========================
(
  UUID(),
  @PAGE_ABOUT,
  'tr',
  'Hakkımda',
  'hakkimda',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<h2>Merhaba, ben Anastasia König</h2>',
      '<p>Bonn''da <strong>Energetische Massage</strong> ile sakin bir atmosferde enerjetik masaj seansları sunuyorum. ',
      'Odak noktam içe dönüktür: varmak, bırakmak, huzur bulmak - beklentisiz. ',
      'Tayland''daki eğitimimde fark ettim ki masaj için sadece eller değil, ',
      'masaj sırasında taşınan düşünceler de çok önemli.</p>',

      '<p>Genellikle <strong>şükran</strong> ile başlarım. Gözlerimi kapatır ve başlarım: ',
      '<em>Şifa veren ellerim için teşekkürler, bu danışan için teşekkürler, bu iş için teşekkürler…</em> ',
      'Bir süre sonra göğsümde sıcak bir his belirir; sanki bu şükran beni sarmalamış ',
      've kalpten gelen hoş bir duygu yayılıyor.</p>',

      '<p>Ancak o zaman senin için evrenden dilekte bulunmaya başlarım. Her ruh her zaman farklı bir şeye ihtiyaç duyar. ',
      'Biri daha fazla özsevgi - belki sigarayı bırakmada daha fazla dayanıklılık, ',
      'diğeri kilo vermede daha fazla özsevgi. Herkes bireyseldir, evrendeki dilekler de öyle. ',
      'Örneğin daha fazla özsevgi, daha fazla sabır, daha fazla cesaret, daha fazla netlik, daha fazla sevgi, daha fazla sağlık dilerim… ',
      'Her zaman bireyseldir. Her zaman ruhun o an neye ihtiyacı varsa odur.</p>',

      '<p>Ve sonra masaja başlarım. Kasları ve ince gerilimleri daha hassas hissederim ',
      've enerji akışını destekleyen impulslar verebilirim. Böylece bir <strong>enerjetik rahatlama masajı</strong> ortaya çıkar.</p>',

      '<h3>Çalışma yöntemim</h3>',
      '<p>Seans sırasında çoğu zaman gözlerim kapalı çalışırım. Bu bana daha mevcut kalmamda, ',
      'ince gerilim kalıplarını, nefes ritmini ve sinir sisteminin sinyallerini bilinçli olarak algılamamda yardımcı olur.</p>',

      '<h3>Seyahatler & eğitim</h3>',
      '<p>Tayland başta olmak üzere seyahatlerimde öğrendiğim teknikler çalışmama yansır. ',
      'Yıllar içinde bunlardan sezgisel, dikkatli bir pratik gelişti - her zaman bireysel ve saygılı.</p>',

      '<h3>Net sınırlar, güven ve hijyen</h3>',
      '<p><strong>Net sınırlar</strong>, güvenlik ve saygılı bir iletişim benim için çok önemlidir. ',
      'Ortam her randevu için özenle hazırlanır; hijyen doğal bir gerekliliktir.</p>',

      '<h3>Randevu</h3>',
      '<ul>',
      '<li>Randevu ile.</li>',
      '<li>Yalnızca kısa bir ön görüşme ve karşılıklı onay ile.</li>',
      '</ul>',

      '<p><em>Not:</em> Seanslar tıbbi tanı veya tedavinin yerine geçmez. ',
      'Odak noktası rahatlama ve beden farkındalığını desteklemektir.</p>'
    )
  ),
  'Bonn''da enerjetik masaj: şükran, bilinçli dokunuş ve beden ile ruh için bireysel impulslar. Randevu ile.',
  'Anastasia König — Energetische Massage',
  'Energetische Massage | Hakkımda',
  'Bonn''da enerjetik masaj seansları: sakin atmosfer, bilinçli dokunuş, güvenli alan ve net sınırlar. Şükran ve sezgiyle bireysel seanslar.',
  'energetische massage,bonn,enerjetik masaj,anastasia koenig,energetische massage bonn,rahatlama,beden farkindaligi,thai masaj,sezgisel seans,sukran',
  NOW(3),
  NOW(3)
),

-- =========================
-- EN — About
-- =========================
(
  UUID(),
  @PAGE_ABOUT,
  'en',
  'About',
  'about',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<h2>Hello, I''m Anastasia König</h2>',
      '<p>In Bonn, I welcome you to <strong>Energetische Massage</strong> for energetic massage sessions in a calm atmosphere. ',
      'My focus is directed inward: arriving, letting go, finding peace - without expectations. ',
      'During my training in Thailand, I realized that it''s not just the hands that matter in massage, ',
      'but the thoughts you carry during the treatment.</p>',

      '<p>I usually begin with <strong>gratitude</strong>. I close my eyes and start: ',
      '<em>Thank you for my healing hands, thank you for this client, thank you for this work…</em> ',
      'At some point, I feel a warm sensation in my chest, as if this gratitude is embracing me ',
      'and a comforting feeling radiates from my heart.</p>',

      '<p>Only then do I begin to ask the universe on your behalf. Every soul always needs something different. ',
      'One person needs more self-love - perhaps more perseverance in quitting smoking, ',
      'another needs more self-love in losing weight. Everyone is individual, and so are the requests to the universe. ',
      'I ask for more self-love, more patience, more courage, more clarity, more love, more health… ',
      'It is always individual. It is always what the soul needs at that moment.</p>',

      '<p>And then I begin to massage. I sense the muscles and subtle tensions even more precisely ',
      'and can set impulses that support the energy flow. This is how an <strong>energetic relaxation massage</strong> is created.</p>',

      '<h3>How I work</h3>',
      '<p>During treatment, I often work with my eyes closed. This helps me stay more present ',
      'and consciously perceive subtle tension patterns, breathing rhythm, and signals from the nervous system.</p>',

      '<h3>Travel & training</h3>',
      '<p>Techniques I learned in Thailand and on my other travels flow into my work. ',
      'Over the years, an intuitive, mindful practice has developed - always individual and respectful.</p>',

      '<h3>Clear boundaries, trust, and hygiene</h3>',
      '<p><strong>Clear boundaries</strong>, safety, and respectful interaction are very important to me. ',
      'The space is carefully prepared for each appointment; hygiene goes without saying.</p>',

      '<h3>Appointments</h3>',
      '<ul>',
      '<li>By arrangement.</li>',
      '<li>Only after a short preliminary conversation and mutual consent.</li>',
      '</ul>',

      '<p><em>Note:</em> Sessions do not replace medical diagnosis or treatment. ',
      'The focus is on relaxation and supporting body awareness.</p>'
    )
  ),
  'Energetic massage in Bonn: gratitude, mindful touch, and individual impulses for body and soul. By appointment.',
  'Anastasia König — Energetische Massage',
  'Energetische Massage | About',
  'Energetic massage in Bonn: mindful touch, clear boundaries, and a safe space. Individual sessions with gratitude and intuition.',
  'energetische massage,bonn,energetic massage,anastasia koenig,energetische massage bonn,relaxation,body awareness,thai yoga massage,intuitive session,gratitude',
  NOW(3),
  NOW(3)
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
