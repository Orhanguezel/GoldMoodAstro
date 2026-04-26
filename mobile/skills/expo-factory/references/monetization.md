# Monetization — IAP + Iyzico Hybrid

Orhan'in ekosisteminde ug ucu platform var: iOS, Android, Web. Her birinin odeme kurallari farkli.

## Platform Kurallari

| Platform | Zorunlu kanal | Komisyon | Alternatif |
|---|---|---|---|
| **iOS** | Apple In-App Purchase | %30 (ilk yil, Small Business Program sonrasi %15) | Yok — "reader app" istisnasi hariç |
| **Android** | Google Play Billing (tercih) | %30 / %15 | Harici web odeme IZIN VERILIR (politika 2023) |
| **Web** | Ozgur | 0% (Iyzico %2.5 + KDV) | Ne secerse |

## Hybrid Strateji

**Strateji: Platforma gore ayirarak en dusuk komisyon.**

- iOS: Apple IAP (%30 kabul — alternative yok)
- Android: **Iki secenek sun** (kullanici secsin)
  1. Google Play Billing — tek tiklama, %30 kesinti
  2. Web'e yonlendir (Iyzico) — %2.5 kesinti, kullaniciya fiyat indirimi ile tesvik et
- Web (Next.js): Iyzico birincil

### Fiyat Politikasi

| Plan | iOS (USD tier) | Android Play | Web Iyzico |
|---|---|---|---|
| Baslangic aylik | $4.99 → ₺135 | ₺135 | ₺135 |
| Baslangic yillik | $39.99 → ₺1.080 | ₺1.080 | ₺999 (indirim) |
| Pro aylik | $19.99 → ₺599 | ₺599 | ₺599 |
| Pro yillik | $149.99 → ₺4.499 | ₺4.499 | ₺3.999 (indirim) |

**Yillik web indirimi** Android'de "Web'de %10 daha ucuz" cta'si ile gorunur. iOS'ta yasak (anti-steering).

## Teknik Implementasyon

### Kutuphane Secimi

| Kutuphane | Avantaj | Dezavantaj |
|---|---|---|
| **`react-native-iap`** | Yaygin, ucretsiz, direkt StoreKit + Play Billing | Receipt validation kendi yazilir |
| **`expo-in-app-purchases`** | Expo managed uyumlu | Development/maintenance belirsiz (Expo SDK 50 sonrasi) |
| **RevenueCat** | Receipt validation, analytics, promo code — hepsi hazir | Aylik $10-$100+, yillik ciddi maliyet |

**Tavsiye:** MVP icin `react-native-iap` + backend'de kendi receipt validation. Growth asamasinda RevenueCat'e gec (6+ ay sonra).

### Backend Receipt Validation

```typescript
// packages/shared-backend/modules/subscriptions/verify.ts

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

const verifySchema = z.object({
  platform: z.enum(['ios', 'android']),
  receipt: z.string(),
  productId: z.string(),
});

export async function verifyReceipt(req: FastifyRequest, reply: FastifyReply) {
  const { platform, receipt, productId } = verifySchema.parse(req.body);
  const userId = req.user.id;
  
  if (platform === 'ios') {
    // Apple App Store verify
    // POST https://buy.itunes.apple.com/verifyReceipt
    // (sandbox: https://sandbox.itunes.apple.com/verifyReceipt)
    const result = await verifyAppleReceipt(receipt);
    if (result.status !== 0) throw new Error('Invalid receipt');
    
    await saveSubscription({
      userId,
      platform: 'ios',
      productId,
      transactionId: result.latest_receipt_info[0].transaction_id,
      expiresAt: new Date(parseInt(result.latest_receipt_info[0].expires_date_ms)),
    });
  } else {
    // Google Play verify (requires service account JSON)
    const result = await verifyGooglePurchase(receipt, productId);
    if (result.purchaseState !== 0) throw new Error('Invalid purchase');
    
    await saveSubscription({
      userId,
      platform: 'android',
      productId,
      transactionId: result.orderId,
      expiresAt: new Date(parseInt(result.expiryTimeMillis)),
    });
  }
  
  return reply.send({ success: true, isSubscribed: true });
}
```

