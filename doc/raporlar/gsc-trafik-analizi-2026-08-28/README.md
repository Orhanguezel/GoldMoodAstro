# GoldMoodAstro GSC trafik çalışması — 28 Ağustos 2026

Bu klasör canlı site, Search Console API ve kullanıcı tarafından sağlanan üç Excel
exportunun uzlaştırılmış organik trafik teşhisini içerir.

## Sonuç

Tıklama düşüklüğünün ana nedeni snippet CTR'sinden çok ortalama sıralama ve trafiğin
ana sayfada yoğunlaşmasıdır. 29 Temmuz-25 Ağustos döneminde 69 tıklama, 1.231
gösterim, `%5,61` top-line CTR ve `68,49` ortalama pozisyon oluştu. Sayfa boyutlu
kırılımda 70 tıklamanın 52'si ana sayfadan geldi; ana sayfa dışı CTR yaklaşık
`%1,23` kaldı.

Coverage exportunun son gününde 342 URL indeksli, 1.100 URL indeks dışıydı. En büyük
gruplar: 303 noindex, 266 redirect, 247 keşfedildi-taranmadı, 120 doğru canonical'lı
alternatif, 60 tarandı-indekslenmedi ve 40 Google'ın farklı canonical seçtiği URL.
Drilldown'daki 27 tarihsel 5xx URL'nin 26'sı canlıda artık 200; test danışman URL'si
404. Bu nedenle aktif toplu 5xx krizi yok, GSC yeniden doğrulaması gerekiyor.

İlk mobil Lighthouse ölçümü teknik SEO'yu `100` buldu; performans ise `49` kaldı.
LCP `4,68 sn`, TBT `3,37 sn`, ana thread çalışması `14,3 sn`, toplam yük `1,63 MB`
ve DOM `2.199` elemandı. İzin verilmeden yüklenen GA, Google Ads ve Meta scriptleri
yaklaşık `430 KB` üçüncü taraf yükü ve belirgin JS çalışma maliyeti oluşturuyordu.

## Öncelik sırası

1. Strict-locale ve final iç-link paketini canlıya alıp EN/DE sızıntısını kapatmak.
2. Sitemap'i yeniden göndermek; legacy URL ve 5xx coverage doğrulamasını başlatmak.
3. Yedi gün sonra ana sayfa dışı CTR ile legacy URL gösterimlerini yeniden ölçmek.
4. 14-28 gün sonra yeni 198 uyum sayfasını indeks/gösterim kazanımına göre tutmak
   veya sitemap kapsamını daraltmak.
5. Yükselen burç, doğum haritası ve danışman sayfalarında konu kümeleri ile uzman
   imzalı, motordan türetilmiş içerik ve bağlamsal iç bağlantı derinliği kurmak.

## Kaynaklar

- `goldmoodastro.com-Performance-on-Search-2026-08-28.xlsx`
- `goldmoodastro.com-Coverage-2026-08-28.xlsx`
- `goldmoodastro.com-Coverage-Drilldown-2026-08-28.xlsx`
- Canlı `https://goldmoodastro.com/sitemap.xml`
- Search Console API, `sc-domain:goldmoodastro.com`

## Uygulama checklist'i

- [x] Canlı sitemap/robots/canonical/hreflang taraması yapıldı.
- [x] Search Console API ile 28 gün, önceki 28 gün ve 90 gün performansı alındı.
- [x] Excel Performance exportu API toplamlarıyla uzlaştırıldı.
- [x] Coverage ve 5xx drilldown exportları incelendi.
- [x] 27 tarihsel 5xx URL canlı yeniden kontrol edildi: 26 adet 200, bir test URL'si 404.
- [x] EN/DE ana sayfada Türkçe blog fallback kök nedeni bulundu.
- [x] Strict-locale public custom page kontrolü yazıldı.
- [x] Sitemap yalnız gerçek hedef-dil blog çevirilerini alacak şekilde sertleştirildi.
- [x] Kritik public akışlardaki eski `/consultants` ve `/birth-chart` iç linkleri final locale URL'lerine çevrildi.
- [x] Backend ve frontend typecheck geçti.
- [x] Backend ve frontend production build geçti.
- [x] Production deploy: `2f075fd5`.
- [x] Canlı EN/DE blog izolasyonu kabul testi geçti.
- [x] Canlı sitemap ve iç-link crawl kabul testi: `395 URL · 0 hata · 0 dil uyarısı`.
- [x] GSC sitemap yeniden gönderimi: HTTP `204`, `isPending=true`, `0` uyarı, `0` hata.
- [x] Mobil Lighthouse başlangıç ölçümü alındı: Performance `49`, SEO `100`.
- [x] İzleme scriptleri yalnız analytics izni sonrası yüklenecek şekilde düzeltildi.
- [x] Ana sayfa alt bölümlerine `content-visibility: auto` eklendi.
- [x] Performans paketi deploy edildi: `5b9c88dd`.
- [x] Üç koşuluk canlı mobil Lighthouse medyanı: Performance `55`, SEO `100`,
  LCP `4,02 sn`, TBT `1,63 sn`, CLS `0`; izin öncesi üçüncü taraf tracker isteği `0`.
- [x] Başlangıca göre TBT yaklaşık `%52`, ana-thread işi `%31`, toplam yük `%26` azaldı.
- [ ] GSC 5xx doğrulamasını panelden yeniden başlat.
- [ ] 7 günlük legacy URL/non-home CTR kontrolü.
- [ ] 14-28 günlük uyum sayfaları indeks/performans kararı.

## Ölçüm hedefleri

- Ana sayfa dışı sayfa-boyutlu CTR: başlangıç yaklaşık `%1,23`; 28 günde artış.
- Legacy host/path gösterimleri: mevcut 28 günde `46`; düzenli düşüş.
- EN/DE indekslenebilir ana sayfalarda Türkçe görünür içerik: `0` (canlı kabul geçti).
- Sitemap URL'leri: `0` redirect, `0` canonical hatası, `0` hreflang hatası.
- Coverage 5xx: yeniden tarama sonrası `0` aktif URL.

## 29 Ağustos canlı takip

- GSC sitemap durumu tamamlandı: `isPending=false`, son indirme 28 Ağustos
  21:53 UTC, `395` gönderilen URL, `0` hata ve `0` uyarı.
- Güncel sayfa fırsat kontrolünde `/en/yildizname`: `3` tıklama, `88` gösterim,
  `%3,41` CTR ve `4,51` ortalama pozisyon. Görünür `yildizname` sorgusu özelinde
  `20` gösterim, `0` tıklama ve `3,5` ortalama pozisyon bulundu.
- İngilizce Yildizname başlık/açıklaması arama niyetine göre yenilendi; okuma
  sonrası sabit `/tr/` yönlendirmesi aktif locale kullanacak şekilde düzeltildi.
- Değişiklik `ddc351b` commit'iyle gönderildi; frontend/backend typecheck, CI
  build gate ve production deploy geçti. Canlı metadata, locale sonuç akışı ve
  tam sitemap crawl kabul edildi.

### Takip checklist'i

- [x] GSC sitemap işlenme durumu doğrulandı: `395 URL · 0 hata · 0 uyarı`.
- [x] Pozisyonu 30 ve üzeri görünürlük fırsatları sayfa+sorgu bazında tarandı.
- [x] `/en/yildizname` snippet ve locale sonuç akışı düzeltildi.
- [x] `ddc351b` production deploy ve canlı metadata/akış kabulü.
- [x] Deploy sonrası tam crawl: `395 URL · 0 hata · 0 dil uyarısı`.
