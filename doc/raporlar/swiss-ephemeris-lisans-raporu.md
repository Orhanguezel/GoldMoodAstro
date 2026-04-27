---
title: "Swiss Ephemeris Lisans Kararı — Yönetici Raporu"
subtitle: "GoldMoodAstro Astroloji Hesaplama Altyapısı"
author: "Hazırlayan: Orhan Güzel — Teknik Geliştirici"
date: "27 Nisan 2026"
project: "GoldMoodAstro"
client: "Murat Kısıkçılar"
---

# Yönetici Özeti

GoldMoodAstro uygulamasının **doğum haritası, transit yorumu, sinastri (uyum analizi)** gibi tüm astrolojik hesaplamaları **Swiss Ephemeris** isimli endüstri standardı bir kütüphaneye dayanmaktadır. Bu kütüphane sektörün **fiili standardı** (Faladdin, Ms Astro, TimePassages, Astro.com — hepsi aynı kaynağı kullanır).

Ancak bu kütüphane **çift lisans modelinde** dağıtılmaktadır:

1. **Ücretsiz GPL Lisans** — yazılımınızın kaynak kodunu da açık kaynak yapmak zorunda kalırsınız.
2. **Profesyonel Ticari Lisans** — tek seferlik **750 CHF (~30.000 ₺)** ödeme ile sınırsız ticari kullanım.

GoldMoodAstro **kapalı kaynak ticari ürün** olduğundan, profesyonel lisansa geçilmesi yasal ve operasyonel olarak **zorunludur**. Bu rapor durumu detaylandırır ve karar için bilgi sunar.

