# Finans Görünürlük + Fatura İncelemesi ve Yol Haritası

**Tarih:** 2026-08-16 · **Tetikleyen:** İlk gerçek Stripe ödemesi admin panelde hiçbir yerde görünmüyor.
**İstek:** Ödemeler admin panelde/finans bölümünde görünsün, faturası kesilsin, Fatma (danışman) ve Murat (ortak) kendi paylarını görebilsin.
**İnceleme:** 2 paralel keşif ajanı (admin panel yüzeyleri + backend veri akışı) + prod rol kontrolü.

---

## 1. Yönetici özeti

- **Görünürlük altyapısının çoğu VAR ama kopuk/gizli:** Orders, Wallet, Withdrawals sayfaları ve
  danışman detayında Ödemeler sekmesi mevcut. Fakat dashboard'un gelir grafiği **her zaman boş**
  (backend sabit boş dizi döndürüyor), en zengin gelir endpoint'i (`/admin/dashboard/marketing`:
  ciro, trend, danışman-başına ciro, funnel) **hiçbir sayfaya bağlanmamış**, withdrawals sayfası
  **sidebar'da yok** (URL bilmeden erişilemiyor).
- **En kritik iş kuralı kopukluğu:** Ödeme alınınca danışman kazancı OTOMATİK oluşmuyor. Kazanç,
  yalnız admin randevuyu elle "completed" yaparsa yazılıyor; bunu otomatik yapan hiçbir cron yok.
  Ayrıca medya mesajı kazançları hold süresinden hiç çıkmıyor (cron yalnız `session_earning`
  filtreliyor) — bu paralar sonsuza dek "bekleyen"de kalıyor.
- **Stripe ledger'a bağlı değil:** Webhook şu an yalnız e-posta bildirimi atıyor; orders/payments/
  wallets'a yazmıyor. `payments` tablosunda provider ayrımı yok; iade akışı gateway'e bakmadan
  hep Iyzico servisini çağırıyor (Stripe iadesi eklenince patlar).
- **Fatura üretimi SIFIR:** Ne tablo, ne PDF, ne sıralı numara, ne e-posta. İyi haber: satıcı artık
  DE Kleinunternehmer olduğu için TR e-Arşiv/GİB zorunluluğu yok — basit, sıralı numaralı,
  "§19 UStG uyarınca KDV gösterilmez" notlu PDF fatura yeterli (bu işi ÇOK basitleştirir).
