# GoldMoodAstro Mobile Smoke QA Checklist

Bu liste store/dev-client build alındıktan sonra gerçek iOS ve Android cihazda koşulur.

## 1. Auth

- Yeni danışan hesabı oluştur: KVKK/rules kabulü zorunlu görünmeli.
- Email + şifre ile çıkış/giriş yap.
- Access token süresi dolmuş gibi 401 senaryosunda refresh token ile otomatik retry doğrula.
- Şifre sıfırlama isteği gönder: mobil deep link veya kod akışı reset ekranına ulaşmalı.

## 2. Booking

- Danışman listesi açılır, online/presence bilgisi görünür.
- Danışman detayında hizmet seç, süre ve media type alanları doğru fiyatı üretir.
- Interval availability üzerinden slot seç.
- Booking create sonrası detay ekranında randevu bilgileri doğru görünür.

## 3. Payment

- Booking için Stripe Checkout açılır; başarılı ve `status=cancelled` dönüşleri ayrı doğrulanır.
- Başarılı dönüş kullanıcıyı randevularım ekranına yönlendirir.
- Hatalı/iptal dönüş tekrar dene mesajı gösterir.

## 4. Call

- Randevu saatinde danışan ve danışman call ekranına girebilir.
- Audio seans mikrofon izni, mute ve görüşmeden çıkış akışları çalışır.
- Video seans kamera izni, kamera değişimi ve hoparlör davranışı kontrol edilir.

## 5. Push

- Login sonrası FCM token backend'e kaydolur.
- Logout sonrası unregister çağrısı yapılır.
- Booking reminder, incoming_call, favorite_online ve media_message bildirimleri doğru ekrana deep link eder.

## 6. Media & IAP

- Danışan sesli/görüntülü medya soru gönderir.
- Sesli soru mikrofonla kaydedilip durdurulduğunda yalnız başarılı soru kaydıyla birlikte ücret düşer; 29,99 TL için 300 kredi beklenir. Ücret değişirse eski fiyat onayıyla gönderim reddedilir.
- Kredi yetersizliğinde kredi mağazasına gidilebilir; danışman yanıt süresi dolarsa gerçek düşülen kredi tam iade edilir. Son anda gelen yanıtla iade aynı soruda birlikte oluşmaz.
- Danışman medya yanıtını kaydeder/yükler.
- Danışan `media-messages` ekranında `expo-audio`/`expo-video` ile yanıtı oynatır.
- Danışan yanıtı, danışman soruyu şikâyet eder; kayıt admin medya şikâyet kuyruğunda incelenir.
- Her iki rol medya konuşmasında karşı tarafı engelleyip engeli kaldırır; engel varken soru/yanıt sunucuda reddedilir.
- İlk medya sorusu ve ilk danışman yanıtı için kullanım şartı kabulü istenir; web ve mobil davranışı karşılaştırılır.
- iOS/Android sandbox IAP kredi ve abonelik restore akışları backend receipt doğrulamasına düşer.
- Her iki mağazada aylık/yıllık abonelik ve üç kredi paketi yerel para birimiyle görünür; bulunmayan ürün satın alınamaz.
- Aylık makbuzla yıllık plan, yanlış kredi SKU'su ve aynı işlem için paralel tekrar doğrulama reddedilir veya tek kez hak tanır.
- Genel içerik WebView'inden kredi/abonelik web ödeme yoluna gidilemez; bire bir canlı randevu Stripe akışı çalışır.

## 7. Mesaj güvenliği ve hesap silme

- Danışan ve danışman hesapları mesajı şikâyet eder; admin şikâyet kuyruğunda kayıt görünür ve incelenebilir.
- İki yönde ayrı ayrı engelleme sonrası REST ve WebSocket üzerinden mesaj gönderimi reddedilir; engel kaldırılınca akış geri gelir.
- Sosyal giriş yapan kullanıcı ilk mesajdan önce kullanım şartlarını kabul eder; aynı davranış web ve mobilde çalışır.
- Hesap silme talebi web/mobilde oluşur; aktif mağaza aboneliği için yönetim bağlantısı görünür. Apple ile girişte yeniden yetkilendirme ve iptal sonucu cihazda doğrulanır.
- Silme taramasında hata simülasyonu talebi beklemede bırakır; sonraki tarama başarılı olur. Veritabanı dışındaki dosyalar ve yasal saklanan kayıtlar ayrıca denetlenir.
