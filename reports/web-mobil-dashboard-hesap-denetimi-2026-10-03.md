# Web ve mobil dashboard / hesap denetimi — 2026-10-03

## Kapsam ve kanıt sınırı

Web kullanıcı paneli (`frontend/src/app/[locale]/dashboard/page.tsx`), web danışman paneli (`frontend/src/components/containers/consultant-dashboard/`), Expo ekranları (`mobile/app/app/`), mobil API adaptörü ve paylaşılan danışman API'si kaynak kodundan karşılaştırıldı. Bu denetimde üretim hesabına giriş, randevu/ödeme işlemi, gerçek cihazda danışman akışı veya iki taraflı görüşme yapılmadı. Bu nedenle aşağıdaki “var” durumu kodda işlev bulunduğunu gösterir; canlı kabul anlamına gelmez.

Karar ilkesi: Aynı hesabın rolü, bakiyesi, yayın durumu, müsaitliği ve randevusu iki yüzeyde aynı sunucu kaynağından okunmalı. Mobil, web sayfasının sekmelerini kopyalamak yerine 4–5 ana hedef ve eylem odaklı hesap menüsü kullanmalı.

## En yüksek öncelikli bulgular

| Öncelik | Bulgular ve kanıt | Etki | Kabul ölçütü |
|---|---|---|---|
| P0 | Mobil danışman müsaitliği `ensureSevenDays()` içinde gün başına yalnız `find()` ile ilk aralığı alıyor (`mobile/app/app/(consultant)/consultant/availability.tsx:91-105`). Kaydetme tam listeyi gönderiyor (`:133-137`); sunucu önce tüm çalışma saatlerini siliyor (`packages/shared-backend/modules/consultantSelf/controller.ts:2559-2567`). Web bir güne çoklu aralık ekliyor (`frontend/src/components/containers/consultant-dashboard/AvailabilityPanel.tsx:485-539`). | Webdeki ikinci vardiya mobil kaydetmeyle silinebilir. | Çoklu aralık ekle/düzenle/sil ve tam listeyi koru; en azından desteklenmeyen veriyi kaydetmeyi engelle. Webde iki aralık → mobil düzenle → webde iki aralık kabul testi. |
| P0 | Mobil `today.tsx:267-287` tarih/motor verisi olmadan “Merkür Gerilemesi”, “Güneş - Jüpiter Üçgeni” ve “Şans ve bolluk” ifadelerini gösteriyor. | Projenin motorla hesaplanmış astroloji ve yasak içerik kurallarıyla çelişen, günlerce yanlış kalabilen iddialar. | Sabit iddiaları kaldır; yalnız `daySky`/sunucu kaynaklı ve moderasyondan geçen tarihli veri göster. TR/EN/DE boş ve hata durumlarını doğrula. |
| P0 | Kredi controller'ı `user.id` kullanıyor (`packages/shared-backend/modules/credits/controller.ts:175-188,415,467,638`), fakat `requireAuth` JWT payload'ını `req.user` olarak bırakıyor (`middleware/auth.ts:29-56`) ve token `sub` içeriyor (`modules/auth/helpers/core.ts:79-83`). Diğer modüllerde ortak yardımcı `sub || id` okuyor (`modules/_shared/route-helpers.ts:31-36`). | Kaynak koduna göre web ve mobil kredi bakiye/satın alma/fiş doğrulama uçları yanlış kullanıcı kimliğiyle çalışır. Canlı sunucudaki davranış henüz doğrulanmadı. | Tüm kredi uçlarında ortak `getAuthUserId` ile kimlik çıkar; ayrı hesaplarla bakiye/satın alma/fiş testleri, kullanıcılar arası veri sızıntısı kontrolü. |
| P0 | Mobil bildirim istemcisi `/notifications/me`, `/:id/read`, `/read-all` çağırıyor (`mobile/app/src/lib/api.ts:1020-1029`); kayıtlı backend yolları `/notifications`, `/:id`, `/mark-all-read` (`packages/shared-backend/modules/notifications/router.ts:17-38`). İstemci `items`, sunucu `{data}` dönüyor (`notifications/controller.ts:25-45`). | Bildirim listesi ve okundu işlemleri kod sözleşmesine göre 404/boş görünüm üretir. Misafirde yükleme durumu kapanmıyor (`mobile/app/app/notifications.tsx:166-181`). | Aynı uç ve yanıt zarfı; liste/tekil okundu/tümü okundu/misafir/hata mobil testleri. |
| P0 | Danışman alanında 9 sabit alt sekme var (`mobile/app/app/(consultant)/_layout.tsx:43-129`), çubuk Android'de 64 px. | Küçük ekranda temel işler erişilemez veya okunamaz olabilir; henüz danışman hesabıyla cihazda doğrulanmadı. | En çok 4–5 ana bölüm; hizmet/KYC/analitik gibi işler “Diğer” altında. 320/390 px gerçek render, etiket ve dokunma alanı testi. |
| P1 | Mobil kullanıcı Profil → “Profil Bilgileri” `Pressable` eylemsiz (`mobile/app/app/(tabs)/profile/index.tsx:285-291`); düzenleme ekranı mevcut (`mobile/app/app/me/settings.tsx:77-145`). | Temel hesap işlemi menüden açılamıyor. | Profil satırı düzenlemeyi açmalı; geri dönüş ve kaydetme cihazda doğrulanmalı. |
| P1 | Mobil danışman randevuları yalnız kabul/red gösteriyor (`mobile/app/app/(consultant)/consultant/bookings.tsx:105-163,229-240`); web gerekçeli iptal, özel not ve onaylı randevu görüşme bağlantısı sunuyor (`ConsultantDashboard.tsx:1287-1340,1473-1506`). | Danışman web olmadan planlanmış seansı yönetemiyor veya seansa katılamıyor. | Sunucudaki aynı randevu durum makinesini kullan; gerekçe, not ve çağrı penceresini mobilde aç; iki taraflı cihaz testi. |
| P1 | Mobil danışman profilinde eski `supports_video` ve `video_session_price` değişiyor (`mobile/app/app/(consultant)/consultant/profile.tsx:137-154,267-279`); güncel web medya tipini hizmet bazında seçiyor (`ServicesPanel.tsx:250-359`). | Tek hesapta iki farklı fiyat/medya kararı görünür. | Mobil hizmet formunda her hizmetin medya tipi ve fiyatı tek kaynak olsun; eski profil anahtarlarını düzenleme yüzeyinden çıkarma kararı sözleşmeyle uyumlu verilsin. |
| P1 | Mobil profil üyelik/kredi/kampanyayı tek `Promise.all` içinde yükleyip tek hatada hiçbirini güncellemiyor (`mobile/app/app/(tabs)/profile/index.tsx:122-139`); eksik kredi `0`, eksik üyelik “Standart” gibi görünebiliyor (`:228-243`). Mobil danışman özetinde de istatistik hatası sessizce sıfır gösteriliyor (`consultant/index.tsx:49-59,104-129`). | API hatası gerçek hesap durumuyla karışır. | Her kart bağımsız yüklenmeli; bilinmeyen/hata, boş ve gerçek sıfır ayrı gösterilmeli; retry sunulmalı. |
| P1 | `me/settings.tsx:247-254` içindeki “Hesabımı Sil” onayında destructive düğmenin `onPress` işlemi yok; gerçek KVKK/silme akışı `app/(tabs)/profile/privacy.tsx` içinde. | Kullanıcı silme isteği verdiğini sanabilir. | Eylemi gerçek gizlilik isteğine yönlendir veya aynı API akışını bağla; durum geri okuma testi. |