DB tablosu:
```sql
CREATE TABLE user_subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  platform ENUM('ios','android','web') NOT NULL,
  product_id VARCHAR(100) NOT NULL,         -- com.orhanguezel.tarimiklim.yearly
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  status ENUM('active','canceled','expired','grace') NOT NULL,
  started_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  renewed_at DATETIME,
  receipt_data TEXT,                        -- audit icin
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
  INDEX idx_user_status (user_id, status),
  INDEX idx_expires (expires_at)
);
```

### Frontend — Paywall

```tsx
// app/paywall.tsx
import { useState, useEffect } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as RNIap from 'react-native-iap';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/src/theme/tokens';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { api } from '@/src/lib/api';

const PRODUCT_IDS = Platform.select({
  ios: ['com.orhanguezel.tarimiklim.monthly', 'com.orhanguezel.tarimiklim.yearly'],
  android: ['com.orhanguezel.tarimiklim.monthly', 'com.orhanguezel.tarimiklim.yearly'],
}) ?? [];

export default function PaywallScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<RNIap.Product[]>([]);
  const [selected, setSelected] = useState<'monthly'|'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    RNIap.initConnection().then(() => {
      RNIap.getSubscriptions({ skus: PRODUCT_IDS }).then(setProducts);
    });
    return () => { RNIap.endConnection(); };
  }, []);
  
  async function handlePurchase() {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const sku = selected === 'monthly' ? PRODUCT_IDS[0] : PRODUCT_IDS[1];
      await RNIap.requestSubscription({ sku });
      
      // Listener dinler -> backend verify
      // Otomatik: app/_layout.tsx'te subscription status listener
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (err: any) {
      if (err.code !== 'E_USER_CANCELLED') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  }
  
  async function handleRestore() {
    const purchases = await RNIap.getAvailablePurchases();
    for (const purchase of purchases) {
      await api.subscriptions.verify({
        platform: Platform.OS as 'ios'|'android',
        receipt: purchase.transactionReceipt,
        productId: purchase.productId,
      });
    }
    router.replace('/(tabs)');
  }
  
  return (
    <View>
      {/* Paywall UI — SKILL.md paywall sablonu */}
    </View>
  );
}
```

### Android'de Iyzico Yonlendirme (Opsiyonel)

Android'de kullaniciya secim sun:

```tsx
{Platform.OS === 'android' && (
  <Pressable 
    onPress={() => {
      // Web'e yonlendir — IndepthLink veya expo-web-browser
      Linking.openURL('https://tarimiklim.com/premium?utm=android-app');
    }}
    style={{ padding: 16 }}
  >
    <Text style={{ color: tokens.colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
      Web'den odeme yap ve %10 tasarruf et -
    </Text>
  </Pressable>
)}
```

**DIKKAT:** Bu butonu iOS'ta GOSTERME. Apple guideline 3.1.3 (anti-steering) ihlali, app rejected olur.

### Iyzico (Web) — Next.js Entegrasyon

