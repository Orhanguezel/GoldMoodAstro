# İYZİCO ONAY HAZIRLIK ÇEKLİSTİ — 2026-07-04

> **Bağlam:** İyzico üye iş yeri başvurusu reddedildi (jenerik "başvuru koşulları" gerekçesi).
> Tam analiz + admin raporu: `IYZICO-RED-DEGERLENDIRME-VE-AKSIYON-PLANI-2026-07-04.pdf` (repo kökü).
> **Strateji kararı:** Pazaryeri ("sadece aracıyız") anlatımı KULLANILMAYACAK (6493 riski) →
> "platform hizmeti kendi adına satar, danışmanlar hizmet tedarikçisidir" modeli.
> **Mevcut altyapı:** custom_pages (198/198a seed) 7 legal sayfa + consultant_agreement/payout_faq hazır;
> ana sayfada TransparencySection (eğlence/garanti-yok dili) var; footer künye `site_settings.company_brand`'den DB-driven.

## IYZ-A — Müşteriden beklenenler (blocker)

- [ ] **IYZ-A1** — İyzico'ya (basvuru@iyzico.com) yazılı ret gerekçesi sorgusu (kategori mi evrak mı?)
- [ ] **IYZ-A2** — Şirket bilgileri: ticari unvan, VKN, MERSİS, adres, telefon, NACE kodu, vergi levhası
- [ ] **IYZ-A3** — Model onayı (mali müşavir): danışman ödemeleri serbest meslek makbuzu mu gider pusulası mı?
- [ ] **IYZ-A4** — Revize metinlerin hukukçu kontrolü (özellikle KVKK yurt dışı aktarım)

## IYZ-B — İçerik işleri (custom_pages seed + admin)

- [ ] **IYZ-B1** — Yeni legal sayfa: `distance_sales` (Mesafeli Hizmet Sözleşmesi) — müşteri taslağı + rapor Bölüm 5 revizyonları; TR/EN/DE; `198_custom_pages_seed.sql` düzenine uygun INSERT IGNORE
- [ ] **IYZ-B2** — Yeni legal sayfa: `pre_information` (Ön Bilgilendirme Formu) — satıcı kimliği + m.15/1-ğ cayma istisnası açıklaması; randevu detayları (danışman/tarih/ücret/media_type) dinamik bölüm olarak checkout'ta gösterilecek
- [ ] **IYZ-B3** — Yeni legal sayfa: `refund_policy` (İptal ve İade Politikası) — TEK kural seti: X saat öncesine kadar ücretsiz iptal / danışman katılmazsa tam iade / teknik arızada yeni randevu veya iade / başladıktan sonra iade yok (mesafeli sözleşme metniyle çelişki giderilecek)
- [ ] **IYZ-B4** — `terms` sayfasını yeni Kullanıcı Sözleşmesi ile güncelle: + 18 yaş şartı, + danışman bağımsız yüklenici/vergi sorumluluğu, + moderasyon/kayıt hakkı, + değişiklik usulü; − "yalnızca ödeme altyapısı sağlarız" cümlesi ÇIKAR
- [ ] **IYZ-B5** — `kvkk` revizyonu: veri sorumlusu kimliği (A2'den), m.5/2 hukuki sebepler, saklama süreleri, **yurt dışı aktarım** (Cloudinary/Firebase/LiveKit), doğum verisi + chat kayıtları işleme amaçları
- [ ] **IYZ-B6** — Footer künye: `site_settings.company_brand`'e unvan/VKN/MERSİS/adres gir (A2 bekler); fiyatların KDV dahil gösterim teyidi
- [ ] **IYZ-B7** — Dil temizliği taraması: frontend + seed içeriklerinde "fal bak/geleceğini öğren" → "sembolik yorum/kişisel farkındalık"; disclaimer'ı danışman profil sayfasına ekle (web `ConsultantDetail` + mobil `consultant/[id]`)
- [ ] **IYZ-B8** — Mobil `legal/index.tsx` MODULE_KEYS listesine `distance_sales`, `pre_information`, `refund_policy` ekle (mobil çeklist F9 ile birleşir)

## IYZ-C — Kod işleri

- [ ] **IYZ-C1** — Checkout'a cayma hakkı ön onay checkbox'ı (web `booking/page.tsx` + mobil `booking/checkout.tsx`): "Hizmetin ifasına derhal başlanmasını onaylıyorum ve cayma hakkımı kaybedeceğimi biliyorum" + ön bilgilendirme/mesafeli sözleşme linkleri; onay olmadan ödeme butonu disabled
- [ ] **IYZ-C2** — Onay kaydı: bookings/orders tablosuna `withdrawal_consent_at` (DATETIME) — seed dosyasına kolon ekle (ALTER YASAK, seed düzenle + prod additive reconcile)
- [ ] **IYZ-C3** — Ödeme sayfasına (web + mobil payment ekranı) kısa feragat ibaresi: "Hizmetler eğlence ve kişisel farkındalık amaçlıdır; kesin sonuç vaadi içermez"
- [ ] **IYZ-C4** — Kayıt ekranına 18 yaş onay kutusu (web register + mobil `auth/register.tsx`)

## IYZ-D — Başvuru + B planı

- [ ] **IYZ-D1** — A+B+C bitince İyzico yeniden başvuru: kategori "online danışmanlık / kişisel gelişim platformu"; moderasyon sistemi + legal sayfalar + net iade politikası vurgulu kısa tanıtım metni
- [ ] **IYZ-D2** — Paralel B planı: PayTR / Sipay / Param başvuruları (aynı hazırlık paketi)
- [ ] **IYZ-D3** — Onay sonrası: `PAYMENT_MOCK_MODE` kapat + uçtan uca gerçek ödeme testi (3D Secure, iade, ters ibraz senaryosu)
- [ ] **IYZ-D4** — Mobil ayrımı: dijital içerik (abonelik/kredi) IAP'de kalır (mobil çeklist A3/D1), İyzico yalnız web + danışman seansı — başvuru anlatımında bu ayrımı belirt

> **Riskler (rapor Bölüm 8):** yanlış beyan → hesap kapatma + bakiye blokesi; 677 sayılı Kanun (fal dili yasağı);
> reklam mevzuatı (fal/medyum reklamı yasak); yüksek chargeback → yeniden inceleme.
