# İYZİCO BAŞVURU AÇIKLAMA METNİ — Gold Mood Astro

> İyzico üye iş yeri başvurusunda "iş modeli / faaliyet açıklaması" alanına ve
> basvuru@iyzico.com yazışmasına konulacak resmî metin. Konumlandırma: **online
> danışmanlık / kişisel gelişim platformu** (pazaryeri değil — hizmeti kendi adına satar).

---

## Firma Bilgileri

- **Ticari Unvan:** QUEBAB GIDA FABRİKASI RESTORAN İŞLETMECİLİĞİ EĞLENCE ORGANİZASYON VE KİRALAMA TİCARET LİMİTED ŞİRKETİ
- **Marka:** Gold Mood Astro
- **MERSİS No:** 0632143381600001
- **Vergi Dairesi / No:** Büyükçekmece Vergi Dairesi / 6321433816
- **Ticaret Sicil No:** 491688-5
- **Adres:** Cumhuriyet Mahallesi D-100 Karayolu Caddesi ADM Konaklama Sitesi Outlet Park AVM No:374 İç Kapı No:63 Büyükçekmece / İstanbul
- **Telefon:** 0212 807 09 59
- **E-posta:** goldmoodastro@gmail.com
- **Web:** https://goldmoodastro.com

---

## Başvuru Açıklama Metni

Gold Mood Astro, kullanıcılarına çevrim içi kişisel farkındalık ve danışmanlık hizmetleri sunan dijital bir platformdur.

Platformda astroloji, tarot, numeroloji ve benzeri alanlarda sembolik yorum ve kişisel değerlendirme içerikli online danışmanlık hizmetleri sunulmaktadır.

Sunulan hizmetler eğlence, kişisel farkındalık ve kişisel gelişim amacı taşır.

Platformda kesin gelecek tahmini, garanti sonuç, sağlık teşhisi, hukuki danışmanlık, yatırım tavsiyesi, bahis tahmini, büyü, ritüel, bağlama veya benzeri hizmetlere izin verilmez.

Gold Mood Astro, danışmanlardan hizmet tedarik ederek bu hizmetleri kendi adına kullanıcılarına sunar.

Danışman içerikleri Platform kuralları kapsamında denetlenir. Yasaklı vaatler, manipülatif içerikler ve kullanıcıyı Platform dışına yönlendiren paylaşımlar engellenir.

Kart bilgileri Platform tarafından saklanmaz. Tüm ödeme işlemleri lisanslı ödeme kuruluşları aracılığıyla gerçekleştirilir.

Web sitesinde KVKK Aydınlatma Metni, Gizlilik Politikası, Çerez Politikası, Kullanıcı Sözleşmesi, Danışman Sözleşmesi, Mesafeli Hizmet Sözleşmesi, Ön Bilgilendirme Formu, İptal ve İade Politikası ve Yasaklı Hizmetler Politikası yayınlanmıştır.

Ayrıca ödeme adımında kullanıcıdan Ön Bilgilendirme Formu, Mesafeli Hizmet Sözleşmesi ve cayma hakkı istisnası için açık onay alınmaktadır.

---

## Kanıt / Doğrulama Bağlantıları (deploy sonrası)

Aşağıdaki sayfalar canlıda yayınlıdır (footer > Yasal bölümü ve `/legal/{slug}`):

| Belge | URL |
|---|---|
| KVKK Aydınlatma Metni | https://goldmoodastro.com/tr/kvkk |
| Gizlilik Politikası | https://goldmoodastro.com/tr/gizlilik |
| Çerez Politikası | https://goldmoodastro.com/tr/cerez-politikasi |
| Kullanıcı Sözleşmesi | https://goldmoodastro.com/tr/kullanim-sartlari |
| Mesafeli Hizmet Sözleşmesi | https://goldmoodastro.com/tr/legal/mesafeli-satis-sozlesmesi |
| Ön Bilgilendirme Formu | https://goldmoodastro.com/tr/legal/on-bilgilendirme-formu |
| İptal ve İade Politikası | https://goldmoodastro.com/tr/legal/iptal-iade-politikasi |
| Yasaklı Hizmetler Politikası | https://goldmoodastro.com/tr/legal/yasakli-hizmetler |
| Danışman Kuralları ve Etik İlkeler | https://goldmoodastro.com/tr/legal/danisman-kurallari |

**Ödeme adımı kanıtı:** `/tr/booking` sayfasında ödeme öncesi 3 ayrı zorunlu onay kutusu (ön bilgilendirme + mesafeli sözleşme onayı, hizmet niteliği kabulü, cayma hakkı istisnası onayı) ve feragat metni bulunur; onay zaman damgası `bookings.withdrawal_consent_at` alanında saklanır.

> Not: Bu metin canlı deploy + `bun run db:seed` sonrası geçerlidir. Deploy öncesi
> `PAYMENT_MOCK_MODE` kapatılmalı ve gerçek ödeme testi yapılmalıdır.