## Kullanıcı hesabı: web ↔ mobil

Web `/dashboard` sekiz bölüm içerir: özet, profil, randevular, mesajlar, medya, favoriler, geçmiş, güvenlik (`frontend/src/app/[locale]/dashboard/page.tsx:55-57,490-499`). Mobilin beş genel alt sekmesi ve Profil menüsü telefon için daha uygun bir temel (`mobile/app/app/(tabs)/_layout.tsx:19-84`), fakat hesap görevlerine giriş eksik.

| Alan | Web | Mobil | Denetim sonucu |
|---|---|---|---|
| Profil | Ad, telefon, adres, şehir, avatar düzenleme (`dashboard/page.tsx:638-700`) | Ad, avatar, bildirim tercihi (`app/me/settings.tsx:77-145`) | Menü bağlantısı yok; alan kapsamı farklı. |
| Randevu | Liste, görüşme, mesaj, tamamlanan seans değerlendirme (`dashboard/page.tsx:706-817`) | Yaklaşan/geçmiş, çağrı ve mesaj (`app/(tabs)/bookings.tsx`) | Temel akış var; mobil hata/boş durum ayrımı eksik. |
| Mesaj | Gelen kutusu ve okunmamış durum (`UserMessagesPanel.tsx`) | Sohbet randevu/danışman üzerinden açılıyor; API'de thread listesi mevcut (`mobile/app/src/lib/api.ts:984`) | Hesap menüsünde gelen kutusu yok. |
| Medya sorusu | Liste/yanıt (`dashboard/page.tsx:831-902`) | Native liste/yanıt (`app/media-messages/index.tsx`) | Kod düzeyinde yakın. |
| Favoriler | Dashboard sekmesi (`dashboard/page.tsx:904-995`) | Native ekran (`app/(tabs)/favorites.tsx`) | Profil menüsünde doğrudan giriş yok. |
| Okuma geçmişi | Tür filtreleri, aç/sil (`dashboard/page.tsx:997-1123`) | Native ekran (`app/me/readings.tsx`) | Profil menüsünde doğrudan giriş yok. |
| Güvenlik/KVKK | Şifre değiştirme (`dashboard/page.tsx:1125-1190`), dışa aktarma ve silme | Gizlilik ekranı var (`app/(tabs)/profile/privacy.tsx`), şifre değiştirme görünür değil | Silme düğmesi yanıltıcı; güvenlik paritesi eksik. |
| Üyelik/kredi | Web özet kartından fiyatlandırma; dashboardda ayrıntılı bakiye yok | Profil kartları ve native satın alma (`app/(tabs)/profile/subscription.tsx`, `credits.tsx`) | Mobil bazı hesap bilgilerini webden iyi görünür kılıyor; hata durumları düzelmeli. |
| Doğum bilgisi | Profil/harita akışı | Onboarding/harita ve ayarlarda görünüm | Düzenleme girişi gerçek kullanıcıyla doğrulanmalı. |

