# GoldMoodAstro — rakip analizi, strateji ve açık işler

**Tarih:** 8 Eylül 2026 · **Tenant:** `goldmoodastro` · **Kapsam:** Tanitio’da izlenen rakipler, mevcut GoldMood web içerikleri, strateji/hafıza tutarlılığı, GSC/GA4 ve Meta erişim kontrolü.

## 1. Karar özeti

**GoldMood’un açığı araç sayısı değil; mevcut kişisel harita, içerik ve gerçek danışman hizmetinin anlaşılır ve ölçülebilir bir yolculukta buluşması.** Rakipler ücretsiz araç, sonuç açıklaması ve sonraki adımı açık biçimde sunuyor. GoldMood’da bu parçaların çoğu zaten var; yeni araç açmak ilk iş olmamalı.

Bu çalışmada Tanitio’daki **30 izlenen kaydın tamamı değerlendirildi**. Başlangıçta yalnız 3 rapor vardı. Sonuç: **29 kaynakla sınırlı analiz + 1 kanıt yetersizliği kaydı** panelde kaydedildi. Bir kaydın rapor alanının dolması, o rakibin tüm faaliyetlerinin incelendiği anlamına gelmez. Facebook `astrolojiyolculugu` giriş ekranına yönlendiği için içerik/performans uydurulmadı.

En önemli işler:

1. Bing keşfindeki alakasız sonuçları strateji kanıtından çıkarmak; arama niyeti kontrolü olmadan rakip sırası üretmemek.
2. Üç eski rapordaki bırakılmış burç listesi/günlük seri önerilerini temizlemek — **bu raporlarda yapıldı**. Mevcut yayın kararını değiştirmemek.
3. Strateji/hafızadaki eski bağlantı hataları, yanlış Büyük Üçlü tanımı ve kanıtsız performans genellemelerini düzeltmek — **bu raporda görevleştirildi; strateji/hafıza henüz değiştirilmedi**.
4. Gerçek danışman + kişisel araç farkını somut hizmet kapsamıyla anlatmak. “Kişisel harita” mesajı rakiplerde de var; tek başına benzersiz değil.
5. GA4 satın alma kayıtlarını ödeme/randevu kayıtlarıyla eşleştirmek ve Stripe yönlendirmesinin kaynak atamasını kontrol etmek; rakip büyüklüğüne bakıp reklam bütçesi artırmamak.
6. Çalışmayan uygulama indirme bağlantılarını ve ilk HTML’deki dil tutarsızlığını düzeltmek; blogları tekrar üretmek yerine mevcut içeriklere örnek eklemek.

## 2. Korunacak kullanıcı kararları

Canlı strateji revizyonu **2**, son güncelleme 7 Eylül. 4 Eylül kararı açık: haftalık/günlük burç listesi, 12 burç carousel ve genel burç uyumu serisi bırakıldı. Ritim **Salı/Perşembe/Cumartesi toplam 3 feed**, Cumartesi bunlardan biri Reel; story yalnız feed günlerinde. Haftalık Reel ayrıca dördüncü feed olarak eklenmemeli.

Mevcut mor–altın görsel dil ve `gm-2026m09` UTM kampanyası korunur. Rakibin sık paylaşım yapması bu kararı otomatik geçersiz kılmaz. Tarihli gezegen/ay iddiaları kendi motorundan; semboller ilgili tarot/rüya/kahve sözlüğünden gelmeli. Gök verisi ön kontrolü `bun run scripts/sky-report.ts 2026-09-08 2026-10-06 --houses` ile başarılı çalıştırıldı. Bu rapor tarihli gök yorumu veya yeni post üretmedi.

AGENTS.md’deki kişisel farkındalık/eğlence çerçevesi ve yasaklı hizmet kuralları geçerlidir. Advicemy’nin terapi konumlandırması veya başka sitelerin şans/kesin sonuç vaatleri GoldMood’a taşınmaz. Danışman görüşmesi psikolojik, tıbbi, hukuki veya finansal hizmet olarak pazarlanmaz.

## 3. Kaynaklar ve veri kalitesi

### Kullanılan kanıt

- Tanitio canlı `goldmoodastro` rakip kayıtları ve kaynak snapshot’ları: 8 Eylül. Üç eski Instagram hesabı bu çalışmada izinli mevcut collector ile yenilendi.
- Beş Instagram hesabı için profil ve **hesap başına 12 gönderilik** API örneklemi. Takipçi sayısı anlık; gönderi dönemi hesaplar arasında farklı.
- Seçilmiş resmî siteler: noscere, My Zodiac AI, DestinyKey, Astrokora, Astroasist, ChartNova, Astrosofa ve Advicemy. Arama aracındaki bazı sayfalar önbellekten gelebilir; kaynak iddiası ürün testi değildir.
- GoldMood ana sayfa ve ilgili araç/servis sayfaları doğrudan HTTP ile; ana sayfa ayrıca gerçek tarayıcıda incelendi. Blog listesindeki **10 yazının** gövde/bölümleri okundu; bu sayı tüm dillerdeki DB kayıt sayısı değildir.
- GSC ve GA4 mevcut bağlantıdan yeniden çekildi; Meta hesap özeti de başarılı geldi.

Kalıcı kanıt özeti: [GOLDMOOD-RAKIP-STRATEJI-KANITLARI-2026-09-08.json](GOLDMOOD-RAKIP-STRATEJI-KANITLARI-2026-09-08.json). Tekrarlanabilir temel kontroller: [GOLDMOOD-RAKIP-VERI-KALITESI-2026-09-08.ipynb](GOLDMOOD-RAKIP-VERI-KALITESI-2026-09-08.ipynb). Oturum anahtarı, özel mesaj veya müşteri kaydı içermez.

