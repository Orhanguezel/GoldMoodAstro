# GoldMoodAstro teknik SEO ve çok dilli URL migrasyonu

> Tarih: 2026-07-31  
> Kapsam: canlı GSC URL envanteri, tüm indekslenebilir web sayfaları, TR/EN/DE içerik ve URL sinyalleri  
> İlke: Her dil kendi URL’sine ve kendi içeriğine sahip olur. Türkçe metin EN/DE için fallback olarak yayımlanmaz.

## Başlangıç bulguları

- [x] Canlı `/index.html` ve `/index.html/*` yanıtları kontrol edildi: kalıcı yönlendirme mevcut.
- [x] Repo kökündeki eski ve bağımsız `index.html` tespit edildi.
- [x] GSC önbelleği incelendi: 25 `Crawled - currently not indexed`, 11 farklı Google canonical, 8 canonical belirtilmemiş kayıt.
- [x] GSC’de burç alt sayfalarının başka burç sayfalarıyla duplicate sayıldığı doğrulandı.
- [x] Örnek EN/DE sayfalarının tamamında SSR `<html lang="tr">` hatası doğrulandı.
- [x] Sitemap’in 303 URL’yi aynı mantıksal slug’larla üç dile çoğalttığı doğrulandı.
- [x] Robots sinyallerinin indekslenebilir sayfaları engellemediği doğrulandı.
- [x] Hardcoded Türkçe taraması çalıştırıldı: 78 dosyada 929 yüksek güvenli bulgu.

## A — Eski HTML ve yönlendirme temizliği

- [x] Repo kökündeki eski `index.html` dosyasını sil.
- [x] `/index.html` → `/tr` için tek adımlı HTTP 308 doğrula.
- [ ] `/index.html/<path>` için locale-aware kanonik hedefe tek adımlı HTTP 308 doğrula. (Kök temiz; sınırsız eski alt yollar için hedef sözlüğü tamamlanacak.)
- [x] `/index.html` URL’lerinin sitemap, canonical, hreflang ve iç linklerde bulunmadığını test et.

## B — Tek kaynak locale-aware URL sözlüğü

- [x] Mantıksal route → TR/EN/DE dış URL eşlemesini tek modülde tanımla.
- [x] Statik public sayfaları kapsa: about, contact, consultants, pricing, FAQ, blog ve araç/landing sayfaları.
- [x] Burç ana segmentini yerelleştir: `burclar` / `zodiac-signs` / `sternzeichen`.
- [x] 12 burç slug’ını yerelleştir: ör. `balik` / `pisces` / `fische`.
- [x] Burç alt sayfalarını yerelleştir: aşk, kariyer, sağlık, bugün ve meditasyon.
- [x] Uyum ve transit rotalarını yerelleştir.
- [x] Query string ve hash değerlerinin dönüşüm sırasında korunduğunu test et.
- [x] Bilinmeyen/dinamik rotaların bozulmadan locale prefix almaya devam ettiğini test et.

## C — Rewrite ve kalıcı migrasyon

- [x] Yerelleştirilmiş dış URL’leri mevcut App Router fiziksel rotalarına internal rewrite et.
- [x] Eski karışık-dil URL’lerini doğru locale URL’sine HTTP 308 ile yönlendir.
- [x] Geçersiz locale ve geçersiz burç slug’larının 404 verdiğini doğrula.
- [x] Danışman UUID → slug ve diğer mevcut yönlendirmelerde regresyon olmadığını doğrula (TR/EN/DE tek 308).

## D — Canonical, hreflang, sitemap ve iç linkler

- [x] `localizePath` tüm public bağlantılarda locale-aware dış URL üretsin.
- [x] Dil değiştirici mevcut URL’yi önce mantıksal route’a, sonra hedef dile çevirsin.
- [x] Server metadata canonical URL’yi yerelleştirilmiş slug ile üretsin.
- [x] Hreflang alternates her dilin gerçek yerelleştirilmiş URL’sini göstersin.
- [x] `x-default` Türkçe kanonik URL’yi göstersin.
- [x] Sitemap yalnız final 200 kanonik URL’leri içersin; redirect URL içermesin.
- [x] Sitemap blog hreflang eşlemesini aynı yazının dil varyantlarına göre kursun.
- [x] Header, footer, home, burç kartları ve çapraz linkleri tarayıp eski slug bırakma.
- [x] JSON-LD ve OG URL’lerini yerelleştirilmiş kanonik URL’lerle hizala.

## E — Dil sinyali ve içerik izolasyonu