Mobil “Bugün” keşif odaklı; hesap özeti değil (`app/(tabs)/today.tsx`). Webin tüm kartlarını buraya taşımak yerine yakın randevu, cevap bekleyen mesaj ve hesapta yapılması gereken işlem gibi en fazla birkaç eylem kartı; tam listeye Profil'den geçiş önerilir.

## Danışman hesabı: web ↔ mobil

İki yüzey temelde aynı `/me/consultant/*` API ailesini kullanıyor (`mobile/app/src/lib/api.ts:650-780`). Webde 12 bölüm var (`ConsultantDashboard.tsx:77-92`); mobilde özet, randevu, müsaitlik, cüzdan, mesaj, medya, yorum, KYC ve profil dokuz alt sekmede. Mobildeki profil ekranı hizmet oluştur/aç-kapat/sil de içeriyor (`consultant/profile.tsx:164-229,292-346`).

| Alan | Web | Mobil | Denetim sonucu |
|---|---|---|---|
| Yayın ve profil tamamlama | `publication_status` ve ağırlıklı score/items (`ConsultantDashboard.tsx:320-333`; `consultantSelf/controller.ts:401-419,1539-1585`) | Özet yalnız stats ve kartlar (`consultant/index.tsx:92-177`) | Danışman neden yayında olmadığını ve sıradaki işi göremiyor. |
| Profil kimliği | Foto/galeri, bio, uzmanlık, dil, banka ve diğer alanlar (`ConsultantDashboard.tsx:840-1037`) | Bio, fiyat/süre, müsaitlik, eski video alanları (`consultant/profile.tsx:250-280`) | Yayın ölçütlerinin bir kısmı mobilde tamamlanamıyor. |
| Hizmetler | Düzenleme, sıralama, şablon/öne çıkarma (`ServicesPanel.tsx`) | Oluşturma, durum, silme | Temel yönetim var; hizmeti düzeltmek için web gerekiyor. |
| Müsaitlik | Çoklu aralık, günlük çizgi, geçici blok | Tek aralık/gün ve blok | Kaydetme veri kaybı riski. |
| Randevu | Kabul/red/iptal/not/görüşme | Kabul/red; anlık talep kabulünden sonra çağrı | Planlı görüşmeye giriş eksik. |
| Mesaj/medya/yorum | Ayrı paneller | Native ekranlar | Temel API eşliği var; cihaz kabulü yapılmalı. |
| Cüzdan | Brüt/net, komisyon ve ödeme döngüsü; KYC/minimuma göre çekim (`WalletPanel.tsx:101-111,220-259`) | Bakiye/net ve talep; sunucu hata kodlarını açıklıyor (`consultant/wallet.tsx:98-128,173-184`) | Kural sunucuda korunuyor; mobil ön koşulları işlem öncesi göstermeli. |
| Danışanlar/analitik/blog | Ayrı paneller | Native karşılık yok | İkincil menüde veya mobil için sade karşılıkta ele alınmalı. |

