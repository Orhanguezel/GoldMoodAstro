# Cursor IDE — Mobil Geliştirme Notları

> Bu dosya **eşin Cursor IDE ile mobil tarafı geliştirirken** dikkat etmesi gereken
> kritik noktaları toplar. İlk açılışta okumak zorunlu.

---

## 1. Bağlam

**Proje:** GoldMoodAstro — Türkiye'de astroloji (burç, doğum haritası, tarot,
kahve falı, rüya, sinastri, yıldızname) + danışmanlık platformu.

**4 katman:**
- `backend/` + `packages/shared-backend/` — Fastify API (Bun)
- `admin_panel/` — Next.js admin paneli
- `frontend/` — Next.js public site
- **`mobile/app/`** — Expo (React Native) ← **SENİN SAHA**

**Senin görevin:** Sadece mobile uygulamasını geliştir. Backend kontratı sabit;
yeni endpoint gerekirse `mobile/REQUESTS.md`'ye yaz, Orhan görüp ekler.

---

## 2. Cursor için TEMEL kurallar (KIRMIZI ÇİZGİLER)

### 2.1. Dosya kapsamı

✅ **Edit edebileceğin** klasörler:
```
mobile/app/src/
mobile/app/app/
mobile/app/assets/
mobile/app/package.json   (yeni paket eklerken — önce sor)
mobile/app/app.json
mobile/app/eas.json
```

❌ **DOKUNMA** klasörleri (paralel geliştirici editliyor — sync conflict yaratır):
```
backend/                    ← Fastify API (Orhan)
packages/shared-backend/    ← shared modüller
admin_panel/                ← admin Next.js
frontend/                   ← public Next.js
doc/mvp-checklist.md        ← plan dokümanı
doc/antigravity-*.md        ← UI brief'leri (Orhan yazar)
.env, .env.example          ← credentials
```

### 2.2. Sync paylaşım (DİKKAT)

Bu klasör **iki bilgisayar arasında ağ üzerinden paylaşımlı**:
- Aynı anda iki taraf aynı dosyayı editlerse `*.sync-conflict-*.md` dosyası oluşur.
- **Tek seferde tek dosya** üzerinde çalış, kaydet, **30 sn bekle**.
- Sync conflict dosyası gördüğünde **DOKUNMA**, Orhan'a haber ver.
- `node_modules/` ağda paylaşılmaz — her bilgisayar kendi `bun install` çalıştırır.

### 2.3. Yeni endpoint istemek

Backend'de olmayan bir API çağrısına ihtiyacın olursa:
1. `mobile/REQUESTS.md` dosyasını aç (yoksa oluştur)
2. Şu formatta yaz:
   ```
   ## YYYY-MM-DD — Yeni endpoint isteği
   - Method + Path: POST /api/v1/me/preferences
   - Body: { theme: 'dark' | 'light', notifications: boolean }
   - Response: { ok: true }
   - Neden: Mobil settings ekranında preferences kaydı için
   ```
3. Orhan'a Telegram/WhatsApp ile bildir
4. Endpoint hazır olunca `mobile/AGENTS.md`'ye eklenir

### 2.4. Cursor'a yaygın hatırlatma

- **Test çalıştır:** `cd mobile/app && bun run lint` (tsc check) — push etmeden önce.
- **Helpful refactor yapma** — istenen işi yap, kapsamı genişletme. "Bu arada şu da
  düzeltilsin" yaklaşımı sync conflict riskini artırır.
- **Dosya editlemeden önce oku** — Cursor Edit tool'u Read sonrası kullanılır.
- **Pakete dokunmadan önce sor** — `bun add x` çalıştırmadan önce kullanıcıya danış.
- **Türkçe konuş** — UI metinleri ve doküman dili Türkçe. Kod İngilizce kalır.
- **DB schema değiştirme** — `backend/src/db/sql/*.sql` salt-okunur. Backend'deki
  data tipi değişikliği Orhan'ın işidir.

---

## 3. Mobil teknoloji stack'i (DEĞİŞTİRME)

| Katman | Seçim | Versiyon |
|--------|-------|----------|
| Runtime | Expo | SDK 54 |
| Routing | Expo Router (file-based) | latest |
| State | React state + AsyncStorage | — (global store yok, basit tut) |
| API | fetch tabanlı (`src/lib/api.ts`) | — |
| Storage | AsyncStorage wrapper (`src/lib/storage.ts`) | — |
| i18n | i18next, TR + EN + DE | — |
| Sesli görüşme | LiveKit (`@livekit/react-native`) | 2.10+ |
| Ödeme | WebView ile Iyzipay checkout | — |
| Push | `expo-notifications` + Firebase FCM | — |
| Apple Sign In | `expo-apple-authentication` | — |
| Fontlar | Cinzel + Fraunces + Manrope (Google Fonts) | — |

