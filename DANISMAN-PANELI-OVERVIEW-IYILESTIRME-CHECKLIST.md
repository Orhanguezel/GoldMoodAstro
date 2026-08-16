# Danışman Paneli Overview İyileştirme Checklist'i

Tarih: 2026-08-16  
Hedef: `/tr/me/consultant?tab=overview`  
Yaklaşım: mobile-first, veri doğruluğu önce, mevcut `design_tokens` ve `ui_*` sözlüğü korunur.

## P0 — İş kuralı ve veri doğruluğu

- [x] `is_available=0` danışmanın panel heartbeat'i nedeniyle `is_online=true` görünmesini engelle. (`presence` guard + frontend ping guard)
- [x] Public `onlineOnly=true` filtresini danışmanın canlı görüşme tercihiyle aynı kurala bağla. (`is_available AND heartbeat`)
- [x] “Bu ay / geçen ay” kartlarını kayan 30 günlük pencere yerine Türkiye saatine göre gerçek takvim aylarıyla hesapla.
- [x] “Toplam seans” kartını güncellenmeyen `consultants.total_sessions` alanı yerine gerçek booking kayıtlarından hesapla.
- [x] Profil yayın durumunu frontend'de tekrar hesaplamak yerine backend'in döndürdüğü tek bir `publication_status` sözleşmesinden göster.
- [x] Public yayın filtresi ve panel yayın açıklamasında aynı eksik alanlar kullanılsın: onay, gizlilik, fiyatlı hizmet/seans, fotoğraf ve public slug.

## P1 — Mobile-first overview hiyerarşisi

- [x] Profil tamamlama skoru, danışman header'ının hemen altında ve metriklerden önce gösterilsin.
- [x] Mobil ilk görünümde skor, kalan eksik sayısı ve net eksik-adım aksiyonları görünür olsun.
- [x] Eksik profil maddesinin tamamı tıklanabilir olsun; yalnız küçük “Git” metnine bağımlı kalmasın.
- [x] Eksik madde tıklanınca URL'deki `tab` parametresi güncellensin ve ilgili sekme içeriği açılsın.
- [x] Sekme değişince sekme şeridine scroll, içerik alanına klavye odağı uygulansın.
- [x] Tamamlanan maddeler ikincil ve açılır bir alanda kalsın; eksikler görsel öncelik taşısın.
- [x] 12 sekmeli navigasyon mobilde tek satır yatay kaydırılabilir olsun; çok satırlı kalabalık üretmesin.
- [x] Header, yayın durumu, skor ve metrikler 390px genişlikte panel kaynaklı taşma üretmesin.
- [x] Sabit site header'ı ile profil kartı arasına cihaz boyutuna göre güvenli üst boşluk koy; kart menüyü kapatmasın.
- [x] Profil kartını mobil uygulama başlığı gibi kompaktlaştır: avatar/kimlik aynı satır, canlılık ve profil aksiyonları dokunmatik alt satır.
- [x] Sekmeleri 76–88px mobil tab rail hücrelerine dönüştür; ikon üstte, uzun başlık ellipsis ve erişilebilir `title` ile gösterilsin.
- [x] Tab rail sayfa kaydırılırken site header'ının altında yapışkan kalsın ve seçili sekmeyi merkeze kaydırsın.

## P1 — Yönlendirme ve içerik kalitesi

- [x] “Profili Gör” bağlantısı UUID yerine varsa public slug kullansın.
- [x] Anonim giriş CTA'sındaki `next` hedefinin kaynak kodda kanonik `/[locale]/me/consultant` olduğu doğrulandı.
- [x] Kazanç kartındaki elle yazılmış `gross/Brutto` kaldırılıp `ui_*` sözlüğüne taşındı.
- [x] Overview'e eklenen bütün metinler TR/EN/DE olarak `siteSettings ui_*` kaynağına eklendi.
- [x] ConsultantDashboard hardcoded-TR artışı temizlendi; dosya `i18n:guard` artış listesinden çıktı.

## P2 — Görsel ve operasyonel takip