### Kalite bulguları

| Öncelik | Bulgu | Kanıt / kapsam | Analiz riski ve yapılacak |
|---|---|---|---|
| P0 / yüksek güven | Bing tamamlandı ama sonuçlar amaca uygun değil | 30/30 sorgu, 595 sonuç; “doğum” ile başlayan 10 sorguda hastane/doğum sayfaları; diğer örneklerde alakasız hesaplayıcı/film/şirket sonuçları | “status=ok” kalite garantisi değildir. Bing koşusu bu stratejinin rekabet sıralamasına alınmadı |
| P0 / yüksek güven | Eski rakip önerileri marka kararıyla çelişiyor | 3 eski raporda günlük burç, Part1/2 listesi ve fazladan yayın önerileri | Üç rapor güncel kanıt ve 4 Eylül kararıyla yeniden yazıldı |
| P1 / yüksek güven | Örneklem zamanları karşılaştırılabilir değil | `yildiznamecomtr` 12 postu Nisan 2024–Mart 2026; diğerleri Ağustos–Eylül 2026 | Eski örneklem “son 30 gün” veya güncel yayın temposu diye sunulmadı |
| P1 / yüksek güven | Eksik beğeni sıfır sanılabilir | Advicemy 12 postun yalnız 4’ünde beğeni değeri var | Bilinen değerlerle hesapla; rakibe karşı düşük etkileşim sonucu çıkarma |
| P1 / yüksek güven | Genel portal sayıları ürün fiyatı sanılabilir | Hesaplyor snapshot’ındaki altın/döviz/akaryakıt sayıları | Astroloji fiyat karşılaştırmasından çıkar; konu sayfasını seç |
| P1 / yüksek güven | Snapshot başarısı gerçek içerik başarısı olmayabilir | Facebook giriş ekranı; Astrosofa Cloudflare başlığı | İlki yetersiz kanıt; ikincisi resmî web incelemesiyle ayrıca değerlendirildi |
| P1 / yüksek güven | Eski bağlantı alarmı artık doğru değil | GSC, GA4 ve Meta 8 Eylül çağrıları başarılı | Stratejide `invalid_grant` ve tamamen kör ölçüm iddiası güncellenecek |
| P1 / yüksek güven | AI değerlendirmesi performans verisiyle karışıyor | 19 aktif hafıza maddesinin 15’i `inference`; örnekleri 86/100 kreatif puanı gibi model değerlendirmeleri | Model puanlarını gerçek izlenme/satış sonucu sayma; ham ölçümden ayır |

Bing kök nedeni bu çalışmada kesinleştirilmedi. Kod sorguyu URL-encode ediyor; buna bakıp “yalnız ilk kelime gönderiliyor” sonucu çıkarılamaz. İstek URL’si, dönüşte sorgu düzeltmesi/yönlendirme ve ayrıştırılan bloklar birlikte kaydedilerek araştırılmalı. Önerilen kabul testi: aynı özgün sorgu için kaynak URL, motor, dil, sonuç başlığı ve konu ilgisi doğrulanmalı; giriş/engel ekranı başarı sayılmamalı. Kullanıcı sorgusunu sessizce değiştirerek düzeltme yapılmamalı.

Bing koşusu: `4695f1d1-0fac-4d80-a319-6eb92ce7ab25`. Karşılaştırma için kullanılan Yandex: `4bed2cbd-3a36-4ac9-8af5-b0fd047021d8`, 30/30 sorgu, 621 sonuç. Brave koşusu 30/30 ve 518 sonuç, fakat 8 sayfa Yandex yedeği kullandığından saf Brave benchmark’ı sayılmadı. Motorlar tek skor altında birleştirilmedi.

## 4. Arama görünürlüğü: gerçekten kimlerle karşılaşıyoruz?

Aşağıdaki değerler aynı Yandex sorgu kümesinin tarama konumlarıdır; Google sırası, trafik veya pazar payı değildir. Toplam sonuç sayısı benzersiz alan adı sayısı değildir.

| Alan adı | Göründüğü sorgu / 30 | Ortalama tarama konumu | Karşılaştırma anlamı |
| astroasist.com | 22 | 2.6 | Sorgu kümesi içindeki görünürlük; satış üstünlüğü değil |
| astroak.com | 17 | 9.4 | Sorgu kümesi içindeki görünürlük; satış üstünlüğü değil |
| astrochart.co | 16 | 10.8 | Sorgu kümesi içindeki görünürlük; satış üstünlüğü değil |
| chartnova.app | 13 | 9.1 | Sorgu kümesi içindeki görünürlük; satış üstünlüğü değil |
| astrokora.com.tr | 12 | 3.8 | Sorgu kümesi içindeki görünürlük; satış üstünlüğü değil |
| destinykey.org | 12 | 7.9 | Sorgu kümesi içindeki görünürlük; satış üstünlüğü değil |
| my-zodiac-ai.com | 12 | 12.7 | Sorgu kümesi içindeki görünürlük; satış üstünlüğü değil |
| astrosofa.com | 11 | 1.0 | Sorgu kümesi içindeki görünürlük; satış üstünlüğü değil |

Örnekleme Türkiye merkezli arama ayarlarıyla TR/EN/DE sorgular karışık girmiş. Bu nedenle DE pazarının tümü hakkında hüküm vermiyoruz. Astroasist ve Astrokora’nın ilgili harita sayfaları güçlü içerik karşılaştırma adayları; konum haritası siteleri ise ana ürün stratejisini değiştirecek doğrudan talep kanıtı değil.