Web heartbeat'i onaylı, müsait ve sayfa görünür danışmana bağlıyor (`ConsultantDashboard.tsx:146-162`); mobil danışman alanı açık ve uygulama aktifken koşulsuz her dakika gönderiyor (`mobile/app/app/(consultant)/_layout.tsx:14-41`). “Çevrimiçi” anlamı ortak sunucu politikasıyla eşlenmeli.

## Ortak hesap ve dil sözleşmesi

- Backend kayıt/giriş yanıtında `role` string ve `roles[]` dönüyor (`packages/shared-backend/modules/auth/controller.ts:390-413`). Web danışman geçişi hem `roles[]` hem `role` string/nesnesini tanıyor (`dashboard/page.tsx:179-189`); mobil `user.role === 'consultant'` kontrol ediyor (`profile/index.tsx:259`). Bu **kanıtlanmış canlı hata değil**, fakat birden fazla rolü olan hesap ve `/auth/me` şekli için kontrat testi gerekli.
- Mobil danışman layout'u herhangi bir hesap/konuk için heartbeat başlatıyor (`app/(consultant)/_layout.tsx:14-41`); yalnız overview ekranda rol kontrolü var. Sunucu yetkisiz isteği reddetse de diğer sekmeler doğru kilit/başvuru durumunu göstermiyor. Web de ağ hatasını “danışman değil” durumuyla karıştırabiliyor (`ConsultantDashboard.tsx:186`).
- Web ve mobil girişte `next` yalnız `/` ile başlıyor diye kabul ediliyor (`frontend/src/components/containers/auth/Login.tsx:54-57`, `mobile/app/app/auth/login.tsx:194`). `//başka-alan-adı` biçimi için yerel yönlendirme sözleşmesi uygulanmalı; web davranışı gerçek tarayıcıda ayrıca doğrulanmalı.
- Web kullanıcı paneli `ui_*` site ayarlarını, mobil TR/EN/DE paylaşılan sözlüğü kullanıyor. Anlam, durum ve para birimi etiketleri eşlenmeli; `today.tsx` sabit Türkçe başlıkları ve mobil abonelikte `_tr` alan seçimi EN/DE deneyimini ayırıyor.
- Tema mobilde web `design_tokens` kaynağına bağlandı; dashboard denetiminin görsel kabulü ayrıca 320/390 px, açık/kapalı tema ve gerçek hesaplarla yapılmalı.
- İki yüzde de API hatasını boş listeye çeviren yerler var. Web randevu `transformResponse` bilinmeyen zarfı `[]` yapabiliyor; mobil randevu ve profil yükleme hataları kullanıcıya açık durum sunmuyor. Ortak hata zarfı ve `loading / empty / unavailable / value` görünümü tanımlanmalı.

## Geliştirme sırası ve kabul kapıları