- [x] Masaüstü üst menüde 1280px genişlikte kelime kırılmalarını düzelt; tam menüyü yeterli alan olan `2xl` breakpoint'ine taşı.
- [x] Mobil çerez panelini kompakt, kaydırılabilir ve iki sütunlu aksiyon düzenine al; ana danışman header CTA'larını açık bırak.
- [x] Mobil support-chat düğmesini sağ güvenli alanda back-to-top düğmesinin üstüne taşı; skor/eksik satırlarının sol altını örtmesin.
- [x] Google Ads `pagead2.googlesyndication.com` kaynağını `connect-src` CSP izin listesine ekle.
- [x] PM2 heap kullanımı ve geçmiş restart sayısı için ayrı backend sağlık incelemesi yap. (2026-08-16: backend 747MB, `max_memory_restart` 768MB sınırının dibinde — 10 ve 15 Ağustos'ta sınırdan restart; kernel OOM yok; 7-9 Ağustos restart fırtınası frontend kaynaklıydı ve dindi [69 saat uptime]; sunucu load 0.27, disk %26, swap 537MB. Öneri: sınırı 1 GB'a çıkar veya bellek büyümesini profil et — ayrı karar.)

## Kabul kriterleri

- [x] Frontend typecheck geçer.
- [x] Backend typecheck geçer.
- [x] Production frontend build geçer.
- [x] Bu çalışma ConsultantDashboard i18n artışını 15 → 0 düşürdü ve yeni theme bulgusu üretmedi. (Guard'ların genel sonucu ilgisiz mevcut dosyalar nedeniyle hâlâ kırmızı.)
- [x] 390x844 mobil doğrulama: skor ilk içerik bölgesinde, eksik satır tıklaması doğru sekmeyi açıyor.
- [x] 1280px masaüstü doğrulama: skor üstte ve hiyerarşi okunaklı.
- [x] 390x844 mobil uygulama görünümü: profil kartı header'ı kapatmıyor, aksiyonlar 44px dokunma yüksekliğinde ve tab rail tek satır.
- [x] 768x1024 tablet görünümü: profil/score hiyerarşisi taşmadan iki kolonlu aksiyon düzenine geçiyor.
- [x] 1803x804 referans genişliği: 12 sekmenin tamamı tek satırda, Blog seçili durumu ve içerik hizası korunuyor.
- [x] Düzeltilmiş online SQL'i canlı veride doğrulandı: `is_available=0` hesapların tamamı `corrected_is_online=0`.
- [x] Takvim ayı SQL bucket'ı canlı veride çalıştırılarak doğrulandı; istatistik kaynağı confirmed/completed booking kayıtlarıdır.
- [x] Mevcut kirli çalışma ağacındaki ilgisiz değişiklikler korundu.
- [x] Canlı deploy ve kabul testi: build `vH9m-ahPa2E3c4kzaOjLJ`, 390x844 mobil ve 1803x804 masaüstü, sekme deep-link'i, support/back-to-top çakışması ve tarayıcı konsolu (0 hata) doğrulandı.

## Uygulama notları

- Bu checklist önceki canlı/repo incelemesinde bulunan eksiklerden oluşturuldu.
- Bu turda P0 ve danışman overview'üne doğrudan bağlı P1 maddeleri uygulanır.
- Global header, cookie banner ve CSP için düşük riskli düzeltmeler bu turda tamamlandı. Support-chat yerleşimi başka aktif geliştirmelerle aynı dosyada olduğu, PM2 sağlık incelemesi de operasyonel kapsam taşıdığı için ayrı takipte bırakıldı.
- 2026-08-16 devam turu: çerez paneli `z-[10070]` ile FAB'ın üstüne alındı (onay/ret düğmeleri her zaman tıklanabilir), danışman paneli mobil alt boşluğu `pb-40` yapıldı (içerik yükseltilmiş FAB'dan kaydırılarak kurtulabiliyor). Ayrıca lokal fresh `db:seed` pipeline'ı onarıldı: 034/124a/125 Fatma seed'leri Fatma'sız ortamda no-op olacak şekilde gate'lendi, 111 `contact_replies` index'ine utf8mb4 prefix (191) eklendi, 126 Nilay blog yaması `custom_pages` şemasından (197) sonra koşması için 236'ya taşındı.