### Google Search Console — ayrı gerçek kaynak

9 Ağustos–5 Eylül ile önceki 12 Temmuz–8 Ağustos karşılaştırması: **59 vs 29 tıklama**, **1.044 vs 1.408 gösterim**, **%5,65 vs %2,06 CTR**, ortalama konum **62,58 vs 75,48**. Gösterim azalırken tıklama artmış; bunu tüm SEO’nun iyileştiği veya bozulduğu diye tek cümlede açıklamak yanlış olur. Sorgu/dil karması ve düşük hacim etkili olabilir. Toplamlar property düzeyi gruplamasız rapordan; sorgu satırları anonimleştirme nedeniyle toplama eşit olmayabilir.

| Sorgu | Gösterim | Tıklama | Google ort. konum | Karar |
|---|---:|---:|---:|---|
| yildizname | 24 | 1 | 3,79 | Küçük ama ilgili fırsat; mevcut Yıldızname sayfasının kapsamını ve sonraki adımını netleştir |
| rising calculator | 6 | 1 | 76,33 | EN arama niyeti; Türkçe paylaşımla tüm açığı kapatmayı bekleme |
| calculate your rising sign | 7 | 0 | 76,71 | Mevcut EN yükselen içeriğini yöntem/örnek açıklamasıyla geliştir |
| doğum haritası bakma | 5 | 0 | 94,80 | Mevcut harita sayfasına odaklan; yeni araç yerine içerik ve indeksleme kontrolü |
| doğum haritası yorumlama | 4 | 0 | 77,75 | Mevcut harita rehberi ve blog yazısının rolünü ayır |
| doğum haritası saatsiz | 3 | 0 | 79,67 | Mevcut doğum saati açıklamasını netleştir; hesaplanamayan alanlar için kesinlik verme |

Bu sayılar arama hacmi değildir. “Akrep aşk” gibi genel burç sorgularındaki görünürlük, bırakılmış sosyal seri kararını geri çevirmez. Mevcut SEO sayfalarını silmek de bu raporun önerisi değil.

## 5. Sosyal rakipler: ölçek, biçim ve sınır

Her hesabın örneklem büyüklüğü 12. Medyan, görünen beğenilerin ortadaki değeridir; uç değerlerin etkisini azaltır. Erişim, izlenme, kaydetme ve satış olmadan hesaplar arasında başarı sıralaması yapılmadı.

| Hesap | Anlık takipçi | Post örnek dönemi | Görünen beğeni / 12 | Medyan beğeni | Kullanılacak ders |
| yildiznamecomtr | 11,331 | 2024-04-07 → 2026-03-06 | 11 | 3 | Mevcut danışman sayfasında hizmet türü, görüşme biçimi ve sonraki adımı kısa biçimde açıklayın. |
| yildizname.de | 27,824 | 2026-08-16 → 2026-09-07 | 12 | 128.0 | TR ve DE ana akışlarında dili tamamlayın; ücretsiz araç, AI çıktı ve ücretli insan görüşmesini ayrı açıklayın. |
| betilojiapp | 214 | 2026-08-26 → 2026-09-06 | 12 | 9.0 | Örneklemden yalnız tek sorulu anlatım prensibini alın; bırakılmış burç listesi/uyum serisini geri açmayın. |
| advicemycom | 5,011 | 2026-08-08 → 2026-09-04 | 4 | 5.5 | Yalnız uzman profili ve süreç açıklığı açısından referans alın; terapi/sağlık vaadini GoldMood’a taşımayın. |
| ms_astro | 184,395 | 2026-08-28 → 2026-09-08 | 12 | 1513.0 | Uygulama indirme veya burç sıralamasını kopyalamayın; GoldMood’un mevcut danışman akışına tek net çağrı koyun. |

Yıldızname 1001 Fal örneğinde bilinen beğeni ortalaması 108,45, medyan 3: tek ortalamayla “güçlü performans” demek yanıltıcı. Advicemy’nin eksik 8 beğenisini sıfır saymak da yanıltır. Ms Astro için büyük takipçi sayısı doğrulandı; bu, aynı formatın 25 takipçili GoldMood’da aynı sonucu vereceğini göstermez.

Güncel üç hesap yenilemesi: Betiloji 214 takipçi (eski not 135), Advicemy 5.011 (eski not yaklaşık 4,4 bin), Ms Astro 184.395. Eski araştırma ile yeni API rakamlarının yöntemi/tarihi farklı olabileceği için bunlardan kesin büyüme yüzdesi üretilmedi.

GoldMood Meta profil kontrolü: Instagram 25 takipçi ve 57 medya; Facebook 1 takipçi. Özet uçtaki erişim gibi değerler açık tarih penceresi taşımadığından burada 28 günlük performans diye kullanılmadı. Demografi boş; mevcut stratejideki 20–40 yaş hedefi doğrulanmış mevcut kitle olarak sunulmamalı. Facebook erişim/gösterim alanları `null`; sıfır erişim anlamına gelmez.

## 6. Otuz kayıt için değerlendirme

Her satırın ayrıntılı, kaynak sınırlı karşılığı panelde kaydedildi. “Doğrudan”, “komşu hizmet”, “araç referansı” ayrımı izleme tercihini değiştirmez; hiçbir hesap takipten çıkarılmadı. Web meta açıklamasından estetik kalite veya ödeme başarısı çıkarılmadı.

