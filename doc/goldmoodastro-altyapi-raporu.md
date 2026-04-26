# Gold Mood Astro — Sesli & Görüntülü Görüşme Altyapısı

> **Konu:** Astrolog ↔ kullanıcı 1:1 sesli/görüntülü görüşme altyapı kararı
> **Karar:** **LiveKit Cloud** ile başla, ileride self-host LiveKit'e geçiş yolu açık
> **Durum:** Dev projesi (`goldmood-dev`) ayağa kaldırıldı, altyapı testi başarılı
> **Tarih:** 26 Nisan 2026

---

## 1. Yönetici Özeti

Gold Mood Astro'nun astrolog ↔ kullanıcı 1:1 görüşme özelliği için **LiveKit** seçildi. Kararın ana sebepleri:

1. **Tek SDK ile hem ses hem video** — bugün ses, yarın video açmak için migration yok, sadece track ekleniyor
2. **Şeffaf fiyatlandırma** — sales call gerektirmiyor, free tier'da production'a çıkılabiliyor (5K dk/ay)
3. **Türkiye'ye yakın edge** — Frankfurt/Londra üzerinden 30-50ms latency (insan kulağı 150ms altını fark etmez)
4. **Hibrit yol açık** — Cloud'da başla, trafik haklı çıkarsa self-host'a (Hetzner Almanya) aynı SDK ile geç
5. **AI agent yolu hazır** — ileride "AI astrolog ile sohbet" özelliği için aynı altyapı kullanılır
6. **Vendor lock-in yok** — LiveKit'in kendisi açık kaynak (Apache 2.0), gerekirse self-host'a göç 1 hafta'lık iş

Eski yaklaşım (Agora) elendi. Sıfırdan yazma seçeneği değerlendirildi ve elendi (2-3 ay yatırım, gerçek ROI yok).

---

## 2. Karar Süreci — Hangi Seçenekleri Değerlendirdik?

### 2.1 Aday Listesi

| Seçenek | Tip | Sonuç |
|---|---|---|
| **Agora.io** | 3rd-party SaaS | ❌ Elendi |
| **LiveKit Cloud** | 3rd-party SaaS (open-core) | ✅ **Seçildi** |
| **LiveKit OSS (self-host)** | Açık kaynak | 🟡 Faz 2'de değerlendirilecek |
| **Twilio Programmable Voice** | 3rd-party SaaS | ❌ Pahalı, video sunset edildi |
| **mediasoup** (sıfırdan) | DIY açık kaynak | ❌ 2-3 ay yatırım, ROI yok |
| **Jitsi Videobridge** | Açık kaynak | ❌ Daha az SDK desteği |

### 2.2 Agora Neden Elendi?

