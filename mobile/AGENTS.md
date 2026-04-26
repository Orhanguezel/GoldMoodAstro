# AGENTS.md — GoldMoodAstro Mobile (Codex için)

Expo (React Native) + TypeScript projesi. Kök: `mobile/app/`.

---

## Teknoloji Kararları (Değiştirme)

- **Runtime:** Expo ~52, React Native 0.76
- **Routing:** Expo Router (file-based, Next.js benzeri)
- **State:** React state + AsyncStorage (global store yok — basit tut)
- **API:** `src/lib/api.ts` — fetch tabanlı, auth token header ile
- **Storage:** `src/lib/storage.ts` — AsyncStorage wrapper
- **i18n:** `src/lib/i18n.ts` — i18next, TR + EN
- **Tema:** `src/theme/tokens.ts` — midnight/amethyst/gold palette
- **Sesli görüşme:** `react-native-agora` v4.x (RtcEngine)
- **Ödeme:** `react-native-webview` ile Iyzipay checkout form WebView
- **Push:** `expo-notifications`
- **Fontlar:** Fraunces (başlık), InterTight (metin)

## Backend API

- Dev: `http://localhost:8094/api/v1`
- Prod: `https://www.goldmoodastro.com/api/v1` (app.json extra.apiUrl)
- Auth: `Authorization: Bearer <token>` header
- `setAuthToken(token)` ile api.ts'deki istemciyi güncelle

## Renk Paleti

```ts
colors.midnight   // '#0D0B1E' — ana arkaplan
colors.deep       // '#1A1630' — kart arkaplan
colors.surface    // '#241E3D' — yüzey
colors.stardust   // '#F0E6FF' — ana metin
colors.stardustDim// '#C9B8E8' — ikincil metin
colors.muted      // '#7A6DA0' — pasif metin
colors.amethyst   // '#7B5EA7' — birincil CTA rengi
colors.gold       // '#D4AF37' — accent / vurgu
colors.danger     // '#E55B4D' — hata
colors.success    // '#4CAF6E' — başarı
```

---

## Dosya Yapısı

```
mobile/app/
├── app/
│   ├── _layout.tsx              ✅ Stack navigasyon (güncellendi)
│   ├── index.tsx                — Entry: onboarded? → tabs : onboarding
│   ├── (tabs)/
│   │   ├── _layout.tsx          ✅ Bottom tabs (güncellendi)
│   │   ├── index.tsx            TODO M2-1: Danışman listesi
│   │   ├── bookings.tsx         TODO M2-3: Randevularım
│   │   ├── favorites.tsx        TODO M2-4: Favoriler
│   │   └── settings.tsx         TODO M5-1: Ayarlar
│   ├── onboarding/
│   │   └── index.tsx            TODO M0-1: 3 slide onboarding
│   ├── auth/
│   │   ├── login.tsx            TODO M1-1: Giriş
│   │   └── register.tsx         TODO M1-2: Kayıt
│   ├── consultant/
│   │   └── [id].tsx             TODO M2-2: Danışman detay + slot
│   ├── booking/
│   │   ├── checkout.tsx         TODO M3-1: Sipariş özeti
│   │   └── payment.tsx          TODO M3-2: Iyzipay WebView
│   └── call/
│       ├── [bookingId].tsx      TODO M4-1: Agora sesli görüşme
│       └── rate.tsx             TODO M4-2: Seans değerlendirme
├── src/
│   ├── lib/
│   │   ├── api.ts               ✅ GoldMoodAstro API istemcisi
│   │   ├── storage.ts           ✅ AsyncStorage wrapper
│   │   ├── i18n.ts              ✅ TR + EN çeviriler
│   │   └── notifications.ts     TODO M0-2: FCM token kayıt
│   ├── components/
│   │   ├── PaywallSheet.tsx     — REMOVE veya gerek yok
│   │   └── (yeni bileşenler)    TODO her milestone'da ekle
│   ├── hooks/
│   │   └── (yeni hook'lar)      TODO her milestone'da ekle
│   ├── theme/
│   │   └── tokens.ts            ✅ GoldMoodAstro paleti
│   └── types/
│       └── index.ts             ✅ Tüm TypeScript tipleri
```