| Rakip / kaynak | Sınıf | Gözlem ve GoldMood için yapılacak |
| [yildiznamecomtr](https://www.instagram.com/yildiznamecomtr/) | Doğrudan uygulama/danışman alternatifi | Profil, birden çok yorum türünü gerçek yorumcular ve mobil uygulama çağrısıyla sunuyor. **İş:** Mevcut danışman sayfasında hizmet türü, görüşme biçimi ve sonraki adımı kısa biçimde açıklayın. |
| [yildizname.de](https://www.instagram.com/yildizname.de/) | TR/DE kişisel rapor alternatifi | Profilde Türkçe/Almanca, ücretsiz başlangıç, çift uyumu ve bir saatlik kişisel rapor vaadi var; teslim süresi bağımsız doğrulanmadı. **İş:** TR ve DE ana akışlarında dili tamamlayın; ücretsiz araç, AI çıktı ve ücretli insan görüşmesini ayrı açıklayın. |
| [astrolojiyolculugu](https://www.facebook.com/astrolojiyolculugu) | Kanıt yetersiz | Kayıtlı Facebook isteği giriş sayfasına yönlendi; sayfanın yayınları veya hizmetleri doğrulanamadı. **İş:** Geçerli public içerik gelene kadar stratejiye alma. |
| [astrologym.com](https://astrologym.com/) | Araç/içerik alternatifi | Meta açıklaması astroloji, burç ve kişiselleştirilmiş rehberliği öne çıkarıyor; kullanım akışı bu kayıtta yok. **İş:** Doğum haritası aracının mevcut açıklamasında gerekli girdileri ve örnek çıktıyı netleştirin. |
| [astrology.com](https://astrology.com/) | Uluslararası içerik/yorum alternatifi | Meta açıklaması ücretsiz yorumlar, tarot ve çeşitli astroloji içeriklerini listeliyor. **İş:** Konu sayısını artırmak yerine mevcut tarot ve harita içeriklerini ilgili danışman seçimine bağlayın. |
| [noscere.co](https://noscere.co/) | DE araç/rehber alternatifi | Resmî sayfa ücretsiz hesaplayıcıları, kavram rehberlerini ve hesaplama kurallarını birlikte sunuyor. **İş:** Mevcut harita sayfasındaki yöntem, saat dilimi, doğum saati sınırı ve terim açıklamalarını doğru dilde görünür kılın. |
| [hesaplyor.com](https://hesaplyor.com/) | Genel araç kaynağı; doğrudan danışman rakibi değil | Ana sayfa çok sayıda genel hesaplayıcıyı kapsıyor. Yakalanan döviz/altın/fuel sayıları astroloji hizmet fiyatı değildir. **İş:** Genel portalı fiyat veya danışmanlık kıyasından çıkarın; ancak ilgili yükselen hesaplayıcısı doğrulanırsa araç deneyimini karşılaştırın. |
| [my-zodiac-ai.com](https://my-zodiac-ai.com/) | AI kişisel harita alternatifi | Resmî mesaj, genel Güneş burcu içeriği yerine bütün haritadan kişisel yorum ve ücretsiz/ücretli plan ayrımı. **İş:** Yalnız “kişisel harita” söylemiyle ayrıştığımızı varsaymayın; mevcut gerçek danışmana geçişin farkını somut örnekle anlatın. |
| [destinykey.org](https://destinykey.org/) | Kişisel harita/rapor alternatifi | Kaynak ücretsiz harita, hesaplama yöntemi ve daha derin ücretli rapor seçeneklerini sunuyor. **İş:** Mevcut ücretsiz sonuç, Premium erişim ve seansın birbirinden farkını fiyatlandırma açıklamasında gösterin. |
| [chartnova.app](https://chartnova.app/) | Hesaplayıcı/AI alternatifi | Resmî yükselen sayfası ücretsiz hesaplayıcı ile AI yorumunu ilişkilendiriyor. **İş:** Mevcut yükselen aracında sonuç terimlerini ve harita/danışman sonraki adımını sadeleştirin. |
| [astrochart.co](https://astrochart.co/) | Araç ve astrocartography alternatifi | Meta içerik konum haritası ve gezegen çizgileri üzerine kurulu; GoldMood’daki eşdeğer işlev bu kontrolde doğrulanmadı. **İş:** Yeni konum aracı açmayı bu veriden zorunlu çıkarmayın; mevcut harita sonuçlarının anlaşılmasını önceleyin. |
| [astroak.com](https://astroak.com/) | Harita/sinastri araç alternatifi | Meta açıklaması doğum haritası, sinastri ve hesaplama yöntemini birlikte vurguluyor. **İş:** Mevcut sinastri sayfasında giriş bilgileri, sonuç kapsamı ve yorum sınırını gerçek örnekle açıklayın. |
| [dogum-haritasi.hesaplama.net](https://dogum-haritasi.hesaplama.net/) | Arama niyeti/ücretsiz araç rakibi | Doğrudan doğum haritası hesaplama sayfası ücretsiz araç ihtiyacını hedefliyor. **İş:** Kayıt gerektiren ve gerektirmeyen aşamaları mevcut araçta açık söyleyin; yeni hesaplayıcı kurmayın. |
| [my.astrofame.com](https://my.astrofame.com/) | İçerik/kişisel yorum alternatifi | Kaynak ücretsiz içerik ve ücretli e-posta yorumuna yönlendirme içeriyor. **İş:** GoldMood’un gerçek seans ve varsa yazılı hizmet kapsamını netleştirin; rakibin şans/garanti dilini kullanmayın. |
| [birthchart.net](https://birthchart.net/) | Kişisel rapor alternatifi | Meta açıklaması doğum anına dayalı kişisel harita okumasını tanıtıyor; rapor kalitesi incelenmedi. **İş:** Mevcut danışmanlık rehberine anonim/örnek olduğu belirtilmiş teslim kapsamı ekleyin. |
| [yorumcu.com](https://yorumcu.com/) | TR içerik/yorum alternatifi | Kaynak astroloji raporları ve farklı sembolik yorum kategorilerini listeliyor. **İş:** Tarot, rüya ve numeroloji içeriklerini kendi sözlük/motor verilerinden üretin; riskli veya ilgisiz kategorileri kopyalamayın. |
| [prokerala.com](https://prokerala.com/) | Genel portal içindeki astroloji alternatifi | Ana başlık sağlık, seyahat ve astrolojiyi birlikte taşıyor; ana sayfa astroloji hizmeti karşılaştırması için sınırlı. **İş:** Sağlık/seyahat portalını doğrudan danışman rakibi saymayın; yalnız konuya ait astroloji URL’siyle kıyas yapın. |
| [astrosage.com](https://astrosage.com/) | AI/astroloji alternatifi | Kaynak başlığı AI destekli astroloji hizmetini öne çıkarıyor; yalnız başlıktan çalışma kalitesi çıkarılamaz. **İş:** GoldMood’da astronomik hesap, AI anlatım ve insan yorumunun rollerini ayrı açıklayın. |
| [astrokora.com.tr](https://astrokora.com.tr/) | TR astroloji platformu alternatifi | Resmî site uzman astrologları platform çatısı altında sunuyor; hesaplayıcı sayfası da keşifte bulunuyor. **İş:** Mevcut danışman profillerindeki uzmanlık, dil, hizmet biçimi, süre ve müsaitlik bilgisini görünür ve güncel tutun. |
| [astrocarto.org](https://astrocarto.org/) | Konum haritası/AI alternatifi | Meta içerik ücretsiz astrocartography ve AI yorumunu tanıtıyor. **İş:** Bu yan kategoriyi yeni ürün açma gerekçesi saymayın; talep doğrulanana kadar mevcut kişisel harita odağını koruyun. |
| [astrology.com.tr](https://astrology.com.tr/) | Araç/rehber alternatifi | Meta açıklaması harita, dönüş haritaları ve gezegen/ay araçlarını listeliyor. **İş:** Mevcut araçların yardım metinlerini kavram rehberleriyle bağlayın; farklı araç sayısını başarı ölçüsü yapmayın. |
| [cafeastrology.com](https://cafeastrology.com/) | Uluslararası içerik referansı | Meta açıklaması harita, ilişki astrolojisi ve dönemsel yorumlar içeriyor; içerik hacminden satış çıkarılamaz. **İş:** Mevcut sinastri ve Ay burcu yazılarında kendi motor çıktısına bağlı örneği geliştirin. |
| [horoscopes.astro-seek.com](https://horoscopes.astro-seek.com/) | Ücretsiz araç/içerik referansı | Kayıtlı başlık ve bağlantılar doğum haritası, partner uyumu ve transit araçlarını gösteriyor. **İş:** Yeni araç yerine mevcut doğum haritası sonuçlarında terim ve yöntem açıklamasını iyileştirin. |
| [astrolibrary.org](https://astrolibrary.org/) | Eğitim/araç referansı | Meta açıklaması ücretsiz dersler, kitaplar, sinastri raporu ve harita yorumunu birlikte sunuyor. **İş:** Mevcut blogu giriş rehberi olarak kullanın; aynı konuya yeni kopya yazı yerine sonuç örneği ekleyin. |
| [astrosofa.com](https://www.astrosofa.com/) | Uluslararası araç/içerik referansı | Panel snapshot’ı Cloudflare kontrolüydü. 8 Eylül resmî web incelemesi yükselen aracı, rehberler ve rapor mağazası bağlantılarını doğruladı. **İş:** Boş engel sayfasını analiz etmeyin; mevcut yükselen sayfası ile ilgili rehber bağlantılarını geliştirin. |
| [astroasist.com](https://astroasist.com/) | TR doğum haritası arama rakibi | Resmî sayfa ücretsiz harita hesaplama ve ilk yorum başlıklarını birlikte sunuyor; Yandex sorgu kümesinde sık görünüyor. **İş:** Mevcut doğum haritası sayfasını sonuç okumaya yönelik kısa örnekle güçlendirin; Google sırasını ayrı izleyin. |
| [nextastrology.com](https://nextastrology.com/) | Ücretsiz araç/rapor alternatifi | Kaynak ücretsiz harita/sinastri ile e-posta aboneliği çağrısını birlikte gösteriyor. **İş:** GoldMood’da mevcut hesap ve danışman yollarını açıklayın; sırf rakip kullanıyor diye yeni e-posta otomasyonu açmayın. |
| [betilojiapp](https://www.instagram.com/betilojiapp/) | Sosyal içerik referansı | Yeni 12 gönderilik örneklem video ağırlıklı; ilişki ve burç odaklı açıklamalar var. Eski 135 takipçi notu güncel değil. **İş:** Örneklemden yalnız tek sorulu anlatım prensibini alın; bırakılmış burç listesi/uyum serisini geri açmayın. |
| [advicemycom](https://www.instagram.com/advicemycom/) | Komşu danışmanlık modeli; aynı hizmet değil | Güncel içerik ve resmî site psikolog/terapi hizmetlerini öne çıkarıyor. GoldMood’un astroloji hizmetiyle eşdeğer değil. **İş:** Yalnız uzman profili ve süreç açıklığı açısından referans alın; terapi/sağlık vaadini GoldMood’a taşımayın. |
| [ms_astro](https://www.instagram.com/ms_astro/) | Sosyal uygulama/içerik referansı | Güncel 12 gönderi örnekleminde yorum çağrıları ile görsel/carousel içerikleri var; bio uygulamaya yönlendiriyor. **İş:** Uygulama indirme veya burç sıralamasını kopyalamayın; GoldMood’un mevcut danışman akışına tek net çağrı koyun. |

### En anlamlı ayrışma

[My Zodiac AI](https://my-zodiac-ai.com/) ve [noscere](https://noscere.co/de) de genel burç yerine kişisel harita/anlamlandırma dilini kullanıyor. “Güneş burcundan fazlası” mesajı tek başına farklılaşma sağlamaz. GoldMood’un mevcut gerçek danışman profilleri ve görüşme akışını; örnek soru, teslim kapsamı, süre ve kullanıcıya kalan karar alanıyla görünür kılmak daha somut bir öneridir. Bu bir konumlandırma hipotezidir; dönüşüm üstünlüğü henüz ölçülmedi.

[Astrokora](https://www.astrokora.com.tr/) ilgili platform kıyasıdır. [Advicemy](https://www.advicemy.com/) ise güncel olarak terapi/psikolog ağırlıklı bir komşu hizmettir; hizmet vaadi değil yalnız uzman seçimi/süreç açıklığı açısından referans alınmalı.

## 7. GoldMood’da mevcut olanlar ve açık kalanlar

### Mevcut olanları yeniden yapmayalım

Ana sayfada danışman seçimi → randevu → görüşme anlatımı, uzmanlık kategorileri, danışman kartları ve fiyatlandırma var. Doğum haritası, yükselen, Büyük Üçlü, sinastri, tarot ve Yıldızname sayfaları çalışıyor. Araç sayfalarında rehber/SSS metinleri; danışman ve fiyatlandırma sayfalarında hizmet açıklamaları bulunuyor. Dolayısıyla “SSS yok”, “danışman akışı yok”, “blog yok” tespiti yanlış olur.

Doğru Türkçe yollar: `/tr/yukselen-burc-hesaplayici`, `/tr/buyuk-uclu`, `/tr/sinastri`, `/tr/danismanlar`; bunlar mevcut menüden doğrulandı. Tahminen denenen `/tr/yukselen-burc-hesaplama` ve `/tr/synastry` 404’leri site menüsündeki kırık link diye raporlanmadı.

### Doğrulanan açıklar

**A. İlk HTML ve tarayıcı dili farklı — P1.** Doğrudan HTML’de Türkçe sayfada İngilizce bölüm başlıkları ve plan metinleri var. Gerçek tarayıcıda yükleme tamamlanınca ana bölüm başlıkları Türkçeye dönüyor. Bu, tüm arayüzün sürekli İngilizce kaldığını değil; sunucudan gelen ilk içerik ile istemci içeriğinin tutarsızlığını gösteriyor. Aynı sorun DE ilk HTML’de de görüldü; DE tarayıcı kabulü ayrıca yapılmalı. SSR ve hydration metinleri aynı locale kaynağından gelmeli. Bu bulgudan tek başına indeks kaybı sonucu çıkarılmadı.

**B. İki mağaza indirme bağlantısı boş — P1.** App Store ve Google Play düğmeleri HTTP HTML’de ve gerçek tarayıcı DOM’unda `href="#"`. İndirme kampanyası başlatılmamalı. Gerçek mağaza URL’si varsa bağla; yoksa mevcut web deneyimine yönlendir veya indirme çağrısını kaldır. Uygulama mağazasında yayın durumunu bu kontrolde doğrulamadık.

**C. Büyük Üçlü tanımı stratejide yanlış — P1.** Canlı strateji “Yükselen/Ay/Venüs” diyor; mevcut sitede ve repo sayfa tanımında Güneş/Ay/Yükselen. Venüs ayrı içerik olarak kalabilir, Büyük Üçlü yerine geçmez. Sosyal post üretmeden önce strateji, seri adı ve prompt aynı tanımla hizalanmalı.

**D. Genel rehber bölümleri tekrar ediyor — P1.** Araç sayfalarında uzun ortak “sorumlu kullanım/sonraki adımlar” anlatımları var. Gerekli sınır açıklaması korunmalı; tekrar eden metin yerine her aracın kendi giriş/sonuç örneği eklenmeli. Uzun metin veya şablon SEO puanı tek başına içerik kalitesi değil.

**E. Vaatler veriyle eşleştirilmeli — P1.** Ana sayfada uzman sayısı, kullanıcı deneyimi ve erişimle ilgili iddialar var. Bu raporda aktif uzman/gerçek tamamlanan seans sayılarıyla mutabakat yapılmadı. Yanlış oldukları ilan edilmedi; reklamda kullanmadan önce kanıt gerektiren açık madde olarak bırakıldı. Fiyat/indirim/aboneliğe dahil seans ifadeleri de gerçek ödeme kapsamıyla kontrol edilmeli.

## 8. İçerik stratejisi: mevcut yazılara özgün katkı

Liste sayfasındaki 10 yazı incelendi. Her biri için aşağıdaki öneri mevcut slug’ı korur; yeni konu tekrarı yaratmaz.

| Mevcut yazı (blog slug) | Zenginleştirme brief’i | Sonraki adım |
|---|---|---|
| `dogum-haritasi-nedir` | Mevcut kavramlara kendi motorundan üretilmiş örnek harita ekle; giriş verisi ve hesap yöntemi belirt. Kurgusal örnek açıkça etiketlensin | Mevcut doğum haritası aracı |
| `ay-burcu-duygusal-ihtiyaclar` | Güneş–Ay–Yükselen farkını tek örnekte anlat; Büyük Üçlü adını düzelt | `/tr/buyuk-uclu` |
| `sinastri-uyumu-nasil-okunur` | Gerçek motor çıktısında tek açı/terimi nasıl okuyacağını ve yorumun sınırını açıkla; yüzdelik ilişki garantisi üretme | `/tr/sinastri` ve ilgili danışman |
| `tarot-acilimi-soru-sorma-rehberi` | Sözlükteki gerçek bir kartla açık uçlu soru örneği; mevcut açılımın nasıl kullanılacağı | `/tr/tarot` |
| `numeroloji-hayat-yolu-sayisi` | Mevcut hesap örneğini `calculateLifePath` sonucu ile doğrula; yöntem farkını açıkla | Mevcut numeroloji aracı |
| `astrolojik-danismanliktan-neler-beklemeliyiz-danismanlik-verimini-nasil-yukseltiriz` | Zaten seans hazırlığı var; örnek hizmet kapsamı ve danışman profiline bağlamlı bağlantı ekle | İlgili aktif danışman profili |
| `ruhsal-danisman-secme-rehberi` | Uzmanlık/dil/süre/görüşme biçimini gerçek profil örneğiyle göster; terapi hizmeti gibi anlatma | `/tr/danismanlar` |
| `merkur-retrosunda-eski-sevgili-doner-mi` | Mevcut kesinlikten kaçınan çerçeveyi koru; başlık/CTA’nın geri getirme garantisi ima etmediğini kontrol et | Mevcut sinastri rehberi |
| `retro-donemlerinde-karar-almak` | Tarihli örnek verilecekse motorla doğrula; korku ve acele satış çağrısı kullanma | Mevcut ilgili araç |
| `gunluk-rituel-astroloji-tarot` | Başlıktaki ritüelin kişisel günlük/check-in olduğu, büyü/ritüel hizmeti olmadığı açıklaşsın; kısa rutin diye sadeleştir | Mevcut tarot aracı |

İlk üretim paketi: harita örneği, danışmanlık beklentisi ve tarot soru rehberi. Bir makaleden yeni içeriği kopyalamadan tek soru odaklı feed, feed-günü story ve haftalık Reel türetilebilir. Gerçek danışman videosu kullanılacaksa danışmanın içerik/yayın rızası ve ilgili videonun doğru kapağı doğrulanmalı. Bu raporda yayın veya zamanlama yapılmadı.

Yeni blog adayı ancak mevcut içerikte karşılanmayan ihtiyaç varsa: “Ücretsiz sonuç, AI yorum ve danışman görüşmesi arasındaki fark”. Önce fiyatlandırma/ilgili SSS’de çözülebilirliği değerlendir. Ayrı makale gerekiyorsa kapsam/kim üretir/ne teslim edilir/ne dahil değildir başlıklarıyla yaz; yeni ürün veya modül kurma.

## 9. Önerilen strateji revizyonu — uygulama taslağı

**Hedef:** mevcut ücretsiz araç kullanıcısını, ne alacağını anlayarak uygun gerçek danışmana veya uygun mevcut plana yönlendirmek. Takipçi sayısı yardımcı gösterge; asıl sonuç doğrulanmış ve tamamlanmış hizmet.

**Konumlandırma taslağı:** “Kişisel haritanı ve sembolik araçları anlaşılır biçimde keşfet; ihtiyaç duyduğunda kapsamı açık bir görüşmeyle gerçek danışmandan farklı bir bakış açısı al.” Mevcut mor–altın kimlik korunur. Rakibe göre üstünlük, kesinlik veya sonuç garantisi verilmez.

**İçerik dağılımı:** mevcut 45/20/20/15 sütunları ve yayın ritmi şimdilik korunabilir. İçeriklerde üç düzeltme yeterli: kişisel örnek, doğru araç bağlantısı, danışmana geçişin açıklığı. “En iyi saat 13:00” eski çıkarımı gerçek kanıt olarak kullanılmamalı; düşük hacimde saat testi önce önceliklendirilmemeli.

**Kitle:** Türkiye ana hedef kararı korunur. TR/DE çift dilli rakipler fırsat gösteriyor; GoldMood’un iki dili ve ilgili danışman kapasitesi doğrulanmadan Almanya reklam ölçeklemesi yapılmaz. 20–40 yaş mevcut strateji hedefidir; ölçülmüş demografi değildir.

**Hafıza temizliği:** 15 aktif inference kaydını toptan silmek yerine türlerine ayır: yaratıcı model puanı, gözlenen davranış, istatistiksel iddia. Model puanı ürün geri bildirimi olarak etiketlensin; gerçek performans iddiası için tarihli kaynak eklensin. Eski bağlantı hataları “8 Eylül’de yeniden doğrulandı: çalışıyor” kaydıyla güncellensin. Uygulama mevcut tenant kapsamıyla yapılmalı; rakip verisi GoldMood’un kendi metriklerine yazılmamalı.

## 10. Ölçüm ve reklam kararı

GA4 28 günlük rapor **bugünü içeriyor**; GSC dönemiyle birebir aynı değil. Görünen değerler: 15 aktif kullanıcı, 177 oturum, 2.952 sayfa görüntüleme ve 2 purchase işlemi. Gelir alanı yaklaşık 1.400,00 gösteriyor; rapor çıktısında para birimi teyidi olmadığı ve sipariş/Stripe mutabakatı yapılmadığı için bunu doğrulanmış ticari ciro olarak kullanmıyoruz.

32 oturum `checkout.stripe.com / referral` kaynağına yazılmış. Bu, ödeme dönüşünün kaynak atamasını etkileyebileceği için P0 ölçüm kontrolüdür; tüm satışın Stripe’tan kazanılmış yeni müşteri olduğu anlamına gelmez. 15 kullanıcı/177 oturum ve yüksek sayfa görüntüleme de test, ekip kullanımı ve ölçüm davranışı açısından incelenmeli; bot veya hata teşhisi konmadı.

İlk reklam önkoşulları: purchase transaction_id ile ücretli sipariş eşleştirmesi; test/iade ayrımı; Stripe yönlendirme ve UTM korunumu; reklam sayfasının doğru dilde ve doğru vaatle çalışması; gerçek hizmet kapasitesi. Bunlar tamamlanmadan rakip fiyatına göre indirim veya bütçe artırımı önerilmedi.

Doğrulama sonrası **taslak deney**: mevcut harita açıklamasıyla ilgili niyet aramalarını, mevcut danışmanlık açıklamasıyla seans niyetini ayrı değerlendir. Meta’da da mevcut haftalık Reel’den tek örnek seç; yeni üretim temposu açma. Karşılaştırma metriği yalnız tıklama değil, nitelikli profil geçişi ve doğrulanmış ödeme/tamamlanan hizmet olsun. Bütçe, müşteri edinme maliyeti sınırı ve ülke dağılımı marj/hizmet kapasitesi olmadan sayılandırılmadı. Rakip reklam kütüphanesi kanıtı yok; “reklam vermiyorlar” sonucu çıkarılmaz.

## 11. Öncelikli uygulama checklist’i

| ID | Öncelik | İş | Kabul ölçütü | Durum |
|---|---|---|---|---|
| G0 | P0 | Rakipleri kaynakla yeniden değerlendirme | 30 kayıt; 29 analiz + 1 yetersiz kanıt; eski kararlarla çelişki yok | Tamamlandı, panel kaydı |
| G1 | P0 | Bing sonuç ilgisi kontrolü | Sağlık/film/genel hesap sonucu astroloji rekabet sırasına girmiyor; motor kaynakları ayrı | Açık; rapor analizi bunları dışladı |
| G2 | P0 | GA4 işlem ve Stripe kaynak mutabakatı | İki purchase siparişle eşleşiyor; test/iade/para birimi açık; ödeme kaynak kayması kontrol edildi | Açık |
| G3 | P1 | Strateji/hafıza güncelleme | Büyük Üçlü doğru; invalid_grant güncel; model skorları gerçek KPI değil | Açık |
| G4 | P1 | İlk HTML locale tutarlılığı | TR/DE ilk HTML ve hydration aynı dilde; görünür içeriğe regresyon yok | Açık |
| G5 | P1 | App Store/Google Play CTA | Gerçek URL veya dürüst web alternatifi; `#` indirme çağrısı yok | Açık |
| G6 | P1 | Harita ve yükselen içerik örneği | Mevcut sayfada gerçek motor çıktısı, yöntem ve sonuç sınırı | Açık |
| G7 | P1 | Danışman ve fiyat kapsamı | Aktif profil, gerçek hizmet/süre/dil/fiyat ve dahil olmayanlar uyumlu | Açık |
| G8 | P1 | Üç öncelikli blog revizyonu | Mevcut slug korunuyor; özgün örnek ve çalışan sonraki adım | Açık |
| G9 | P2 | Kanıt eksiği Facebook profili | Giriş ekranı yerine izinli gerçek kaynak; başarısız veri başarı sayılmıyor | Açık |
| G10 | P2 | Sosyal örneklem kontrolleri | Tarih/eksik beğeni/medyan görünür; eski döneme güncel etiketi yok | Rapor tamam; ürün geneli kontrol açık |
| G11 | P2 | 28 tam günlük sonuç değerlendirmesi | Aynı dönem, aynı URL/dil; revizyon ve yayın tarihleri kayıtlı | Açık |

Önerilen sıra: ilk hafta G1–G5 ve ürün kapsamı; ikinci hafta G6–G8; sonra ölçüm ve kapasiteye göre reklam deneyi. İnceleme sırasında eski “haftalık cron açık”, “content source pasif”, “collector hiç çalışmıyor” maddelerinin tamamının operasyonel durumu doğrulanmadı. API’nin bugün çalışması cron’un tarihsel her gün çalıştığını kanıtlamaz; bu üç iddia ayrı canlı log/ayar denetimiyle kapanmalı.

## 12. Bu oturumda tamamlananlar

- İzlenen 30 rakip ve kaynakları, üç keşif koşusu ve mevcut strateji/hafıza okundu.
- Üç Instagram referansı güncel API ile yenilendi; eski takipçi/format iddiaları güncel diye taşınmadı.
- Tanitio’ya 30 kaynak inceleme kaydı yazıldı; 1’i açıkça yetersiz kanıt. Önceki kayıtların geri alma kopyası sunucuda özel geçici dosyada tutuldu.
- GSC/GA4/Meta bağlantıları yeniden doğrulandı; doğru ve eksik metrikler ayrıldı.
- Site içerikleri ve ana sayfanın gerçek tarayıcı davranışı kontrol edildi.
- Bu rapor ve tekrar incelenebilir kanıt/notebook GoldMood köküne yazıldı.

Panel doğrulaması: GoldMood tenantında rakip analiz sayfası açıldı; rapor API’si HTTP 200 verdi. Panelin genel “AI raporu var” rozeti kaynak yetersizliği kaydında da görünebilir; ilgili Facebook kaydının metni açıkça kanıt yetersizliğini bildiriyor. Rozetin bu ayrımı göstermesi ayrıca ürün iyileştirmesidir.

Web kodu, strateji/hafıza belgesi, reklam bütçesi ve sosyal yayın takvimi bu çalışmada değiştirilmedi. Sonraki uygulama yukarıdaki açık işler üzerinden yapılabilir.
