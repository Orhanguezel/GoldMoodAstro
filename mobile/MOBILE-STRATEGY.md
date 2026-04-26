# GoldMoodAstro Mobile - Strategy

Date: 2026-04-24
Platform: Expo (React Native) + TypeScript
Source of execution rules: AGENTS.md

## 1) Product Goal

Mobilde uc uca seans akisini calistirmak:

1. User onboarding
2. Auth (login/register)
3. Consultant discovery
4. Slot secimi ve booking
5. Payment (Iyzipay WebView)
6. Voice session (Agora)
7. Rating/review

Ana hedef: ilk MVP surumunde guvenilir ve sade bir booking + call deneyimi.

## 2) Strategic Principles

1. Single codebase: iOS + Android birlikte ilerler
2. Scope discipline: MVP disi ozellikler ertelenir
3. API-first execution: backend kontratlariyla paralel ilerleme
4. Reliability first: call ve payment adimlari kritik yol
5. Measurable delivery: her milestone icin olculebilir KPI

## 3) Target Users

1. Danisman arayan son kullanici
2. Randevu satin alip sesli seansa katilan kullanici
3. Seans sonrasi puanlama yapan geri donus odakli kullanici

## 4) MVP Scope (In)

- Onboarding
- Login/Register
- Consultant list + detail + slots
- Booking olusturma
- Iyzipay odeme ekrani (WebView)
- Agora sesli gorusme
- Randevu gecmisi ve basic status goruntuleme
- Rating/review gonderme
- Push token kaydi ve temel booking hatirlatma akisi

## 5) Out of Scope (Now)

- In-app chat'in gelismis versiyonu
- Abonelik/paywall urunlestirmesi
- Native iOS/Android ayri kod tabani
- Gelismis analytics paneli
- A/B test altyapisi

## 6) Milestone Plan (Execution)

Milestone detaylari AGENTS.md ile birebir uyumludur.

### M0 - Foundation

- Onboarding flow
- Entry routing (onboarded control)
- Push token alma ve backend'e kayit

Exit criteria:

- Uygulama ilk acilista onboarding veya tabs'e dogru yonlenir
- Push token storage + backend register endpoint cagrisi calisir

### M1 - Authentication

- Login/Register ekranlari
- Session persistence
- useAuth hook ve logout

Exit criteria:

- Login sonrasi token saklanir ve protected ekranlara erisim olur
- 401 durumunda oturum temizlenir

### M2 - Discovery and Booking Visibility

- Consultant listing
- Consultant detail + slot list
- Bookings tab (upcoming/past)
- Favorites

Exit criteria:

- User consultant secip slot gorebilir
- Bookings ekraninda temel statusler dogru gorunur

### M3 - Checkout and Payment

- Checkout summary
- Booking create + order create
- Iyzipay WebView payment

Exit criteria:

- Basarili odeme sonrasi bookings ekranina donus
- Payment failure senaryosu kontrollu hata mesaji ile yonetilir

### M4 - Voice Session

- Agora token alma
- Join/leave call flow
- Session end
- Rate screen

Exit criteria:

- Kullanici booking zamaninda cagriya katilabilir
- Cagri sonu review ekranina yonlenir

### M5 - Profile and Settings

- Settings ekrani
- Language switch (TR/EN)
- Notification preferences (basic)
- Logout

Exit criteria:

- Profil ve ayarlar ekrani production-ready minimum seviyeye gelir

## 7) Backend Dependency Map

Mobil MVP icin kritik backend modulleri:

1. auth
2. consultants
3. availability
4. bookings
5. orders/payments (Iyzipay)
6. agora
7. review
8. firebase push token endpoint

Dev API base:

- http://localhost:8094/api/v1

Prod API base:

- https://www.goldmoodastro.com/api/v1

## 8) KPI and Success Metrics (MVP)

Launch sonrasi ilk 30 gun hedef metrikleri:

1. Activation rate >= 40% (install -> register/login)
2. Booking conversion >= 15% (active user -> booking create)
3. Payment success >= 90% (checkout -> paid)
4. Call join success >= 95% (eligible booking -> joined)
5. Review submit rate >= 25% (completed session -> review)

## 9) QA and Release Checklist

1. iOS/Android basic smoke test
2. Auth + payment + call end-to-end smoke
3. Offline/timeout hata mesajlari dogrulama
4. Token refresh/logout edge-case kontrolu
5. Push notification click deep link kontrolu

## 10) Risks and Mitigation

Risk: Payment callback uyumsuzlugu
Mitigation: Success/failure URL patternlerini backend ile sabitlemek

Risk: Agora token timing ve yetki sorunlari
Mitigation: Booking ownership + time-window kontrollerini backend tarafinda zorunlu kilmak

Risk: Push izin reddi
Mitigation: Sessiz fallback + ayarlardan tekrar etkinlestirme yonlendirmesi

Risk: Scope creep
Mitigation: M0-M5 disi talepleri backlog etiketleyip MVP sonrasina tasimak

## 11) Ownership

Bu dokuman urun yonu ve teslimat stratejisini tanimlar.
Kod seviyesinde gercek uygulama adimlari icin AGENTS.md tek kaynak olarak kullanilir.