- **Kişi görünürlüğü:** Murat'ın hesabı zaten **admin** → admin paneline eklenecek her finans ekranını
  otomatik görür. Fatma **consultant** → kendi panelindeki WalletPanel'i zaten var; Faz B otomasyonu
  dolunca kazançları kendiliğinden akacak. (Not: Fatma'nın ayrıca bir admin hesabı var —
  `fatma.guclu@goldmoodastro.com`; finans ekranları TÜM adminlere görünür, §6'ya bakın.)

## 2. Mevcut envanter (ne var, nerede)

| Yüzey | Durum |
|---|---|
| `/admin/orders` + detay | ✅ Liste, filtre, iade butonu, ödeme kayıtları kartı. Eksik: parasal toplam yok (yalnız adet) |
| `/admin/wallet` | ✅ Cüzdanlar, depozito onayı, manuel bakiye, işlem listesi (Ayarlar grubunda saklı) |
| `/admin/withdrawals` | ✅ Sayfa var (onayla/reddet/ödendi) — ❌ sidebar'da YOK |
| Danışman detayı → Ödemeler sekmesi | ✅ bakiye/bekleyen/ödenen + çekim geçmişi (salt-okunur) |
| Admin dashboard | ⚠️ Tek gerçek veri: aylık ciro KPI'ı ("Toplam Ciro" etiketi yanlış). Grafikler backend'de sabit boş |
| `/admin/dashboard/marketing` endpoint | ✅ ciro/trend/topConsultants/funnel üretiyor — ❌ UI'ya bağlanmamış |
| Danışman paneli WalletPanel | ✅ bakiye, aylık istatistik, çekim talebi (komisyon oranını site_settings'ten okur) |
| Fatura | ❌ Hiçbir şey yok (ölü RTK tag + KYC fatura adresi alanları hariç) |
| Stripe | ✅ webhook + `stripe_events` kaydı + mail — ❌ orders/payments/wallets bağlantısı yok |

## 3. Kritik bulgular (öncelik sıralı)

1. 🔴 **Ödeme → kazanç zinciri manuel.** iyzico callback yalnız orders.paid + payments + bookings.confirmed
   yazar; wallet'a dokunmaz. Kazanç tek yerden: `createPendingSessionEarning` ← yalnız admin
   `PATCH /admin/bookings/:id {status:'completed'}`. Otomatik completed geçişi yok
   (`session-auto-close` LiveKit odasını kapatır ama booking'e dokunmaz).
2. 🔴 **`media_message_earning` hiç serbest kalmıyor** — `consultant-earnings.ts` cron'u
   `WHERE purpose='session_earning'`; medya kazançları kalıcı pending.
3. 🟠 **Komisyon 3 yerde farklı okunuyor**; mediaMessages tarafı date-aware değil ve hata
   fallback'i sabit %30 (gerçek %40) → danışmana fazla ödeme riski.
4. 🟠 **Dashboard `revenueTrend`/`services` sabit boş dizi**; `range` parametresi okunmuyor;
   "Toplam Ciro" aslında ay başından beri ciro.
5. 🟠 **Sipariş onay maili backend'den hiç tetiklenmiyor** (`sendOrderCreatedMail` çağrısız; şablon ölü).
6. 🟠 **Fatura yok** (bkz. özet).
7. 🟡 **`payments`'ta provider kolonu yok**; refund hardcoded IyzicoService.
8. 🟡 **Stripe `processed_at` kolonu var, dolduran yok** — webhook ledger'a yazmıyor.
9. 🟡 **payment-reconciliation cron drift bulunca sadece console.error** — kimse görmüyor.
10. 🟡 Wallet Drizzle şeması SQL'den geride (para yazan kod raw SQL'e kaçmış); 010b/010d çifte-yazım tuzağı;
    withdrawals sidebar'da yok; gateway CRUD hook'ları sayfasız; mock gelirli ölü `section-cards.tsx`.

## 4. Hedef mimari (özet)

**Tek ödeme omurgası:** Stripe webhook → `orders(provider='stripe')` + `payments` + `bookings.confirmed`
→ seans bitince otomatik `completed` → `createPendingSessionEarning` (komisyon tek fonksiyondan)
→ hold süresi → danışman bakiyesi → withdrawal. Her adım bugün var olan tabloları kullanır;
yeni kavram yalnız `invoices` tablosudur. Admin "Finans" grubu tüm zinciri okur;
Fatma kendi WalletPanel'inde, Murat admin Finans'ta aynı gerçeği görür.

## 5. CHECKLIST — fazlı uygulama planı

### Faz A — Görünürlük (hızlı kazanımlar, kod çoğunlukla hazır) — TAMAMLANDI 2026-08-17 (ccc8439)
- [x] Sidebar'a **"Finans"** grubu: Orders, Wallet, Withdrawals, Ödeme Ayarları, Komisyon tek çatı altına
- [x] `withdrawals` sayfasını menüye ekle (şu an erişilemez)
- [x] Dashboard'u `GET /admin/dashboard/marketing`'e bağla: gerçek ciro, günlük trend grafiği,
      ortalama sepet, danışman-başına ciro (topConsultants), funnel
      (uç zaten vardı ama HİÇBİR ekran tüketmiyordu; dashboard'a "Finans Özeti" bloğu eklendi)
- [x] `getDashboardAnalyticsAdmin` yalanlarını düzelt: boş dizileri gerçek sorguyla doldur VEYA
      marketing endpoint'ine yönlendir; "Toplam Ciro" etiketini "Bu Ay Ciro" yap
- [x] Orders listesine parasal toplam satırı (filtreye duyarlı SUM)
- [x] **Stripe ödemeleri görünür kıl (geçici, Faz B'ye kadar):** admin Finans'a "Stripe Olayları"
      bölümü — `stripe_events` listesi (tutar/müşteri/tarih parse edilmiş)
- [x] Ölü `section-cards.tsx` (sahte ₺124.500) dosyasını sil

### Faz B — Stripe ledger entegrasyonu + kazanç otomasyonu (asıl iş)
- [x] `payment_gateways`'e `stripe` kaydı (061b seed; prod'a uygulandı) — provider ayrımı
      mevcut `gateway_id` üzerinden, ek kolon gerekmedi
- [x] Checkout Session üretimini booking akışına bağla (072c9bd — `client_reference_id=order_id`;
      `STRIPE_SECRET_KEY` prod'a eklenmesi bekleniyor)
- [x] Webhook `checkout.session.completed` → orders.paid + payments(provider=stripe) +
      bookings.confirmed + `stripe_events.processed_at` (072c9bd, completePaidOrder — idempotent, E2E'de doğrulandı)
- [x] **Otomatik completed:** yeni `booking-auto-complete` cron'u (saatlik): seans saati+30dk geçen
      confirmed randevu → completed → `createPendingSessionEarning` (072c9bd; E2E: 500→300 net)
- [x] `consultant-earnings` cron'una `media_message_earning` release'i eklendi (072c9bd; E2E'de doğrulandı)
- [x] Komisyon tek fonksiyondan: mediaMessages artık `getPlatformCommissionPercent` kullanıyor (072c9bd)
- [ ] Refund akışını provider-aware yap (Stripe refund API'si; iyzico yolu korunur)
- [ ] `charge.refunded` webhook'u → orders.refunded + negatif payment + wallet geri-sarma (mevcut refund mantığıyla)
- [ ] Ödeme sonrası müşteri onay mailini backend'den tetikle (`sendOrderCreatedMail` — şu an ölü)
- [ ] payment-reconciliation drift bulunca `goldmoodastro@gmail.com`'a mail atsın

### Faz C — Fatura (DE Kleinunternehmer, basit PDF)
- [ ] `invoices` tablosu: sıralı numara (`GM-2026-00001`), order_id/booking_id, müşteri snapshot,
      tutar, para birimi, pdf_path, issued_at (sıra atlamaz — yıllık sayaç)
- [ ] PDF üretimi (satıcı: Orhan Güzel – Softwareentwicklung + adres + USt-IdNr; hizmet tanımı;
      **"Kein Ausweis von Umsatzsteuer gemäß § 19 UStG"** notu; TR müşteriye TR/EN açıklama satırı)
- [ ] Ödeme tamamlanınca otomatik: fatura üret → müşteriye e-posta → `uploads/invoices/` arşiv
- [ ] Admin Finans'ta "Faturalar" listesi (indir/yeniden gönder); sipariş detayına fatura linki
- [ ] 2 €'luk test ödemesi bilinçli olarak faturalanmaz (kullanıcı kararı, 2026-08-16)
- [ ] Gelen faturalar hatırlatması: Stripe/Meta/Google faturalarının §13b reverse-charge beyanı
      (repo dışı — Steuerberater notu)

### Faz D — Fatma & Murat görünürlüğü
- [ ] Murat: admin rolüyle Faz A "Finans" grubunu otomatik görür — ekstra iş yok (ops. karşılama turu)
- [ ] Fatma: WalletPanel'i Faz B otomasyonuyla kendiliğinden dolar; ayrıca danışman panelinde
      "kazanç dökümü" satırına brüt/komisyon/net breakdown'ı görünür yap (description JSON'u zaten taşıyor)
- [ ] Admin: danışman kazanç karşılaştırma tablosu (topConsultants verisi — kim ne kazandırdı)
- [ ] (Karar) Danışman-bazlı komisyon override gereki mi? Şimdilik global %40 — ileriye not

## 6. Karar/risk notları
- **Fatma'nın admin hesabı** (`fatma.guclu@goldmoodastro.com`): Finans ekranları TÜM adminlere açık
  olacak. Fatma'nın tüm ciroyu/komisyonu görmesi istenmiyorsa bu hesap kapatılmalı veya rol
  daraltılmalı (finans-görünürlüğü ayrı yetkiye bağlamak = ek iş, gerekirse Faz D'ye eklenir).
- Komisyon %40 (`platform_commission_rate`, effective 2026-07-19). Oran değişimi 010b+010d
  İKİSİNDE birden güncellenmeli (seed tuzağı) + 30 gün önceden danışman bildirimi zorunlu (sözleşme).
- Danışman sözleşmesi gereği danışman, hakedişi için platforma kendi faturasını keser —
  platform faturası (Faz C) MÜŞTERİYE kesilen satış faturasıdır; ikisi ayrı akış.
- 2€ test: `stripe_events`'te kalır (denetim izi), faturalanmaz, rapora "test" olarak işlendi.

---
*Kaynak incelemeler: admin panel yüzey keşfi + backend finans akış keşfi (2026-08-16, ajan raporları);
rol kontrolü prod DB (salt-okunur). Uygulama sırası: A → B → C → D; A ile B paralel yürüyebilir.*