---

## GÖREV LİSTESİ

### M0: Temel Yapı

#### M0-1: Onboarding Ekranı
Dosya: `app/onboarding/index.tsx`

3 slide, flat ScrollView (paginasyon yok, Pressable "Devam"):
```
Slide 1: t('onboarding.title1') + t('onboarding.body1')
Slide 2: t('onboarding.title2') + t('onboarding.body2')
Slide 3: t('onboarding.title3') + t('onboarding.body3') + "Başla" butonu
```
"Başla" → `storage.markOnboarded()` → `router.replace('/(tabs)')`

#### M0-2: App Entry Point
Dosya: `app/index.tsx`

```tsx
useEffect(() => {
  storage.isOnboarded().then(ok => {
    router.replace(ok ? '/(tabs)' : '/onboarding');
  });
}, []);
```

#### M0-3: Notifications (FCM token kayıt)
Dosya: `src/lib/notifications.ts` — mevcut Expo push kodunu GoldMoodAstro'ya uyarla:
- `registerForPushNotificationsAsync()` → token al → `authApi.registerFcmToken(token)` ile backend'e kaydet
- `storage.setPushToken(token)` ile kaydet
- Bildirim handler: `booking/[id]` bildirimine basınca ilgili randevuya git

---

### M1: Auth Akışı

#### M1-1: Login Ekranı
Dosya: `app/auth/login.tsx`

```
Form: email (KeyboardType: email-address) + password (secureTextEntry)
Button: authApi.login({ email, password })
Success: storage.setUserSession({ token, userId, role }) + setAuthToken(token) + router.replace('/(tabs)')
Error: "E-posta veya şifre hatalı" göster
Link: "Hesabın yok mu?" → /auth/register
```

Stil: midnight arkaplan, amethyst buton, stardust metin.

#### M1-2: Register Ekranı
Dosya: `app/auth/register.tsx`

```
Form: full_name + email + password + phone (opsiyonel)
Button: authApi.register(data)
Success: storage.setUserSession() + setAuthToken() + router.replace('/(tabs)')
Link: "Zaten hesabın var mı?" → /auth/login
```

#### M1-3: useAuth Hook
Dosya: `src/hooks/useAuth.ts`

```ts
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storage.getAuthToken().then(async token => {
      if (token) {
        setAuthToken(token);
        const { user } = await authApi.me().catch(() => ({ user: null }));
        setUser(user);
      }
      setLoading(false);
    });
  }, []);

  const logout = async () => {
    await storage.clearSession();
    setAuthToken(null);
    setUser(null);
    router.replace('/auth/login');
  };

  return { user, loading, logout };
}
```

---

### M2: Danışman Keşif

#### M2-1: Ana Ekran (Danışman Listesi)
Dosya: `app/(tabs)/index.tsx`

**Bileşenler:**
- `ConsultantCard.tsx` oluştur (yeni bileşen — aşağıda tarif)
- FlatList ile danışman listesi
- Üstte arama kutusu (TextInput)
- Horizontal ScrollView ile kategori filtreleri (expertise listesi)

**Veri:**
```ts
const [consultants, setConsultants] = useState<Consultant[]>([]);
const [filter, setFilter] = useState<{ expertise?: string }>({});
useEffect(() => {
  consultantsApi.list(filter).then(r => setConsultants(r.items));
}, [filter]);
```

**ConsultantCard.tsx** (`src/components/ConsultantCard.tsx`):
```
Props: consultant: Consultant + onPress: () => void
Göster: avatar (placholder ile), full_name, expertise[0-2], rating_avg, session_price, session_duration
Arka plan: colors.surface, köşe: radius.md
Puan: ⭐ {rating_avg} renk: colors.gold
Fiyat: colors.amethyst bold
```