İlk değerlendirmede güçlü görünmüştü (Talkspace gibi büyük telehealth referansı, tüm SDK'lar olgun). Ancak:

- **Sales-driven kültür** — bazı tier'larda fiyat görmek için sales call gerekiyor, küçük ekip için friction
- **MSA şeffaflığı zayıf** — sözleşme imzalandıktan sonra fiyat değişikliklerinin müşteriye otomatik yansımaması raporlandı
- **Asya/Latin odaklı SD-RTN ağ** — Türkiye coğrafyası için belirleyici avantaj değil
- **AI workload'ları daha pahalı** — Conversational AI Engine ~$0.0265/dk, LiveKit ~$0.01 + pass-through; ileride AI astrolog yapacaksak Agora pahalı kalıyor
- **UX gelişme hızı yavaş** — son birkaç yılda sektör inceleme yorumlarına göre stagnant

### 2.3 Sıfırdan Yazma Neden Elendi?

"3rd-party olmadan kendi sistemimizi yapsak?" sorusunun cevabı net: **teknik olarak mümkün, stratejik olarak yanlış.**

Sıfırdan WebRTC stack yazmak için gerekli olanlar:

1. Codec katmanı (Opus, G.711 implementasyonu)
2. NAT traversal (STUN/TURN protokolleri)
3. Transport (SRTP/DTLS şifreleme, ICE handshake)
4. Signaling (WebSocket + oda yönetimi)
5. Media routing (SFU veya MCU mimarisi)
6. Echo cancellation, noise suppression, jitter buffer
7. Mobil/web SDK'ları (iOS, Android, Web)

Google'ın WebRTC projesi 14+ yıldır geliştiriliyor. Talkspace, Discord, Zoom — hiçbiri sıfırdan yazmadı, hepsi açık kaynak bileşenlerin üstüne kuruyor.

**Self-host LiveKit/mediasoup farklı bir konu** — bu sıfırdan yazmak değil, açık kaynak yazılımı kendi sunucumuzda çalıştırmak. Bu seçenek faz 2'de değerlendirilecek.

### 2.4 LiveKit Cloud Neden Seçildi?

| Kriter | LiveKit Cloud | Agora | Twilio |
|---|---|---|---|
| Setup süresi | 1 gün | 2-3 gün | 2-3 gün |
| Free tier | 5.000 dk/ay | 10.000 dk/ay | Yok |
| Şeffaf fiyat | ✅ | Kısmen | ✅ |
| Self-host yolu | ✅ Aynı SDK | ❌ | ❌ |
| Open source core | ✅ Apache 2.0 | ❌ | ❌ |
| Ses + Video tek SDK | ✅ | ✅ | Video sunset |
| Türkiye latency | <50ms (Frankfurt) | <80ms | <100ms |
| KVKK uyumu | ✅ EU region | ✅ | ✅ |
| AI Agents framework | ✅ Sektörde en olgun | 🟡 Yeni | ❌ |
| Vendor lock-in riski | Düşük (açık kaynak çekirdek) | Yüksek | Yüksek |

---

## 3. Teknik Mimari

### 3.1 Genel Bakış

```
┌─────────────────────────────────────────────────────────┐
│                     KULLANICI                            │
│            (React Native Mobile + Next.js Web)          │
└────────────────┬───────────────────┬────────────────────┘
                 │                   │
                 │ Token isteği      │ Media stream
                 ▼                   ▼
┌─────────────────────┐    ┌─────────────────────────────┐
│  Goldmood Backend   │    │      LiveKit Cloud          │
│  (Next.js API)      │    │  goldmoodastro-j03iq312     │
│                     │    │  .livekit.cloud             │
│  - Auth (Supabase)  │    │                             │
│  - Token üretimi    │    │  - Audio/Video routing      │
│  - Kredi yönetimi   │    │  - Recording                │
│  - SLA timer        │    │  - Adaptive bitrate         │
│  - Webhook handler  │◄───┤  - Echo cancellation        │
│                     │    │  - Noise suppression        │
└─────────────────────┘    └─────────────────────────────┘
                 ▲                   ▲
                 │                   │
                 │ Token + Media stream
                 │                   │
┌────────────────┴───────────────────┴────────────────────┐
│                     ASTROLOG                             │
│            (React Native Mobile + Next.js Web)          │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Stack Detayı

| Katman | Teknoloji | Neden |
|---|---|---|
| Web frontend | Next.js (App Router) | SEO kritik landing, server-side rendering |
| Mobil | React Native (Expo) | Tek codebase, web'le paylaşımlı LiveKit SDK |
| Backend | Next.js API routes | Token üretimi, webhook handler, kredi düşürme |
| Auth | Supabase Auth | Email magic link + Apple/Google sign-in (telefon numarası istemiyoruz) |
| Database | PostgreSQL (Supabase) | Kullanıcı, astrolog, seans, kredi, kayıt tabloları |
| Real-time görüşme | LiveKit Cloud | Audio/video routing, recording |
| Recording storage | S3 (AWS) veya R2 (Cloudflare) | KVKK uyumlu, lifecycle policy ile otomatik silme |
| Ödeme | iyzico (yerel) + Apple/Google IAP | Türkiye uyumu için zorunlu |
| Email | Resend | Magic link, görüşme hatırlatması |
| Analytics | PostHog | Privacy-first, self-host edilebilir |

### 3.3 Görüşme Akışı (Kullanıcı Yolu)

1. **Kullanıcı astrolog seç** → mobil uygulamada "Astrolog ile görüş" butonu
2. **Backend kontrol** → kullanıcının yeterli kredisi var mı?
3. **Oda oluştur** → backend, LiveKit'te `session-{sessionId}` adında oda yaratır
4. **Token üret** → backend her iki taraf için ayrı JWT token üretir (kullanıcı + astrolog rolü)
5. **Push bildirim** → astroloğa "Yeni görüşme isteği" gider
6. **15dk SLA timer başlar** → astrolog 15 dk içinde katılmazsa kredi otomatik iade
7. **Astrolog katılır** → her iki taraf LiveKit odasına bağlanır
8. **Görüşme** → LiveKit ses (ileride video) iletir, kayıt başlar
9. **Görüşme biter** → backend webhook ile süre bilgisini alır
10. **Kredi düş** → kullanılan dakika kullanıcının kredisinden düşer
11. **Kayıt arşivlenir** → 90 gün S3'te tutulur, sonra otomatik silinir

### 3.4 Token Mimarisi

LiveKit'in token sunucusu **kapalı**, token üretimini kendimiz yapıyoruz:

```typescript
// app/api/livekit-token/route.ts
import { AccessToken } from 'livekit-server-sdk';

export async function POST(req: Request) {
  const { sessionId, userId, role } = await req.json();

  // Auth kontrolü, kredi kontrolü, vb.
  // ...

  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    {
      identity: userId,
      ttl: '1h', // Token 1 saat geçerli
      metadata: JSON.stringify({ role }), // 'astrolog' veya 'user'
    }
  );

  token.addGrant({
    room: `session-${sessionId}`,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return Response.json({ token: await token.toJwt() });
}
```

Bu yapı **tüm kontrolün backend'de olduğu** anlamına geliyor — kullanıcı kredisi yoksa token üretilmiyor, oda kurulmuyor.

---

## 4. Faz Planı — Ay-Ay Yol Haritası

### Faz 1 (Ay 0-3): MVP Audio

**Amaç:** Astrolog ↔ kullanıcı sesli görüşme, kredi sistemi, SLA timer

| Ay | Eylem | Stack |
|---|---|---|
| 0 | LiveKit Cloud `goldmood-dev` projesi | ✅ Tamamlandı |
| 0-1 | Token üretimi backend, oda yönetimi | LiveKit Cloud |
| 1 | Astrolog onboarding akışı, müsaitlik takvimi | Supabase + Next.js |
| 1-2 | Kredi paketleri, ödeme entegrasyonu | iyzico + IAP |
| 2 | Sesli görüşme UI (mobile + web) | LiveKit React Native SDK |
| 2-3 | 15dk SLA timer + iade otomasyonu | Webhook + cron |
| 3 | Beta lansman, ilk astrolog grubu | — |

**Track tipi:** Sadece audio
**Beklenen trafik:** 500-2.000 dk/ay (tamamen free tier'da)
**Maliyet:** $0

### Faz 2 (Ay 3-6): Genişleme & Video Hazırlığı

**Amaç:** Kullanıcı kütlesi büyüt, ürün-pazar uyumunu kanıtla, video için altyapıyı hazırla

| Ay | Eylem |
|---|---|
| 3-4 | Astrolog rating sistemi, şeffaf yorum (Falsepeti'nin sansür yarası için) |
| 4 | Recording entegrasyonu (LiveKit Egress → S3) |
| 4-5 | Video UX araştırma, mock-up, 5 kullanıcı beta testi |
| 5 | Sinastri seansı (3 katılımcı: kullanıcı + partner + astrolog) |
| 5-6 | Pricing tier'ları: video premium fiyat (₺250 yerine ₺350/15dk) |

**Beklenen trafik:** 5.000-15.000 dk/ay
**Maliyet:** $0-30/ay (free tier üzeri kısım)

### Faz 3 (Ay 6+): Video Lansmanı & Self-Host Geçişi

**Amaç:** Video açma, maliyet optimizasyonu, KVKK için tam veri kontrolü

| Ay | Eylem | Stack |
|---|---|---|
| 6 | Video toggle butonu mobil app'e ekleme | LiveKit Cloud |
| 6 | Hetzner Frankfurt'ta self-host LiveKit kurulumu (paralel) | Hetzner + Coturn |
| 6-7 | Trafik kademeli olarak self-host'a migration | Hibrit |
| 7+ | Tam self-host'a geçiş, KVKK-tam-uyum konumu | Self-host |

**Beklenen trafik:** 15.000+ dk/ay
**Maliyet:** Self-host ~$40-70/ay (Hetzner)

### Faz 4 (Belirsiz, ileride): AI Sesli Astrolog

**Amaç:** Kullanıcı, gerçek astrolog yerine AI ile sesli sohbet edebilir (daha ucuz, daha hızlı, 7/24)

- Aynı LiveKit altyapısı, aynı oda yapısı
- LiveKit Agents framework + OpenAI Realtime / Deepgram / ElevenLabs
- Premium tier'da, gerçek astrolog seçeneği yanında "AI astrolog" seçeneği

---

## 5. Maliyet Projeksiyonu

### 5.1 LiveKit Cloud Fiyatlandırması (Nisan 2026)

| Tier | İçerik | Fiyat |
|---|---|---|
| Free | 5.000 katılımcı-dk/ay | $0 |
| Build | 50.000 dk/ay | $50/ay |
| Scale | EU-only data residency, daha fazla quota | ~$500/ay'dan |
| Enterprise | Custom | Sales call |

> Katılımcı-dakika hesabı: 1 görüşme × 2 katılımcı × 15 dakika = **30 katılımcı-dakika**

### 5.2 Trafik Senaryoları

#### Senaryo A: Lansman (Ay 1-3)
- 50 görüşme/ay × 15 dk × 2 katılımcı = **1.500 katılımcı-dk/ay**
- **Maliyet: $0** (free tier'da)

#### Senaryo B: Erken Büyüme (Ay 3-6)
- 500 görüşme/ay × 15 dk × 2 katılımcı = **15.000 katılımcı-dk/ay**
- **Maliyet: $0** (hâlâ free tier'da)

#### Senaryo C: Ölçek (Ay 6+, sesli)
- 2.000 görüşme/ay × 15 dk × 2 katılımcı = **60.000 katılımcı-dk/ay**
- **Maliyet: ~$50/ay** Build tier'a geçiş

#### Senaryo D: Video Açıldıktan Sonra
- Video katılımcı-dakika ücreti audio'nun ~3-5 katı
- 2.000 görüşme/ay × 15 dk × 2 katılımcı = 60.000 dk video
- **Maliyet: ~$200-400/ay** Cloud'da
- **Self-host'ta:** ~$60-90/ay (Hetzner Frankfurt)

### 5.3 Self-Host'a Geçiş Eşiği

LiveKit Cloud'dan self-host'a geçiş **finansal mantıklı olduğu nokta:**

- Aylık LiveKit faturası > $150 olduğunda Hetzner'da self-host daha ucuz
- KVKK için "veriler bizde" ifadesi pazarlama açısından kritikleşince
- Genelde **ay 6-9 arası** geçiş zamanı oluyor

---

## 6. KVKK & Gizlilik

### 6.1 LiveKit Cloud KVKK Durumu

- **Free tier:** Veri "globally distributed" — Türk kullanıcının metadata'sı farklı bölgelere dağılabilir
- **Scale plan ($500+/ay):** EU-only data residency garantisi
- **Self-host (Hetzner Almanya):** %100 veri kontrolü

### 6.2 Dev/MVP Fazında Strateji

- Free tier'da `goldmood-dev` projesi → gerçek kullanıcı verisi yok, KVKK riski yok
- Production lansmanından önce: ya Scale plan'a geç ya da self-host'a taşı
- **Lansman öncesi 1 hafta** içinde bu kararı netleştirmek yeterli

### 6.3 Veri Koruma Önlemleri (Production'da)

| Konu | Yaklaşım |
|---|---|
| Telefon numarası | İstemiyoruz (kayıtta opsiyonel bile değil) |
| Görüşme kaydı | KVKK aydınlatma metni + her seans başında çift onay |
| Kayıt saklama | 90 gün, sonra otomatik silme (S3 lifecycle policy) |
| Hesap silme | Kullanıcı talep ettiğinde 7 gün içinde DB'den kalıcı silme |
| Veri taşınabilirliği | "Verilerimi indir" butonu → JSON export |
| Üçüncü taraf veri satışı | Yok — tek gelir kalemi açık fiyatlı abonelik/kredi |

### 6.4 Agent Observability

LiveKit Cloud'da default açık olan **Agent Observability** ayarı **Disabled** yapıldı (Voice Agent kullanmıyoruz, gereksiz veri toplama önlendi).

---

## 7. Mevcut `goldmood-dev` Projesi

### 7.1 Bilgiler

- **Project ID:** `p_3b59k7x7r4l`
- **Project URL:** `wss://goldmoodastro-j03iq312.livekit.cloud`
- **SIP URI:** `sip:3b59k7x7r4l.sip.livekit.cloud` (ileride telefon entegrasyonu için)
- **Region:** Global mesh (Frankfurt/Londra Türkiye için aktif edge)
- **Plan:** Free tier (5.000 dk/ay)
- **Kullanım:** 0 dk

### 7.2 Yapılan Konfigürasyon

| Ayar | Durum | Sebep |
|---|---|---|
| Automatically create rooms | ✅ Açık | Otomatik oda yönetimi |
| Admins can remotely unmute | ❌ Kapalı | Privacy |
| Allow pausing video on congestion | ✅ Açık | Bandwidth düşünce video durur, ses devam eder |
| Token server | ❌ Kapalı | Token'ı kendi backend'imizde üretiyoruz |
| Agent observability | ❌ Disabled | AI agent kullanmıyoruz, gereksiz veri toplama yok |
| Codecs | ✅ Hepsi açık | Opus, Audio RED, H.264, VP8, VP9, AV1 |

### 7.3 Test Sonucu

✅ **Sandbox testi başarılı** — altyapı çalışıyor, mikrofon algılanıyor, oda kuruluyor.

> Not: İlk testte yanlış sandbox template'i (Voice Agent) açılmış, AI bot bağlı olmadığı için cevap gelmemişti. Sonradan doğru template (Meet) ile test edildi ve sorunsuz çalıştı.

---

## 8. Faz 1 Geliştirme — Sıradaki Somut Adımlar

### 8.1 Hemen Yapılacaklar

1. **API Secret rotate** — mevcut secret paylaşıldığı için güvenlik için yenisi alınmalı
2. **Production projesi oluştur** — `goldmood-prod` ayrı LiveKit projesi
3. **Repo yapısı** — monorepo (web + mobile + backend) veya ayrı repolar?
4. **Next.js sample klonla** — `livekit-examples/meet`'i base alarak özelleştir

### 8.2 İlk Sprint (1 Hafta)

| Gün | Görev |
|---|---|
| 1 | Next.js iskeleti, Supabase auth, `.env` yapısı |
| 2 | Token üretimi endpoint (`/api/livekit-token`) |
| 3 | Veritabanı şeması: users, astrologers, sessions, credits |
| 4 | "Görüşme başlat" akışı — kullanıcı tarafı |
| 5 | "Görüşme cevapla" akışı — astrolog tarafı |
| 6-7 | İki cihaz arası test, hata yakalama, basic UI |

### 8.3 İkinci Sprint (1 Hafta)

- 15dk SLA timer (frontend + backend)
- Kredi düşürme webhook (LiveKit `room_finished` event)
- Otomatik iade tetikleyici (astrolog katılmazsa)
- Hata durumlarında graceful disconnect

---

## 9. Risk Değerlendirmesi

| Risk | Olasılık | Etki | Mitigasyon |
|---|---|---|---|
| LiveKit Cloud fiyatlandırma değişir | Düşük | Orta | Açık kaynak core, self-host'a geçiş 1 hafta |
| KVKK denetimi gelir | Düşük (lansman fazında) | Yüksek | Production öncesi Scale plan veya self-host |
| Astrolog yetersiz katılım | Orta | Yüksek | SLA + iade garantisi konum olarak vurgulanıyor |
| Türkiye latency yetersiz | Düşük | Orta | Frankfurt edge yeterli, ölçüm gerekli |
| Kayıt storage maliyeti patlar | Orta (video açılınca) | Orta | 90 gün lifecycle, opsiyonel kayıt |
| Trafiğin tahmin ötesi olması | Pozitif risk | — | Auto-scale, free→Build geçişi otomatik |

---

## 10. Karar Defteri

Bu projedeki teknolojik seçim kararları:

| # | Karar | Tarih | Sebep |
|---|---|---|---|
| 1 | LiveKit kullanılacak | 26 Nisan 2026 | Şeffaf fiyat, açık kaynak çekirdek, ses+video tek SDK |
| 2 | Cloud ile başlanacak | 26 Nisan 2026 | Hızlı production, MVP fazında self-host gereksiz |
| 3 | Self-host yolu açık tutulacak | 26 Nisan 2026 | KVKK + maliyet için faz 3'te değerlendirilecek |
| 4 | Token üretimi backend'de yapılacak | 26 Nisan 2026 | Kontrol bizde, LiveKit token server kullanılmıyor |
| 5 | Faz 1 sadece audio | 26 Nisan 2026 | Video açıldığında astrolog onboarding yarası — UX hazırlığı önce |
| 6 | Recording 90 gün tutulacak | 26 Nisan 2026 | Şikayet süresi + KVKK minimum |
| 7 | Telefon numarası istenmeyecek | 26 Nisan 2026 | Ms Astro SMS spam yarasından farklılaşma |

---

## 11. Referanslar

### Resmi Dokümantasyon
- LiveKit Docs: https://docs.livekit.io
- LiveKit React Native SDK: https://docs.livekit.io/reference/components/react-native/
- LiveKit Server SDK (Node.js): https://docs.livekit.io/reference/server-sdk-js/
- Pricing: https://livekit.io/pricing

### Karar Sürecinde Kullanılan Karşılaştırmalar
- LiveKit vs Twilio vs Agora (2026): https://sheerbit.com/livekit-vs-twilio-vs-agora-which-real-time-platform-should-you-choose/
- LiveKit vs Agora pricing (2026): https://www.forasoft.com/blog/article/livekit-vs-agora-cost-analysis
- Self-hosted WebRTC maliyeti: https://webrtc.ventures/2025/10/how-much-does-it-really-cost-to-build-and-run-a-webrtc-application/

### Sample Kod
- LiveKit Meet (referans alınan örnek): https://github.com/livekit-examples/meet
- Voice Assistant frontend: https://github.com/livekit-examples/voice-assistant-frontend

### Önceki Proje Dökümanları
- Rakip analizi raporu: `goldmoodastro-rakip-analizi.md`
- Marka kimliği landing page: `index.html`
- Mobile app showcase: `mobile-app.html`

---

*Rapor sonu — bu döküman Faz 1 geliştirmesi başladığında güncellenecektir.*
