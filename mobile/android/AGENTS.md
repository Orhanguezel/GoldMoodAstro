# AGENTS.md - GoldMoodAstro Android Native (Deprecated)

Status: Deprecated
Date: 2026-04-24

Android native uygulama aktif gelistirme rotasi degildir.
GoldMoodAstro mobil uygulamanin tek dogru kod tabani Expo projesidir:

- ../app/
- ../AGENTS.md
- ../MOBILE-STRATEGY.md

## Neden Deprecated?

- Urun stratejisi tek kod tabani (Expo) ile iOS + Android ayni anda ilerlemek uzere belirlendi.
- MVP kapsaminda native Kotlin bakim maliyeti gereksizdir.

## Native'e Donus Tetikleyicileri

Asagidaki kosullardan biri olusursa Android native rota tekrar acilabilir:

1. MAU > 1M ve performans/enerji metriklerinde Expo sinirlari
2. Android-only zorunlu API ihtiyaci (Android Auto, Wear OS vb.)
3. Native seviyede ses/video veya arka plan servis optimizasyonu zorunlulugu

## Eger Native Yeniden Acilacaksa

Bu dosya referans belgesi olarak kullanilir; ancak once su kaynaklar esas alinmalidir:

1. ../AGENTS.md icindeki M0-M5 akisi
2. ../MOBILE-STRATEGY.md icindeki urun oncelikleri
3. Backend API kontratlari (localhost:8094/api/v1)

Minimum feature parity hedefi:

1. Auth (login/register/session)
2. Consultant listing + detail + slots
3. Booking + payment (Iyzipay WebView)
4. Agora sesli gorusme
5. Push bildirim + booking reminder

Not: Bu dosyada gecen native notlar sadece arsiv amaclidir; aktif gelistirme talimati degildir.
