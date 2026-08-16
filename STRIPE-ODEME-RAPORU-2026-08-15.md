# GoldMoodAstro — Türkiye'den Ödeme Alma Raporu (Stripe Planı)

**Tarih:** 2026-08-15
**Hazırlayan:** Claude Code (gzl-gelir-crm oturumu)
**Amaç:** iyzico reddi sonrası Türkiye'deki müşterilerden ödeme almanın yolu ve bu repoda yapılacak işlerin listesi.

> ⚠️ Kişisel/hassas veriler (tam IBAN, Steuer-ID, Jobcenter numaraları) bilerek bu dosyada YOK.
> Kaynak belgeler: `gzl-gelir-crm/data/company/almanya/` + `data/company/IDARI-SUREC-NOTU.md`.

---

## 1. Karar özeti

**Almanya'daki Einzelunternehmen kaydıyla Stripe hesabı açılacak.** Türk müşteri Türk
Visa/Mastercard ile öder, tahsilat **EUR olarak Sparkasse hesabına** yatar.

Gerekçeler:

- Stripe'ın [resmî yasaklı işletmeler listesinde](https://stripe.com/de-de/legal/restricted-businesses)
  fal/astroloji **Almanya için yasak değil** (Japonya, Meksika, Tayland, BAE hesaplarında
  açıkça yasaklı — "Hellseher- und Wahrsagedienstleistungen"; Almanya bölümünde bu madde yok).
- iyzico reddi beklenen sonuçtu: iyzico TR tüzel kişilik + unvanla eşleşen TR IBAN ister;
  Orhan'ın TR şirketiyle (GZL Ltd. — %100 Nutuya) resmî bağı yok ve fal/astroloji TR
  PSP'lerinde genelde kabul edilmeyen kategori. **Bu kanal kapalı, zorlanmayacak.**
- PayPal Business zaten aktif → kart geçmeyen müşteriler için ikincil yöntem.

## 2. Mevcut resmî durum (2026-08-15 itibarıyla doğrulanan)

