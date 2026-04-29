-- =============================================================
-- 0971_astrology_kb_wikipedia_tr_seed.sql
-- T19-4 — Wikipedia TR kaynaklı başlangıç import batch'i.
--
-- Not:
-- - İçerikler doğrudan kopya değil, kısa/parafraz editoryal notlardır.
-- - CC BY-SA gereği source + author alanları atıf için doludur.
-- - is_active=0 ve reviewed_at=NULL: astrolog onay kuyruğuna düşer.
-- =============================================================

INSERT INTO astrology_kb (
  id, kind, key1, key2, key3, locale, title, content, short_summary,
  tone, source, author, is_active, reviewed_by, reviewed_at
) VALUES
(
  '80100000-0000-4000-8000-000000000001',
  'misc', 'wiki_astrology', 'overview', NULL, 'tr',
  'Wikipedia Import — Astrolojiye genel bakış',
  'Astroloji, gök cisimleri ile insan karakteri, davranış örüntüleri ve yaşam olayları arasında anlam ilişkileri kuran tarihsel bir yorum geleneği olarak ele alınır. Modern ürün dilinde bu başlık kesin hüküm veya bilimsel öngörü gibi sunulmamalı; sembolik, kültürel ve kişisel farkındalık odaklı bir çerçevede kullanılmalıdır.',
  'Astrolojiyi kültürel ve sembolik yorum geleneği olarak konumlandıran genel not.',
  'neutral',
  'https://tr.wikipedia.org/wiki/Astroloji',
  'Wikipedia contributors, CC BY-SA 4.0',
  0, NULL, NULL
),
(
  '80100000-0000-4000-8000-000000000002',
  'misc', 'wiki_astrology', 'science_caution', NULL, 'tr',
  'Wikipedia Import — Bilimsel dil uyarısı',
  'Astroloji içerikleri hazırlanırken bilimsel kesinlik iddiası kurulmasından kaçınılmalıdır. Kullanıcıya sunulan yorumlar tekrarlanabilir deneysel sonuç gibi değil, semboller, arketipler ve öz-farkındalık diliyle açıklanan rehber metinler olarak yazılmalıdır.',
  'Astroloji yorumlarında bilimsel kesinlik iddiasından kaçınma notu.',
  'professional',
  'https://tr.wikipedia.org/wiki/Astroloji',
  'Wikipedia contributors, CC BY-SA 4.0',
  0, NULL, NULL
),
(
  '80100000-0000-4000-8000-000000000003',
  'misc', 'wiki_astrology', 'barnum_effect', NULL, 'tr',
  'Wikipedia Import — Barnum etkisi notu',
  'Genel ve olumlu ifadelerin kişiye özel algılanması, astroloji deneyiminde önemli bir psikolojik risk alanıdır. LLM çıktıları bu nedenle aşırı belirsiz, herkes için geçerli cümleleri azaltmalı; kullanıcının doğum verisi, soru bağlamı ve geçmiş etkileşimlerinden gelen özgül ayrıntılarla daha sorumlu bir dil kurmalıdır.',
  'Genel geçer yorumları azaltmak için Barnum etkisi uyarısı.',
  'professional',
  'https://tr.wikipedia.org/wiki/Astroloji',
  'Wikipedia contributors, CC BY-SA 4.0',
  0, NULL, NULL
),
(
  '80100000-0000-4000-8000-000000000004',
  'misc', 'wiki_zodiac', 'geometry', NULL, 'tr',
  'Wikipedia Import — Zodyak geometrisi',
  'Zodyak anlatımında 360 derecelik göksel çemberin sembolik olarak on iki eşit parçaya bölündüğü hatırlatılabilir. Her bölüm 30 derecelik bir alan gibi ele alınır; bu yaklaşım takımyıldız sınırlarından çok astrolojik sembol düzenini anlatır.',
  'Zodyakın on iki eşit sembolik bölüme ayrılması.',
  'neutral',
  'https://tr.wikipedia.org/wiki/Zodyak',
  'Wikipedia contributors, CC BY-SA 4.0',
  0, NULL, NULL
),
(
  '80100000-0000-4000-8000-000000000005',
  'misc', 'wiki_zodiac', 'constellations', NULL, 'tr',
  'Wikipedia Import — Zodyak ve takımyıldızlar',
  'Zodyak kuşağı astronomik takımyıldızlarla ilişkilidir; ancak astrolojide kullanılan burç sembolleri doğrudan modern takımyıldız sınırlarıyla aynı şey değildir. İçeriklerde bu ayrım sade biçimde yapılırsa hem SEO metni hem de kullanıcı güveni güçlenir.',
  'Burç sembolleri ile astronomik takımyıldız sınırları arasındaki ayrım.',
  'neutral',
  'https://tr.wikipedia.org/wiki/Zodyak',
  'Wikipedia contributors, CC BY-SA 4.0',
  0, NULL, NULL
),
(
  '80100000-0000-4000-8000-000000000006',
  'misc', 'wiki_zodiac', 'ecliptic', NULL, 'tr',
  'Wikipedia Import — Ekliptik bağlamı',
  'Burç ve zodyak metinlerinde Güneşin gökyüzündeki görünür yıllık yoluyla ilişkilendirilen ekliptik bağlamı kısa bir arka plan olarak kullanılabilir. Bu bilgi, burç sayfalarında “sadece kişilik etiketi” yerine göksel koordinat ve döngü fikrini anlatmaya yarar.',
  'Ekliptik kavramını burç anlatımlarına bağlayan kısa arka plan.',
  'neutral',
  'https://tr.wikipedia.org/wiki/Bur%C3%A7',
  'Wikipedia contributors, CC BY-SA 4.0',
  0, NULL, NULL
),
(
  '80100000-0000-4000-8000-000000000007',
  'misc', 'wiki_signs', 'elements', NULL, 'tr',
  'Wikipedia Import — Element anlatımı',
  'Ateş, toprak, hava ve su elementleri burç içeriklerinde temel mizacı açıklamak için kullanılabilir. Metinler stereotipleştirmeden kaçınmalı; elementi tek başına kader gibi değil, doğum haritasındaki diğer yerleşimlerle birlikte okunan bir eğilim dili olarak sunmalıdır.',
  'Elementleri stereotipsiz ve harita bütünüyle ilişkilendiren not.',
  'warm',
  'https://tr.wikipedia.org/wiki/Bur%C3%A7',
  'Wikipedia contributors, CC BY-SA 4.0',
  0, NULL, NULL
),
(
  '80100000-0000-4000-8000-000000000008',
  'misc', 'wiki_signs', 'modalities', NULL, 'tr',
  'Wikipedia Import — Modalite anlatımı',
  'Öncü, sabit ve değişken modaliteler burçların hareket tarzını anlatmak için iyi bir editoryal katmandır. Profil metinlerinde modalite; başlama, sürdürme ve uyum sağlama ritimleri üzerinden sade örneklerle açıklanmalıdır.',
  'Modaliteleri hareket tarzı ve ritim diliyle anlatan not.',
  'warm',
  'https://tr.wikipedia.org/wiki/Bur%C3%A7',
  'Wikipedia contributors, CC BY-SA 4.0',
  0, NULL, NULL
),
(
  '80100000-0000-4000-8000-000000000009',
  'misc', 'wiki_birth_chart', 'chart_context', NULL, 'tr',
  'Wikipedia Import — Doğum haritası bağlamı',
  'Burç sayfalarından doğum haritasına geçiş yapılırken kullanıcıya Güneş burcunun tek başına bütün kişiliği açıklamadığı net söylenmelidir. Ay, yükselen, gezegenler, evler ve açılarla birlikte daha katmanlı bir tablo oluşur.',
  'Güneş burcundan doğum haritası bütününe geçiş CTA notu.',
  'professional',
  'https://tr.wikipedia.org/wiki/Bur%C3%A7',
  'Wikipedia contributors, CC BY-SA 4.0',
  0, NULL, NULL
),
(
  '80100000-0000-4000-8000-000000000010',
  'misc', 'wiki_astrology', 'traditions', NULL, 'tr',
  'Wikipedia Import — Astroloji gelenekleri',
  'Astrolojinin farklı kültürlerde çeşitli gelenekler, türler ve uygulama alanları vardır. GoldMoodAstro içeriklerinde bu çeşitlilik, tek bir mutlak sistem anlatısı yerine “yorum okulları” ve “sembolik yaklaşımlar” diliyle aktarılmalıdır.',
  'Farklı astroloji geleneklerini çoğulcu biçimde anlatma notu.',
  'neutral',
  'https://tr.wikipedia.org/wiki/Astroloji',
  'Wikipedia contributors, CC BY-SA 4.0',
  0, NULL, NULL
),
(
  '80100000-0000-4000-8000-000000000011',
  'misc', 'wiki_astrology', 'responsible_copy', NULL, 'tr',
  'Wikipedia Import — Sorumlu metin standardı',
  'Astroloji metinleri korkutucu, kaderci veya kesin sonuç vadeden ifadelerden uzak durmalıdır. Kullanıcı deneyiminde en güvenli çerçeve; olasılık, farkındalık, duygu dili ve seçim alanını vurgulayan rehberlik tonudur.',
  'Kaderci ve korkutucu ifadelerden kaçınan ürün dili standardı.',
  'professional',
  'https://tr.wikipedia.org/wiki/Astroloji',
  'Wikipedia contributors, CC BY-SA 4.0',
  0, NULL, NULL
),
(
  '80100000-0000-4000-8000-000000000012',
  'misc', 'wiki_zodiac', 'editorial_seo', NULL, 'tr',
  'Wikipedia Import — SEO editoryal köprü',
  'Burç, zodyak ve doğum haritası sayfaları birbirine bağlanırken önce temel kavram açıklanmalı, ardından daha kişisel ve detaylı yoruma geçilmelidir. Bu yapı hem arama niyetini karşılar hem de kullanıcıyı doğum haritası ürününe doğal biçimde taşır.',
  'Temel kavramdan kişisel haritaya giden SEO içerik akışı.',
  'professional',
  'https://tr.wikipedia.org/wiki/Zodyak',
  'Wikipedia contributors, CC BY-SA 4.0',
  0, NULL, NULL
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  content = VALUES(content),
  short_summary = VALUES(short_summary),
  tone = VALUES(tone),
  source = VALUES(source),
  author = VALUES(author),
  is_active = VALUES(is_active),
  reviewed_by = VALUES(reviewed_by),
  reviewed_at = VALUES(reviewed_at);