#### M2-2: Danışman Detay Ekranı
Dosya: `app/consultant/[id].tsx`

```ts
const { id } = useLocalSearchParams<{ id: string }>();
const [consultant, setConsultant] = useState<Consultant | null>(null);
const [selectedDate, setSelectedDate] = useState(today());
const [slots, setSlots] = useState<ConsultantSlot[]>([]);

useEffect(() => {
  consultantsApi.get(id).then(setConsultant);
}, [id]);

useEffect(() => {
  consultantsApi.slots(id, selectedDate).then(r => setSlots(r.slots));
}, [id, selectedDate]);
```

Göster:
- Avatar + isim + "Onaylı Danışman" rozeti
- Bio, expertise tags, dil, puan
- Takvim: basit 7 gün horizontal scroll (date picker)
- Slot listesi: TimeSlotButton bileşeni (boş/dolu durumu)
- "Randevu Al" butonu → `/booking/checkout?consultantId=...&slotId=...&date=...`

#### M2-3: Randevularım Ekranı
Dosya: `app/(tabs)/bookings.tsx`

```ts
// Auth guard: token yoksa → /auth/login
// bookingsApi.list() ile randevuları çek
// "Yaklaşan" / "Geçmiş" tab toggle
// Yaklaşan: randevu zamanı geldiğinde "Görüşmeye Katıl" → /call/[bookingId]
// Geçmiş: completed status → puan göster veya "Değerlendir" linki
```

BookingCard bileşeni (`src/components/BookingCard.tsx`):
```
consultant_id'den full_name (consultant bilgisi join edilmiş gelmeli)
appointment_date + appointment_time
status badge: colors.gold=confirmed, colors.success=completed, colors.danger=cancelled
session_price
```

#### M2-4: Favoriler Ekranı
Dosya: `app/(tabs)/favorites.tsx`

- Favori consultant ID'leri AsyncStorage'da `gma.favorites.v1` key'inde tut
- `useFavorites` hook yaz: `{ favorites, toggle, isFavorite }`
- Her ConsultantCard'da kalp ikonu: isFavorite → altın, değil → pasif
- Favoriler ekranı: kayıtlı consultant ID'leriyle consultantsApi.get(id) çağrıları

---

### M3: Randevu & Ödeme Akışı

#### M3-1: Checkout Ekranı
Dosya: `app/booking/checkout.tsx`

Query params: `consultantId`, `slotId`, `date`, `time`, `price`, `duration`

```
Özet kartı:
- Danışman adı + avatar
- Tarih + saat
- Süre: {duration} dakika
- Tutar: ₺{price}

"Ödemeye Geç" butonu:
1. bookingsApi.create({ consultant_id, resource_id, slot_id, appointment_date, appointment_time, session_duration, session_price })
2. ordersApi.createForBooking(booking.id)
3. router.push(`/booking/payment?orderId=${order.id}&url=${order.checkout_form_url}`)
```

#### M3-2: Iyzipay WebView Ekranı
Dosya: `app/booking/payment.tsx`

```tsx
import { WebView } from 'react-native-webview';

// Query params: orderId, url (checkout form URL)
// WebView: source={{ uri: checkoutFormUrl }}
// onNavigationStateChange: URL değişimini izle
//   Başarı pattern:  url.includes('/siparis/basarili')
//   Başarısız pattern: url.includes('/sepet?payment=failed') || url.includes('/sepet?payment=error')
//
// Backend FRONTEND_URL=https://www.goldmoodastro.com → redirect:
//   Başarı:    https://www.goldmoodastro.com/siparis/basarili?order_id=...
//   Başarısız: https://www.goldmoodastro.com/sepet?payment=failed&order_id=...
//
// Başarıda: toast.success('Ödeme başarılı') → router.replace('/(tabs)/bookings')
// Başarısızda: toast.error('Ödeme başarısız') → router.back()
```

---

### M4: Sesli Görüşme