**Tema:** `mobile/app/src/theme/tokens.ts`
- Altın: `#C9A961`
- Krem: `#FAF6EF`
- Plum: `#3D2E47`
- Ink: `#2A2620`

Yeni paket eklemek istediğinde önce buradaki listeyi kontrol et — alternatifi
varsa yenisini ekleme.

---

## 4. Klasör yapısı

```
mobile/app/
├── app/                 ← Expo Router file-based pages
│   ├── (tabs)/          ← bottom tab grup
│   ├── (auth)/          ← login/register
│   ├── (onboarding)/    ← welcome/birthdata
│   ├── booking/         ← randevu akışı
│   ├── consultant/      ← danışman detayı
│   ├── tarot/           ← tarot ekranları
│   ├── coffee/          ← kahve falı
│   ├── ...              ← diğer feature'lar
│   └── _layout.tsx      ← root navigator
├── src/
│   ├── components/      ← yeniden kullanılabilir UI
│   ├── lib/             ← api.ts, storage.ts, i18n.ts vb.
│   ├── theme/           ← tokens.ts
│   ├── locales/         ← tr.json, en.json, de.json
│   └── hooks/           ← useAuth, useBooking, vb.
├── assets/              ← imajlar, fontlar
├── android/             ← native Android (auto-gen + customize)
├── ios/                 ← native iOS (auto-gen + customize)
├── app.json             ← Expo config
├── eas.json             ← EAS Build config
├── package.json
└── tsconfig.json
```

---

## 5. Backend API kontratı

Backend dev: `http://localhost:8094/api/v1`
Backend prod: `https://www.goldmoodastro.com/api/v1`

Auth header: `Authorization: Bearer <access_token>`
Token storage: `AsyncStorage` key `mh_access_token`

**Endpoint listesi:** `mobile/AGENTS.md` Section "Backend API"
**Detaylı endpoint dokümanı:** `doc/mvp-checklist.md` (sadece referans, **dokunma**)

---

## 6. Açık görevler

Plan dosyaları (sadece okuma):
- `doc/mvp-checklist.md` → tüm proje plan
- `doc/antigravity-*-brief.md` → UI brief'leri (Orhan yazıyor; web/admin için)

**Mobil için açık görevler** (FAZ 16'da listelenmiş):
- `(onboarding)/welcome.tsx`
- `(onboarding)/birthdata.tsx`
- `(tabs)/today.tsx`

Diğer feature ekranları (tarot, kahve, rüya, yıldızname, sinastri, big-three,
yükselen) için web brief'leri Orhan yazdı; bunları **mobile-first** olarak
adapte ederek yapacaksın. Brief'ler `doc/antigravity-*.md` içinde — kopyala
oku, değiştirme.

---

## 7. Test ve build

### Geliştirme

```bash
cd mobile/app
bun install
bun run start               # Expo dev server başlatır
# - iOS Simulator: i tuşu
# - Android Emulator: a tuşu
# - Expo Go (gerçek cihaz): QR kod
```

### Lint / TypeCheck

```bash
bun run lint                # tsc --noEmit
```

### EAS Build (production)

```bash
bun run build:android       # Android preview build
bun run build:ios           # iOS preview build
```

EAS hesabı + Expo organization gerekli — Orhan paylaşacak.

---

## 8. Bildirim kanalları

- **Soru/blok:** Telegram/WhatsApp Orhan
- **Yeni endpoint isteği:** `mobile/REQUESTS.md`'ye yaz + bildir
- **Sync conflict:** Hiç dokunma, Orhan çözer
- **Plan ile uyumsuzluk:** `mobile/AGENTS.md`'de notlar varsa onu takip et,
  yoksa Orhan'a sor

---

## 9. Cursor'a ilk komutta ver

İlk konuşmada Cursor'a şunu yapıştır:

> "Sen bu workspace'te sadece `mobile/` klasörünü geliştiriyorsun. `backend/`,
> `frontend/`, `admin_panel/`, `packages/`, `doc/` salt-okunur. Sync paylaşımı
> olduğu için aynı dosyada uzun süre kalma. Mevcut konvansiyonu (Expo Router,
> AsyncStorage, fetch-based API client, tokens.ts) takip et — yeni pattern
> ekleme. Test çalıştırmadan iddialı değişiklik yapma. Türkçe konuş.
> Detay için `mobile/CURSOR-NOTES.md` ve `mobile/AGENTS.md`'yi oku."