> **Karar gereken nokta:** ~30.000 ₺ tek seferlik lisans satın alımı (proje bütçesinin %3'ü).
> Karar verilmeden ürün canlı (production) yayına çıkarılamaz.

\newpage

# 1. Swiss Ephemeris Nedir?

Swiss Ephemeris, NASA'nın gezegen hareket verilerinden (JPL Ephemeris) türetilmiş, **astrolojik hesaplamaları yapan açık kaynak yazılım kütüphanesidir.**

- **Geliştirici:** Astrodienst AG (İsviçre, 1997'den beri)
- **Kullanım Alanı:** Doğum haritası hesaplama, gezegen pozisyonu, ev sistemi, açılar, transit, sinastri
- **Doğruluk:** Astronomik seviyede (saniye hassasiyetinde)
- **Sektör Konumu:** Fiili standart — neredeyse tüm profesyonel astroloji uygulamaları kullanır

Bu kütüphane GoldMoodAstro'nun şu özellikleri için **temel altyapıdır**:

| Özellik | Swiss Ephemeris ile sağlanır |
|---------|------------------------------|
| Doğum Haritası | ✓ |
| Günlük Burç Yorumu (transitler) | ✓ |
| Sinastri (İlişki Uyumu) | ✓ |
| Gezegen Geçişleri Takvimi | ✓ |
| Yıldız Eğitimi (premium) | ✓ |
| Astrolog 1:1 Görüşme — yorum desteği | ✓ |

\newpage

# 2. Lisans Modeli — Detay

Swiss Ephemeris **çift lisans (dual license)** modelinde dağıtılır:

## 2.1 GPL-3.0 Lisans (Ücretsiz)

- **Şart:** Kütüphaneyi kullanan tüm yazılımın kaynak kodu da GPL-3.0 olmalı, yani **açık kaynak yapılmalı**
- **Pratik anlamı:** GoldMoodAstro'nun tüm backend kodunu, mobil uygulama kodunu, veritabanı yapısını **rakiplerin görebileceği şekilde herkese açmak zorunda kalırsınız**
- **Sonuç:** Ticari kapalı kaynak ürünler için **uygun değildir**

## 2.2 Profesyonel Lisans (Ücretli)

- **Bedel:** Tek seferlik **750 CHF** (~30.000 ₺ — kur dalgalanmasına göre)
- **Süre:** Sınırsız — yıllık yenileme yok, kullanıcı başına ücret yok, hesaplama başına ücret yok
- **İçerik:** Sınırsız ticari kullanım, kapalı kaynak yazılımda kullanma hakkı, tüm gelişmiş özelliklere erişim
- **Resmi:** Astrodienst AG ile doğrudan sözleşme — fatura, KVKK uyumlu

## 2.3 Mevcut Durumumuz

GoldMoodAstro backend'inde **`swisseph-wasm` adlı npm paketi** kuruludur ve aktif çalışmaktadır. Yapılan teknik denetim sonucu:

> **Bu paket GPL-3.0 lisanslıdır.**

Yani **şu anki durumda yasal olarak GPL'e tabiyiz** — production'a (canlı yayına) çıkmadan önce ya kaynak kodu açmak ya profesyonel lisansa geçmek gereklidir. Aksi halde Astrodienst tarafından lisans ihlali işlemi başlatılabilir.

\newpage

# 3. Rakipler Ne Kullanıyor?

Pazardaki başlıca rakiplerin teknik altyapısı (kamuya açık bilgi + sektör analizi):

| Uygulama | Kullanılan Motor | Lisans Modeli (Tahmini) |
|----------|------------------|--------------------------|
| **Faladdin** (50M indirme) | Swiss Ephemeris | Profesyonel lisans (büyük ölçek için zorunlu) |
| **Ms Astro** (500K indirme, 169 ₺/ay) | Swiss Ephemeris | Profesyonel lisans |
| **Astro.com** (Astrodienst kendi ürünü) | Swiss Ephemeris (orijinal) | Sahibi olduğu için lisans gerek yok |
| **TimePassages** (uluslararası premium app) | Swiss Ephemeris | Profesyonel lisans |
| **Co-Star** (10M+ kullanıcı) | NASA JPL Horizons + custom | Karma yaklaşım |
| **Falsepeti** (kredi tabanlı) | Belirsiz — muhtemelen Swiss Ephemeris | Profesyonel lisans varsayılır |

**Net sonuç:** Pazardaki **ciddi tüm oyuncular** Swiss Ephemeris profesyonel lisansını kullanmaktadır. Bu, GoldMoodAstro için **rekabet eşiti standart** anlamına gelir — alternatif kütüphaneler (örn. astronomy-engine MIT) ürünün rekabet ettiği seviyeye çıkamaz.

> **Önemli not:** Profesyonel lisans alındığında **biz de aynı altyapıyı** rakiplerle paylaşırız. Yani teknik altyapı açısından **dezavantaj olmaz**, eşit oluruz. Farkımız yorum kalitesinden, kullanıcı deneyiminden, anti-dark-pattern abonelikten gelecek (rakip analizimizdeki F1-F12 maddeleri).

\newpage

# 4. 3 Seçenek Karşılaştırma

| Kriter | A) Profesyonel Lisans | B) MIT Lisanslı Alternatif | C) Backend'i GPL Aç |
|--------|------------------------|------------------------------|----------------------|
| **Maliyet** | 750 CHF (~30.000 ₺) tek seferlik | Ücretsiz | Ücretsiz |
| **Yasal Risk** | Sıfır | Sıfır | Sıfır (yasal) — ama ticari kötü |
| **Özellik Kapsamı** | Tam (asteroidler, ev sistemleri, Vedik destek, yıldızlar, gelişmiş açılar) | %30-40 sınırlı (ev sistemleri eksik, asteroid yok) | Tam |
| **Geliştirme Süresi** | Mevcut kod aynen kullanılır (1 saat lisans key entegrasyonu) | Kütüphane değişimi (5-7 gün ek iş) | Aynen kullanılır |
| **Rekabet Seviyesi** | Faladdin/Ms Astro ile eşit | Daha düşük — premium hisse satılabilir mi? | Eşit |
| **Müşteri İmajı** | Profesyonel | Kalite riski | "Açık kaynak" iyi gelebilir ama **kapalı rekabet bozar** |
| **Supply Chain** | Resmi Astrodienst (güvenli) | MIT topluluk paketi (risk az) | Mevcut paket — 2 yıllık küçük proje (riskli) |

\newpage

# 5. Önerilen Yol — A) Profesyonel Lisans

## Neden A?

1. **Rakip seviyesinde kaliteyi** ancak bu yol sağlar — Faladdin ve Ms Astro ile **teknik eşiti**
2. **Bütçe etkisi makul** — 30.000 ₺ proje bütçesinin %3'ü, tek seferlik
3. **Yasal koruma** — Astrodienst sözleşmesiyle ileride lisans ihlali iddiası imkansız
4. **Mevcut kod yeniden yazılmaz** — sadece resmi paket import edilir, license key eklenir
5. **Premium özellikler hazır** — Vedik astroloji, Solar Return, Progressions gibi premium tier ürünler için altyapı zaten içinde

## B Neden Reddedildi?

MIT alternatifi (`circular-natal-horoscope-js` veya `astronomy-engine`) ücretsizdir ama **kapsam dardır**:

- Ev sistemleri sadece "Equal House" — Türkiye'de standart **Placidus** yok
- Asteroid (Chiron, Lilith, Ceres) yok
- Vedik astroloji desteği yok (ayanamsa ayarı yok)
- Sabit yıldızlar (Algol, Regulus) yok
- Aspect orbsları sınırlı