#### M4-1: Agora Call Ekranı
Dosya: `app/call/[bookingId].tsx`

```ts
import { createAgoraRtcEngine, IRtcEngine, ChannelProfileType, ClientRoleType } from 'react-native-agora';

const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

useEffect(() => {
  agoraApi.getToken(bookingId).then(async ({ app_id, token, channel_name, uid }) => {
    const engine = createAgoraRtcEngine();
    engine.initialize({ appId: app_id });
    engine.enableAudio();
    engine.joinChannel(token, channel_name, uid, {
      channelProfile: ChannelProfileType.ChannelProfileCommunication,
      clientRoleType: ClientRoleType.ClientRoleBroadcaster,
    });
    // Süre sayacı başlat
  });

  return () => {
    engine?.leaveChannel();
    engine?.release();
  };
}, [bookingId]);
```

UI:
- Siyah/midnight tam ekran
- Merkez: danışman adı + bağlantı durumu
- Süre sayacı (00:00 formatında)
- Altta: Mute butonu + Speaker butonu + Kırmızı Kapat butonu
- Kapat → agoraApi.endSession(bookingId) → router.replace(`/call/rate?bookingId=${bookingId}`)

#### M4-2: Değerlendirme Ekranı
Dosya: `app/call/rate.tsx`

```
5 yıldız seçici (Pressable stars)
Opsiyonel yorum (TextInput multiline)
"Gönder" → reviewsApi.create({ booking_id, target_id, rating, comment })
"Sonra" → router.replace('/(tabs)/bookings')
Gönder sonrası → router.replace('/(tabs)/bookings')
```

---

### M5: Ayarlar & Profil

#### M5-1: Ayarlar Ekranı
Dosya: `app/(tabs)/settings.tsx` (mevcut, yeniden yaz)

Bölümler:
- Profil: ad, e-posta (authApi.me() ile)
- Dil: TR / EN toggle → storage.setLanguage() + i18n.changeLanguage()
- Bildirimler: push toggle (expo-notifications izni)
- Hakkında: Versiyon + destek e-postası
- Çıkış Yap: useAuth().logout()

---

## Önemli Kurallar

1. **Renk değerleri direkt yazmayın** — `colors.*` token kullanın
2. **Font yazmayın** — `font.*` token veya `fontFamily: 'InterTight_400Regular'`
3. **Auth guard:** Randevu ve Çağrı ekranları token yoksa `/auth/login`'e yönlendirmeli
4. **Loading state:** Tüm API çağrıları için loading göster (`ActivityIndicator` renk: `colors.amethyst`)
5. **Error state:** API hatası → `colors.danger` renkli kısa hata mesajı
6. **TypeScript strict:** `any` kullanmayın — `src/types/index.ts` tiplerini kullanın
7. **i18n:** Tüm string'ler `t('key')` ile — yeni key ekliyorsanız `src/lib/i18n.ts`'e ekleyin (TR + EN birlikte)

## Kurulum

```bash
cd mobile/app
bun install
# iOS için (mac gerekli):
cd ios && pod install && cd ..
bun run ios
# Android için:
bun run android
```

## API Entegrasyonu Notları

- `setAuthToken` app açılışında storage'dan token okuyup çağrılmalı (useAuth hook içinde)
- Tüm authenticated istekler otomatik olarak header'a eklenecek
- Token süresi dolmuşsa 401 gelir → storage.clearSession() + /auth/login'e yönlendir
- Dev ortamında `localhost:8094` için Android emülatöründe `10.0.2.2:8094` kullanılır

## Agora Notları

- `AGORA_APP_ID` backend site_settings'ten gelir, mobil doğrudan backend'den alır (`agoraApi.getToken()` response içinde)
- Mikrofon izni: Android'de `android.permission.RECORD_AUDIO` app.json'da eklendi
- iOS'ta `NSMicrophoneUsageDescription` app.json'da eklendi
- Sesli görüşmede video yok — sadece ses (VoIP)