- [x] SSR `<html lang>` değerini URL locale’iyle birebir eşleştir.
- [x] Client hydration sonrasında `lang` değerinin değişmediğini doğrula.
- [x] EN indekslenebilir sayfalarda Türkçe fallback yayımlanmasını engelle.
- [x] DE indekslenebilir sayfalarda Türkçe fallback yayımlanmasını engelle; kritik editoryal/about/meditasyon fallback’lerini Almancalaştır.
- [ ] Çevirisi olmayan indekslenebilir içeriği yayından kaldır veya `noindex` yap; TR metin gösterme.
- [x] Danışman liste/uzmanlık API isteklerine locale gönder; profil alanları için mevcut locale verisini kullan.
- [ ] Ana sayfa, auth, danışman, booking, pricing, legal ve astroloji araçlarındaki hardcoded Türkçeyi `ui_*` kaynağına taşı.
- [ ] `i18n:guard` baseline’ını yalnız bulgu azaltıldıktan sonra güncelle; artışı gizleme.

## F — Burç sayfası kalite ve duplicate düzeltmesi

- [x] Her burç ana sayfasının title, H1, description ve ana gövdesinin burca özel olduğunu doğrula.
- [ ] Aşk/kariyer/sağlık/günlük/meditasyon alt sayfalarında yalnız isim değişen şablon metin bırakma.
- [x] Günlük yorumlarda aynı metnin birden fazla burca basılmadığını otomatik karşılaştır (TR/EN/DE: her dilde 12/12 benzersiz).
- [ ] Sağlık, kariyer ve aşk içeriklerinde içerik hash/benzerlik kontrolü ekle.
- [x] Meditasyon H1 ve içeriklerinde hedef dilde burç adını kullan.
- [ ] İnce veya tekrarlı sayfaları benzersiz içerik hazır olana kadar sitemap’ten çıkar/noindex yap.

## G — Otomatik tarama ve kabul kriterleri

- [x] Repo route/iç link taraması: Türkçe segmentin EN/DE URL’de üretilmediğini doğrula.
- [x] Sitemap’teki tüm URL’leri tara: 303/303 final 200, self-canonical, doğru `html lang`.
- [x] Her URL’de karşılıklı hreflang ve x-default doğrula.
- [x] Bildirilen/esas eski URL aileleri için tek 308 + final 200 doğrula.
- [x] Redirect loop, redirect chain, 404 ve soft-404 raporu üret: 0 hata.
- [x] Görünür metinde dil sızıntısı raporu üret: indekslenebilir 303 URL’de 0 uyarı.
- [x] `bun run typecheck`, ilgili testler ve production build başarılı.
- [x] Canlı deploy sonrası aynı crawler’ı yeniden çalıştır: 303 URL, 0 hata, 0 dil uyarısı.
- [ ] GSC sitemap’i yeniden gönder ve öncelikli URL’lerde doğrulama başlat.

## H — GSC izleme

- [ ] İlk gün: 7 bildirilen URL + duplicate canonical örneklerini yeniden denetle.
- [ ] 7. gün: crawled/discovered/duplicate sayılarını kaydet.
- [ ] 14. gün: indeks ve canonical değişimini karşılaştır.
- [ ] 28. gün: gösterim, ortalama pozisyon, CTR ve indekslenen URL trendini raporla.
- [ ] Teknik sinyaller stabil olduktan sonra pozisyon 5–17 sayfalarına iç link ve backlink çalışmasına geç.

## URL sözlüğü — hedef örnekler

| Mantıksal sayfa | TR | EN | DE |
|---|---|---|---|
| Burçlar | `/tr/burclar` | `/en/zodiac-signs` | `/de/sternzeichen` |
| Balık/Pisces/Fische | `/tr/burclar/balik` | `/en/zodiac-signs/pisces` | `/de/sternzeichen/fische` |
| Günlük | `/tr/burclar/balik/bugun` | `/en/zodiac-signs/pisces/today` | `/de/sternzeichen/fische/heute` |
| Sağlık | `/tr/burclar/boga/saglik` | `/en/zodiac-signs/taurus/health` | `/de/sternzeichen/stier/gesundheit` |
| Meditasyon | `/tr/burclar/balik/meditasyon` | `/en/zodiac-signs/pisces/meditation` | `/de/sternzeichen/fische/meditation` |
| Numeroloji | `/tr/numeroloji` | `/en/numerology` | `/de/numerologie` |
| Doğum haritası | `/tr/dogum-haritasi` | `/en/birth-chart` | `/de/geburtshoroskop` |
| Kahve falı | `/tr/kahve-fali` | `/en/coffee-reading` | `/de/kaffeesatzlesen` |
| Rüya tabiri | `/tr/ruya-tabiri` | `/en/dream-interpretation` | `/de/traumdeutung` |

## Tamamlanma tanımı

Bu iş yalnız URL’ler değiştiğinde tamamlanmış sayılmaz. Final sayfa 200 dönmeli, canonical kendisini göstermeli, hreflang karşılıklı olmalı, sitemap yalnız final URL’yi içermeli, SSR `html lang` doğru olmalı ve görünür içerik hedef dil dışında fallback içermemelidir.