Sonuç: Faladdin/Ms Astro ile aynı kalitede ürün çıkmaz, rekabet zorlaşır.

## C Neden Reddedildi?

Backend'i GPL altında açmak yasal olarak temizdir, ancak ticari sonuçları kötüdür:

- Rakipler kodumuzu birebir kopyalayıp kendi ürünlerinde kullanabilir
- "Bizim özel algoritmamız var" iddiası imkansız hale gelir
- Yatırımcı/satış aşamasında olumsuz bir nokta

\newpage

# 6. Lisans Satın Alma Süreci

## 6.1 Adımlar

1. https://www.astro.com/swisseph/swephinfo_e.htm sayfasından "Professional License" başvuru formu doldurulur
2. Müşteri firma bilgileri (Murat Kısıkçılar — şahıs şirketi veya ünvan)
3. Banka transferi: 750 CHF (Astrodienst İsviçre hesabına EUR/CHF olarak)
4. Astrodienst lisans sertifikası ve özel **license key** dosyası gönderir
5. Bu key backend `.env` dosyasına eklenir, ürün canlı yayına hazır

**Tahmini süre:** Başvuru → onay → key teslim → 5-10 iş günü.

## 6.2 Maliyet Detayı

| Kalem | Bedel |
|-------|-------|
| Astrodienst Profesyonel Lisans (tek seferlik) | 750 CHF |
| Banka transfer ücreti | ~20 EUR |
| **TOPLAM** | **~30.000 ₺** (kur dalgasına göre 28.000 - 33.000 ₺) |

## 6.3 Maliyet Karşılaştırması — API ile

Eğer Swiss Ephemeris yerine **3rd-party astrology API** (örn. ProKerala, Astrology API) kullansaydık:

- Hesaplama başına **~0.005-0.015 €** ücret
- Ayda 10.000 doğum haritası → ~50-150 €/ay → **600-1.800 €/yıl**
- 2-3 yılda lisans bedelini geçer + sürekli internet bağımlılığı + gizlilik riski

Yani lisans **5-6 ay içinde kendini amorti eder**, sonrasında sıfır maliyetle çalışır.

\newpage

# 7. Karar Sonrası Plan

Lisans onaylandıktan sonra teknik tarafta yapılacak işler:

| Adım | Süre |
|------|------|
| Resmi `swisseph` npm paketi kurulum + license key entegrasyonu | 30 dk |
| Mevcut compute.ts/transit.ts/synastry.ts dosyalarında import değişimi | 1-2 saat |
| Premium özellikler için ek geliştirmeler (Placidus ev sistemi, Vedik flag, Asteroid pack) | 1-2 gün |
| Test ve doğrulama (örnek doğum haritası karşılaştırması Astro.com referansıyla) | 2-3 saat |

**Toplam ek iş:** ~2-3 gün — proje takvimine etki etmez, paralel ilerler.

\newpage

# 8. Sonuç ve Karar İhtiyacı

## Özet

GoldMoodAstro'nun **astroloji hesaplama altyapısı** Swiss Ephemeris'tir. Bu teknik karar **doğru ve sektör standardına uygundur**. Ancak şu anda kullanılan ücretsiz GPL paketi **ticari ürünümüz için yasal olarak uygun değildir**.

Çözüm tek bir adıma indirgenir:

> **Astrodienst'e tek seferlik 750 CHF (~30.000 ₺) ödeyerek profesyonel lisans satın almak.**

Bu adım atılmadan önce GoldMoodAstro **production'a (canlı yayına) çıkamaz**.

## Karar İhtiyacı

| Soru | Cevap Bekliyoruz |
|------|-------------------|
| Lisans satın alımı onaylanıyor mu? | Evet / Hayır |
| Onaylanırsa, fatura kim adına kesilecek? | Şirket ünvanı / şahıs adı |
| Ödeme yöntemi (banka transferi / kredi kartı)? | — |
| Süre kısıtı var mı? | (lansman tarihinden 1 hafta önce key elinizde olmalı) |

## Alternatif Onaylanmazsa

Müşteri lisans satın almayı tercih etmezse iki seçenek kalır:

1. **B (MIT alternatif)** — kapsam daraltılır, ürün rekabette geri kalır (~5-7 gün ek iş)
2. **Pivot** — astroloji yerine "mood/coaching" odaklı içerik tabanlı modele geçiş (büyük ürün stratejisi değişikliği)

İki seçenek de **ürün vizyonunu zayıflatır**. Önerimiz **A — Profesyonel Lisans Satın Alımı**.

---

*Rapor sonu — sorularınız ve kararınız için iletişim bekleniyor.*

*Hazırlayan: Orhan Güzel · 27 Nisan 2026 · GoldMoodAstro Teknik Geliştirme*