1. **Veriyi koru:** Çoklu müsaitlik aralığını mobilde eksiksiz destekle veya mobil kaydetmeyi güvenle durdur. Web → mobil → web regresyonunu otomatik testle.
2. **Ortak hesap API'sini düzelt:** Kredi kullanıcı kimliği ve mobil bildirim yolları/zarfı. İki hesapla yetki ve bakiye testi.
3. **İçeriği düzelt:** Motor verisine bağlı olmayan günlük astroloji iddialarını kaldır. Tarih, dil ve moderasyon kabulü.
4. **Temel hesap işlemleri:** Profil düzenleme ve silme bağlantıları; mesaj kutusu; favoriler/okumalar; şifre değiştirme.
5. **Danışman iş akışı:** Randevu iptal/not/planlı görüşme; yayın durumu/tamamlama; hizmet düzenleme ve hizmet bazlı medya tipi.
6. **Mobil gezinme:** Danışman alanını 4–5 ana hedef ve diğer işler menüsüne indir. 320/390 px, dokunma alanı ve geri davranışı.
7. **Ortak doğruluk:** Bakiye/üyelik/stats hata durumları, rol, para birimi, brüt/net ve TR/EN/DE sözlüğü aynı API örnekleriyle sözleşme testine alın.
8. **Gerçek kabul:** Ayrı kullanıcı ve danışman test hesaplarıyla web ve Android/iOS üzerinde aynı randevu, hizmet, müsaitlik, ödeme, görüşme, mesaj, yorum ve cüzdan verisini karşılaştır. iOS servis dosyası/kimlikler ile gerçek cihaz kabulü ayrıca gerekli.

Bu denetim bundan sonraki web değişikliklerinde ilgili mobil hesap ekranı ve API sözleşmesini, mobil değişikliklerinde ilgili web karşılığını kontrol etme temelidir. Her madde kaynak kodu geçişi ile gerçek hesap/cihaz kabulü olarak ayrı kapatılmalıdır.

## 2026-10-03 uygulama durumu

Yukarıdaki tablolar ilk denetim anındaki bulguları korur. Bu turda kaynak kodu düzeyinde şu düzeltmeler yapıldı:

- Web kullanıcı ve danışman panellerinde API hatası boş liste veya rol reddi gibi gösterilmiyor; tekrar deneme var. Gizlilik durumunun okunması bekleniyor, çıkışta hesap önbelleği temizleniyor ve giriş dönüş yolu yerel URL ile sınırlandı. Yeni hata metinleri `016e_ui_dashboard_errors_seed.sql` içindeki TR/EN/DE `ui_*` anahtarlarında.
- Paylaşılan kredi uçları JWT `sub` kimliğini kullanıyor; çift route kaydı kaldırıldı. Ayrı kullanıcı bakiyesi ve eksik kimlik için üç otomatik test geçti.
- Mobil bildirim uçları ve `{data}` zarfı backend ile eşlendi; misafir, hata ve okundu durumları ayrıldı. Profil kartlarında bağımsız veri isteği, bilinmeyen durum ve tekrar deneme var.
- Mobil profil menüsünden düzenleme, mesajlar, favoriler ve yorum geçmişi açılıyor. Kullanıcı mesaj kutusu webin `/me/customer/threads` sözleşmesini kullanıyor. Profil ayarlarında ad, telefon, adres, şehir ve mevcut şifreyle parola değişimi var; yanıltıcı silme onayı gerçek gizlilik ekranına yönlendiriyor.
- Mobil danışman bir günde çoklu vardiya düzenleyip kaydediyor; beş ana sekme ve Diğer menüsü var. Onaylı randevu görüşme bağlantısı ve gerekçeli iptal eklendi. Yayın durumu/tamamlama backend verisiyle görünüyor; hizmetin sesli/görüntülü tipi, fiyatı ve açıklaması düzenleniyor. İstatistik hatası sıfır/çevrimdışı gibi gösterilmiyor.
- Mobil tema webin `design_tokens` paletini ve Fraunces / Gabriela / Outfit fontlarını kullanıyor. Sabit Merkür gerilemesi ve diğer hesaplanmamış günlük iddialar kaldırıldı. Yeni mobil metinler TR/EN/DE ortak sözlüğe ve SQL snapshot'ına işlendi.
- Mobil simge ve açılış görseli webdeki aynı GM logosundan kopyalandı; Android açılış/ikon/bildirim renkleri seed token'larına bağlandı. `gen:theme-snapshot` ve `check:theme` bu eşleşmeyi üretip denetliyor. `expo-system-ui` ile yerel açık görünüm ayarı etkinleştirildi; uzaktan gelen koyu arka planda status bar simgeleri açık renge geçiyor.

