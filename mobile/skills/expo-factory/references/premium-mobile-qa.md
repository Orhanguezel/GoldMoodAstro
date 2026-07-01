# Premium Mobile QA — GoldMoodAstro

Bu kontrol listesi her premiumlaştırma işinin sonunda kullanılır.

## 1. Visual Quality

- Ekran `useAppTheme()` kullanıyor.
- Ana CTA `PrimaryButton` veya aynı standardı taşıyor.
- Ana yüzeyler `PremiumCard` veya token shadow/radius/border standardı taşıyor.
- Gereken yerde `expo-linear-gradient` ile derinlik var.
- Düz beyaz/krem boş sayfa yok.
- Metinler küçük ekranlarda taşmıyor.

## 2. Motion

- Ekran girişinde kontrollü fade/slide var.
- Liste veya kartlarda gerekiyorsa stagger var.
- Button pressed state scale veya opacity taşıyor.
- Motion abartılı, yavaş veya döngüsel dikkat dağıtıcı değil.

## 3. Haptics

- Primary CTA: impact
- Selection/toggle: selection
- Success: notification success
- Warning/error: notification warning/error
- Haptic başarısız olursa UI akışı bozulmuyor.

## 4. Accessibility

- Kritik Pressable'larda `accessibilityRole`.
- Kritik Pressable'larda `accessibilityLabel`.
- Hit target minimum 44x44.
- Sadece renkle anlam verilmemiş; badge/text/icon birlikte kullanılmış.
- Contrast token paleti içinde okunabilir.

## 5. State Coverage

Her ekran için:

- loading
- empty
- error
- retry
- offline/timeout mümkünse
- auth-expired mümkünse

## 6. i18n

- Yeni kullanıcı metinleri TR + EN + DE.
- Stringler component içine gömülü değil.
- Dinamik fiyat/tarih/sayı formatları locale'i bozmaz.

## 7. Navigation

- Root stack sunumu doğru.
- Modal/sheet ekranları doğru presentation kullanıyor.
- Back/close davranışı kaybolmuş kullanıcı yaratmıyor.
- Tab bar en fazla 5 görünür ana hedef gösteriyor.
- Hidden route'lar tab içinde gizli.

## 8. Critical Flow

Smoke sırası:

1. Onboarding
2. Login/Register
3. Consultant list/detail
4. Slot selection
5. Checkout
6. Payment WebView
7. Call join/leave
8. Review submit

## 9. Verification

Minimum:

```bash
cd mobile/app
bun run lint
```

Görsel veya route işi varsa dev server ile manuel kontrol yapılır.
