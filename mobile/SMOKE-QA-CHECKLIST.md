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

- Booking için Iyzipay checkout açılır.
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
- Danışman medya yanıtını kaydeder/yükler.
- Danışan `media-messages` ekranında `expo-audio`/`expo-video` ile yanıtı oynatır.
- iOS/Android sandbox IAP kredi ve abonelik restore akışları backend receipt doğrulamasına düşer.