Kaynak kodu kontrolleri: mobil 54 test, TypeScript ve ESLint (0 hata); frontend TypeScript ve güvenli dönüş yolu 8 testi; backend TypeScript ve kredi izolasyonu 3 testi; tema ve mobil i18n snapshot kontrolleri; Android Metro export. Claude CLI salt okunur incelemesi doğrulanmış P0/P1 regresyon bulmadı. Bunlar üretime dağıtım veya gerçek hesap kabulü değildir. **Açık kabul:** ayrı kullanıcı/danışman hesaplarıyla aynı randevu, müsaitlik, kredi, mesaj, ödeme ve görüşmeyi web ile Android/iOS cihazında karşılaştırmak; 320/390 px oturum açmış hesap render'ı; yeni web `ui_*` seed'inin uygulanması ve canlı TR/EN/DE geri okuması. iOS `GoogleService-Info.plist` çalışma alanında bulunmadığından iOS build kapısı da açık.

### Android emülatör ve son denetim ek kanıtı

- İlk release APK splash sonrasında açılmadı: Android logu kök workspace React 19.2.5 ile React Native renderer 19.1.0 uyuşmazlığını gösterdi. `mobile/app/metro.config.js` tüm `react` ve `react/*` importlarını mobil React 19.1.0'a çözümlüyor; otomatik resolver testi eklendi. Son Android bundle sourcemap'inde yalnız `/mobile/app/node_modules/react/` dosyaları var, kök React dosyası yok.
- Son release APK `assembleRelease --offline` ile üretildi, API 35 emülatöre yüklendi ve `Running "main"` kaydıyla açıldı; ReactNativeJS/AndroidRuntime fatal hata görülmedi. Onboarding → misafir ana sayfa → misafir profil yolu çalıştı. 320 ve 390 dp ekran görüntüleri gözle incelendi. Alt sekme etiketinin Android hareket çubuğuyla çakışması giderildi; 320 dp için “Danışman” kısa etiketi eklendi. Bu **misafir cihaz kabulüdür**; giriş yapmış kullanıcı/danışman kabulü değildir.
- Ek web/mobil denetiminde danışman profil, randevu ve mesaj isteği başarısızlığının boş veri gibi görünmesi düzeltildi; ayrı hata/tekrar dene ve işlem koruması var. Mobil heartbeat artık web gibi onaylı+müsait profilde gönderiliyor; sunucu `findConsultantForUser` zaten bu iki koşulu zorunlu tutuyor. TR/EN/DE mobil sözlüğü ve SQL snapshot güncellendi.
- Son doğrulama: Android release build, mobil TypeScript, Metro React resolver testi, `check:i18n` (1336 anahtar/dil), `check:theme` ve `git diff --check` geçti. Giriş yapmış iki hesabın gerçek veri/ödeme/görüşme karşılaştırması, iOS build ve web `ui_*` seed'inin canlı uygulanması açık kalır.
- Yerel oturum kabulü için 8094 API ve 3095 web portları kontrol edildi; ikisi de çalışmıyordu. Yerel MySQL de yanıt vermedi. Seed dosyalarında test hesapları bulunsa da veritabanını yeniden kurmak veri değişikliği gerektirdiği için bu turda yapılmadı; giriş yapmış iki rolün uçtan uca karşılaştırması gerçek çalışan ortamda bekliyor.
- `check:i18n` anahtar/snapshot eşliğini geçti, ancak mevcut kodda 513 satır içi Türkçe fallback uyarısı raporladı. Bu sayım tek başına EN/DE ekran hatası kanıtı değildir; hesap akışları dil bazında cihazda ayrıca kabul edilmelidir.
