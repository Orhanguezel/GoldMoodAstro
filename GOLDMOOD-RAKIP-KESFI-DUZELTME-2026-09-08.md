# GoldMoodAstro Rakip Keşfi — canlı düzeltme ve kabul

8 Eylül 2026, UTC 18:05 civarı. Panel: https://panel.tanitio.com/rakip-kesfi

Kullanıcı: Instagram/Facebook'ta 12 ayrı burç paylaşımı istemiyor; mevcut araçların eksik sanılması, manuel sorgular ve takılan firma önizlemesi uçtan uca kontrol edilecek.

## Doğrulanan nedenler

- Ekran görüntüsündeki `yildizname` canlı kayda aynen taşınmış. Kendi alan adı `goldmoodastro.com` doğru. Brave ilk 20'de kendi alan adını döndürmüyor. Bu sonuç sitenin Yıldızname aracının olmadığını veya Google'da indekslenmediğini kanıtlamaz. https://goldmoodastro.com/tr/yildizname mevcut.
- Yeniden tara düğmesi manuel koşuda bile `limit:30` göndererek GSC sorgularına geçiyordu.
- API 50 manuel sorguya izin verirken çözümleme varsayılan 30'da kesiyordu.
- Sadece SERP sonuçları saklandığı için sıfır sonuçlu sorgu sonraki çalıştırmada kaybolabiliyordu.
- Önizlemede tek global kuyruk vardı; bütün yakalama işlemini sınırlayan zaman aşımı yoktu. Canlı HTTP uzun süre queued dönerken aynı TDV kaynağının bağımsız görüntüsü ~5 sn'de alınabiliyordu.
- AI hafızasında bırakılmış part2/Terazi–Balık serisini destekleyen dört eski otomatik çıkarım aktifti.

## Uygulananlar

- [x] Manuel yeniden tarama aynı sorguları ve derinliği koruyor; GSC'ye geçiş ayrı düğme.
- [x] 50 manuel sorgu korunuyor; birebir tekrarlar ayıklanıyor; boş liste HTTP 400.
- [x] Sorgu girdileri tenant/koşu hash'iyle `backend/storage/competitor-query-manifests/` altında saklanıyor. Dizin storage yedeğine dahil edilmeli. Sonuçsuz sorgular da yeniden taranabilir. Eski eksik koşu sessizce tamamlanmış sayılmıyor; tam liste kullanıcıdan isteniyor.
- [x] Tenant değişince manuel taslak temizleniyor; eski çalıştırma yanıtı yeni görünüme bilgi yazmıyor.
- [x] “Biz: yok” yerine taranan ilk N sonuç sınırı açıklanıyor. İçerik varlığı, Google indeksi ve seçili motor görünürlüğü ayrılıyor. Bing'in ilgisiz sonuç riski ve 'bizden önde' sayacının kendi sonuçlarımızın bulunmadığı sorguları da içerdiği açıklanıyor.
- [x] Önizleme işine 45 sn, DNS'e 6 sn, browser açılışına 10 sn sınır. Takılan iş sonraki tenant'ı engellemiyor; geç gelen sonuç hata kaydını ezmiyor.
- [x] Önizleme hata/yeniden deneme durumu ve cooldown süresi arayüzde güncelleniyor. Kayıtlı görsel yeniden açılışta yeniden taranmıyor.
- [x] Kullanıcı kararı tenant AI hafızasına manuel ve güven 1 olarak kaydedildi. Dört eski part2 çıkarımı pasifleştirildi. Haftalık burç bayrağı `0`; bekleyen/zamanlanmış GoldMood sosyal gönderisi bulunmadı. Sosyal yayın yapılmadı.

## Kabul kanıtı

- 35 test / 83 assertion; tenant scope guard, backend ve dashboard üretim derlemesi başarılı.
- Canlı manuel koşu `3fb9ca51-b247-4aee-8010-7c66435b477b`: 2 sorgu, 40 sonuç, ok.
- Sayfa yenilenip Yeniden tara tıklanınca yakalanan gerçek POST: `{"queries":["yildizname","doğum haritası yorumlama"],"engine":"brave","depth":20}`.
- İkinci koşu `3eee01dd-4d9b-489f-b8a5-3e52c9ba1aed`: 2/2, 40 sonuç, ok; requested_queries aynı sırada saklı; GSC metrikleri manuel olduğu için yok.
- Yandex → Brave seçimi ve firma kartını tekrar açma: sıfır POST; görsel yüklü. TDV capturedAt `2026-09-08T18:02:20.977Z`, sonraki GET'lerde değişmedi.
- Mobil 390×844: yatay taşma yok, önizleme görüntüsü yüklü.
- Boş queries: HTTP 400. GoldMood oturumuyla başka tenant sorgulama: HTTP 403.
- API health: status ok / db ok. İki PM2 servisi online; hedef kaynak/dist checksum eşleşiyor. CSS flex/grid/rounded-xl çıktı içinde doğrulandı.
- Görsel: `../ekosistem-sosyal-medya/output/playwright/goldmood-discovery-preview-fixed-20260908.png` incelendi. JS/dış kaynak kısıtları nedeniyle görüntü kısmi; bu açıkça etiketli.

## Yayın / geri dönüş

Önceki kullanıcının tam deploy yetkisi kapsamında yalnız bu düzeltmelerin backend kaynak/dist dosyaları ve panel üretim paketi yayımlandı. Sunucu `vps-vistainsaat`; `/var/www/ekosistem-sosyal-medya`. Yedek `/var/www/tanitio-releases/discovery-fix-20260908-1800/previous-discovery.tgz` ve `previous-next`. Eski hashli statikler yeni pakette korundu. Env, sosyal üreticiler, şema ve diğer tenant verileri değiştirilmedi.

## Açık sınırlar

Bing sonuç kalitesi garanti edilmiyor; uyarı eklendi, motor sağlayıcısı değişmedi. Google SERP API hesabı henüz yok. Eski sıfır sonuçlu sorgular geçmişte saklanmadığından sonradan uydurulamaz. GoldMood TR sayfasının ilk sunucu HTML'inde bazı İngilizce arayüz metinleri görülüyor; bu ayrı site yerelleştirme işi, Brave yokluğunun kanıtlanmış sebebi değil. Rakip Keşfi tek başına site içerik envanteri denetimi yapmaz.