```typescript
// apps/web/pages/api/iyzico/checkout.ts
import Iyzipay from 'iyzipay';

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY!,
  secretKey: process.env.IYZICO_SECRET!,
  uri: process.env.IYZICO_BASE_URL!,  // https://api.iyzipay.com
});

export default async function handler(req, res) {
  const { plan } = req.body;  // 'yearly' | 'monthly'
  const price = plan === 'yearly' ? '999.00' : '135.00';
  
  iyzipay.checkoutFormInitialize.create({
    locale: 'tr',
    conversationId: generateId(),
    price,
    paidPrice: price,
    currency: 'TRY',
    basketId: 'SUBSCRIPTION_' + plan.toUpperCase(),
    paymentGroup: 'SUBSCRIPTION',
    callbackUrl: 'https://tarimiklim.com/api/iyzico/callback',
    enabledInstallments: [2, 3, 6, 9],
    buyer: { /* ... */ },
    basketItems: [{
      id: 'plan-' + plan,
      price,
      name: `TarimIKlim ${plan}`,
      category1: 'Subscription',
      itemType: 'VIRTUAL',
    }],
  }, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ checkoutFormContent: result.checkoutFormContent, token: result.token });
  });
}
```

## Offer Stratejisi

### Free Trial

- iOS: 3-gun veya 7-gun trial — subscription config'te tanimlanir
- Android: Google Play subscription'da "Introductory price" veya "Free trial" ayarlanabilir
- Web: Backend'de flag (`trial_ends_at`)

Konvansiyon: **7 gun free trial** — daha iyi conversion. Apple/Google bunu destekler.

### Intro Price

- "Ilk ay ₺29" gibi
- Sonra normal fiyata gecer
- iOS: Subscription Introductory Offers
- Android: Play Console'da intro price

### Win-back Offer

- Cancel eden kullaniciya 3 ay sonra "%50 indirim" push
- Retention stratejisi

## App Store / Play Store Setup

### iOS — App Store Connect

1. App olustur (bundle ID: `com.orhanguezel.tarimiklim`)
2. Subscription group: "TarimIKlim Premium"
3. Subscription tier'lar:
   - `com.orhanguezel.tarimiklim.monthly` — $4.99
   - `com.orhanguezel.tarimiklim.yearly` — $39.99 (introductory offer: 7 day trial)
4. Pricing schedule — ulkelere gore
5. Localization (TR + EN): baslik, aciklama, screenshot
6. Server to server notification URL (opsiyonel — renewal event'leri icin)

### Android — Google Play Console

1. App olustur (package: `com.orhanguezel.tarimiklim`)
2. Subscriptions -> yeni subscription
3. Base plan: monthly ₺135, yearly ₺999 (intro price: 7 days free)
4. Real-time developer notifications (RTDN) — Pub/Sub url (opsiyonel)
5. Service account json (backend verify icin)

### Sandbox Test

- **iOS:** App Store Connect -> Users -> Sandbox Testers -> yeni test kullanicisi. Cihazi `Settings -> App Store -> Sandbox Account` ile o hesaba cevir. Uygulama acildiginda sandbox modda satin alma gercek para cekmeden test edilir.
- **Android:** Internal testing track'a aplikasyonu yukle. Test grupta olan kullanici test kartiyla (veya licensed test account) satin alim yapar.

## Gelir Takibi

```sql
CREATE TABLE revenue_events (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  platform ENUM('ios','android','web') NOT NULL,
  event_type ENUM('new_sub','renewal','upgrade','downgrade','cancel','refund','trial_start','trial_conversion'),
  product_id VARCHAR(100),
  amount_gross DECIMAL(10,2),
  amount_currency VARCHAR(3),
  amount_net_try DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  occurred_at DATETIME NOT NULL,
  raw_event JSON,
  created_at DATETIME DEFAULT NOW(),
  INDEX idx_user_type (user_id, event_type),
  INDEX idx_date (occurred_at)
);
```

Admin dashboard:
- MRR (Monthly Recurring Revenue)
- Churn rate
- LTV
- Platform breakdown (iOS vs Android vs Web)

## Compliance

- **Kosullar** (Terms of Service) — zorunlu, paywall'da link
- **Gizlilik politikasi** — zorunlu (KVKK + GDPR)
- **"Auto-renew disabled"** metni — Apple guideline
- **Receipt storage** — 7 yil (VERBIS gerekli olabilir)
- **Iptal** — her zaman kolay (App Store/Play Store ayarlari)