| Alan | Durum |
|---|---|
| İşletme | Einzelunternehmen "Orhan Güzel – Softwareentwicklung" (Fragebogen 05.05.2026 gönderildi) |
| USt-IdNr. | **DE463832419** (21.07.2026'dan geçerli) — Impressum'da da yayınlanacak |
| Steuernummer | 28.07 itibarıyla Finanzamt'tan bekleniyordu — **Stripe kaydını BLOKLAMAZ** |
| Statü kaydı | §18 EStG Freiberufler (Softwareentwickler) + §19 UStG Kleinunternehmer |
| Çalışma izni | eAT: "Erwerbstätigkeit erlaubt" ✓ |
| Banka | Sparkasse Girokonto (DE02 3055 … 43), isim eşleşiyor — payout hesabı olur |
| Adres | Stralsunder Str. 38, 41515 Grevenbroich (Meldebestätigung 21.07.2026) |

## 3. Stripe kaydı — adım adım

1. **Önce Gewerbeanmeldung** (bkz. §5.1 — Stripe sormaz ama vergi tarafı için önkoşul).
2. **Önce site yasal sayfaları** (bkz. §4.1 — Stripe aktivasyonda goldmoodastro.com'u inceler).
3. dashboard.stripe.com → hesap aç: Ülke **Deutschland**, tür **Einzelunternehmer/Individual**.
4. Kimlik doğrulama: **eAT kartı** (foto tabanlı, eID çipi gerekmez).
5. Vergi alanı: USt-IdNr `DE463832419`. Steuernummer alanı boş kalabilir, gelince eklenir.
6. Payout: Sparkasse IBAN.
7. Faaliyet tanımı **dürüst** yazılacak: "Astroloji temelli kişisel danışmanlık ve dijital
   içerik (yorum, tarot, randevulu danışmanlık)". Kategori gizlemek =
   [hesap kapanma sebebi #1](https://support.stripe.com/questions/restricted-business-list-faqs).
8. Aktivasyon sonrası **küçük gerçek test ödemesi** → payout'un Sparkasse'ye düştüğü doğrulanır.

## 4. BU REPODA yapılacak işler (goldmoodastro oturumunun görevi)

### 4.1 Yasal sayfalar — Stripe incelemesinden ÖNCE canlıda olmalı

- [x] **Impressum** — ad, adres, iletişim, USt-IdNr DE463832419 (2026-08-16: seed
      `198d_stripe_de_legal_pages_seed.sql`, `/de/legal/impressum` + tr/en; çift kimlik:
      platform işletmecisi QUEBAB TR + kart satışları sorumlusu Einzelunternehmen DE)
- [x] **Datenschutzerklärung** (DSGVO; Stripe/PayPal veri işleme + haklar + NRW denetim
      makamı; `/de/legal/datenschutzerklaerung`)
- [x] **AGB** (hizmet tanımı, §19 UStG notu, 18+, sorumluluk, 24s iptal kuralı;
      `/de/legal/agb`)
- [x] **Widerrufsbelehrung** (14 gün + §356/4-5 BGB istisnaları + örnek form;
      `/de/legal/widerrufsbelehrung`)
- [ ] Yasal sayfa linklerinin footer'a eklenmesi + checkout'ta onay kutuları
      (AGB/Widerruf onayı — ödeme entegrasyonu fazında)
- [ ] Fiyatların ve hizmet kapsamının net göründüğü satış sayfaları
- [ ] Faturalarda Kleinunternehmer notu: "Kein Ausweis von Umsatzsteuer gemäß §19 UStG"
      (email_templates — ödeme fazında)

> Not (2026-08-16): Sayfalar seed ile tr/en/de oluşturuldu; metinler standart kalıplardır,
> yayın öncesi Orhan'ın (gerekirse hukukçunun) son okuması önerilir. Prod'a seed
> uygulanınca canlıya çıkar.

### 4.1b TEK KİMLİK KARARI (2026-08-16, Stripe kaydı sonrası) — UYGULANDI

Stripe hesabı "Orhan Güzel – Softwareentwicklung" adına açıldığı için sitede
müşteriye görünen satıcı/işletmeci kimliği de aynı işletmeye tekilleştirildi.
Gerekçe: kartı çeken hesap ≠ sitedeki satıcı görünümü, Stripe'ta "üçüncü şahıs
adına tahsilat" şüphesi doğurur → manuel inceleme, payout bekletme ve hesap
kapatma riskinin ana kaynağı. **Şirket devri GEREKMEDİ** — yalnız sitedeki
kimlik değişti; QUEBAB↔Orhan iç anlaşması sitede gösterilmez.

- [x] `company_brand` (footer/iletişim künyesi) → Orhan Güzel – Softwareentwicklung,
      Grevenbroich adresi, DE463832419 (seed `010e`; MERSİS/vergi-TR alanları boş →
      frontend koşullu render, kod değişikliği gerekmedi)
- [x] Mesafeli sözleşme + ön bilgilendirme + iptal/iade (198c, 9 i18n satırı) →
      satıcı Orhan Güzel; TR tüketici hukuku içeriği korundu (TR'ye satışta geçerli)
- [x] Impressum/Datenschutz (198d) → tek kimlik; "Plattformbetreiber QUEBAB" blokları kaldırıldı
- [x] Prod'a admin import-sql ile uygulandı; canlıda doğrulandı (0 QUEBAB, künye DE)

### 4.2 Ödeme entegrasyonu (yasal sayfalar bitince)

- [ ] Başlangıç: **Stripe Payment Link** (kodsuz, manuel satış hemen başlar)
- [ ] Sonra: backend'e (Fastify) **Stripe Checkout** entegrasyonu + webhook
      (`checkout.session.completed` → randevu/sipariş eşleştirme)
- [ ] Para birimi: fiyat gösterimi TRY veya EUR (presentment), settlement **EUR**
- [ ] 3D Secure zorunlu akış (Türk kartlarının çoğu için gerekli)
- [ ] **PayPal Business**'ı ikincil yöntem olarak checkout'a ekle
- [ ] Ödeme kayıtlarının gzl-gelir-crm finans akışına bildirimi (mevcut CRM entegrasyon deseni)

### 4.3 Mobil taraf — DEĞİŞMEZ kural

Uygulama içi dijital içerik satışı **Google Play / App Store IAP**'den geçmek zorunda
(`mobile/app/src/lib/iap.ts` zaten mevcut). Stripe yalnız **web** satışları için.
App içinden Stripe web checkout'a yönlendirme yaparken store kurallarına dikkat.

## 5. REPO DIŞI idari işler (Orhan — sırayla)

1. **Gewerbeanmeldung** (Stadt Grevenbroich, küçük ücret): GoldMoodAstro geliri astroloji
   hizmeti satışı = **gewerblich** (§15 EStG); mevcut Freiberufler kaydı (Softwareentwickler)
   bunu kapsamaz. İki faaliyet yan yana yürür, ayrı beyan edilir.
2. Finanzamt'a ek faaliyet bildirimi (Gewerbe otomatik iletilir, teyit et).
3. **Jobcenter/EKS:** Stripe gelirleri EKS beyanlarına yeni gelir kalemi olarak girer.
4. Steuernummer gelince: faturalara + Stripe hesabına + PayPal Business'a ekle.
5. Hacim büyürse: Sparkasse **Geschäftskonto** (özel Girokonto'da ticari kullanım sınırlanabilir).

## 6. Riskler ve dikkat noktaları

- Fal/astroloji sektör genelinde [yüksek riskli sayılır](https://taskerpaymentgateways.com/common-high-risk-product-types-online/):
  Stripe onboarding'i geçse bile ilk haftalarda ek inceleme/kısa payout bekletmesi olabilir.
  Panzehir: dürüst beyan + eksiksiz yasal sayfalar + **düşük chargeback** (net hizmet tanımı,
  hızlı iade, ulaşılabilir destek).
- Türk kartlarında yurtdışı işlem/3DS kapalı olabilir → ödeme sayfasına kısa bilgilendirme koy;
  alternatif olarak PayPal sun.
- İleride danışmanlara pay dağıtımı (marketplace) → **Stripe Connect** gerektirir; şimdiki
  başvuru "kendi hizmetim" olarak yapılır, modele geçişte Stripe'a ayrıca bildirilir.
- Bu rapor commit edilecekse içinde hassas veri olmadığı korundu — **eklerken de ekleme.**

## 7. Kaynaklar

- [Stripe — Prohibited and Restricted Businesses (DE)](https://stripe.com/de-de/legal/restricted-businesses)
- [Stripe — Restricted Business List FAQs](https://support.stripe.com/questions/restricted-business-list-faqs)
- [Stripe — Sole proprietorship in Germany](https://stripe.com/resources/more/start-sole-proprietorship-germany)
- Şirket belgeleri: `gzl-gelir-crm/data/company/almanya/` (`00_DOSYA_LISTESI.md`)
