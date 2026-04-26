# AGENTS.md - GoldMoodAstro iOS Native (Deprecated)

Status: Deprecated
Date: 2026-04-24

iOS native uygulama aktif gelistirme rotasi degildir.
GoldMoodAstro mobil uygulamanin aktif kod tabani Expo projesidir:

- ../app/
- ../AGENTS.md
- ../MOBILE-STRATEGY.md

## Neden Deprecated?

- MVP ve ilk surum hedeflerinde tek kod tabaniyla hizli teslimat onceliklidir.
- SwiftUI ayri kod tabani su asamada urun hizi ve bakim maliyeti acisindan uygun degildir.

## Native'e Donus Tetikleyicileri

Asagidaki senaryolarda iOS native rota yeniden acilabilir:

1. MAU > 1M ve Expo tarafinda iOS performans sinirlari
2. CarPlay / Apple Watch gibi iOS-only entegrasyon zorunlulugu
3. CoreML veya iOS native ses altyapisi icin derin entegrasyon ihtiyaci

## Eger Native Yeniden Acilacaksa

Baslangic kaynagi olarak once su belgeler kullanilmalidir:

1. ../AGENTS.md (M0-M5 fonksiyonel kapsam)
2. ../MOBILE-STRATEGY.md (oncelik ve KPI)
3. Backend API kontratlari (localhost:8094/api/v1)

Minimum feature parity hedefi:

1. Auth ve session yonetimi
2. Danisman kesfetme + detay + slot secimi
3. Booking + Iyzipay odeme WebView
4. Agora sesli gorusme
5. Push bildirim ve booking reminder

Not: Bu dosya yalnizca arsiv ve migration referansi olarak tutulur; aktif gelistirme talimati degildir.
