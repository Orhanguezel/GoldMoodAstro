# GoldMoodAstro — İçerik Metodolojisi ve Rakip Analizi

**Hazırlanma tarihi:** 9 Ağustos 2026
**Kapsam:** Sosyal medya içeriğinin nereden türetildiği + rakip gözlemi + bundan çıkan kurallar
**Önceki raporlar:** Ağustos 2026 İçerik Planı (30 Tem 2026), Sosyal Medya Stratejisi (Fatma Güçlü)

---

## 1. Neden bu rapor

Ağustos içeriği üretilirken şu soru soruldu: *bu metinleri sitenin motorlarından mı alıyoruz,
yoksa elle mi yazıyoruz?*

Dürüst cevap: **elle yazılıyordu.** Günlük burç yorumları LLM üretimiydi ama ek içeriklerin
(yeniay, dolunay, kahve falı, tarot, rüya) metinleri üretim script'inin içine sabit metin
olarak gömülüydü. Denetleyince iki tür hata çıktı:

**a) Astrolojik olarak yanlış iddialar**

11 Ağustos postu *"Koç, Aslan ve Yay yükselenler görünürlük; Boğa, Başak ve Oğlak düzen
alanında"* diyordu. Burçlar **elemente göre** gruplanmıştı. Oysa bir yeniayın hangi yaşam
alanını etkilediği yükselene göre **hesaplanır**:

| Yükselen | Metinde yazan | Gerçek (Yeniay Aslan 15°) |
|---|---|---|
| Aslan | görünürlük | 1. ev — kimlik ve görünürlük ✅ |
| Koç | görünürlük | **5. ev — yaratıcılık, aşk, keyif** ❌ |
| Yay | görünürlük | **9. ev — ufuk, öğrenme, yolculuk** ❌ |
| Boğa | düzen | **4. ev — ev, aile, kökler** ❌ |
| Başak | düzen | **12. ev — içe dönüş, dinlenme** ❌ |
| Oğlak | düzen | **8. ev — derinleşme, ortak kaynaklar** ❌ |

Altıda biri doğruydu. 26 Ağustos postunda da aynı hata vardı. Her ikisi de yayına
çıkmadan düzeltildi.

**b) Metin ile görselin ayrışması**

- 25 Ağustos: metin "tekrar eden döngü / sonsuzluk" diyordu, görsel **yüzük**. Sitenin kendi
  sözlüğünde Yüzük = *"Evlilik, nişan, sözleşme, bağlılık"*. Okuyucu sembolü sitede aratsa
  bambaşka cevap alacaktı.
- 14 Ağustos: metin "kapı"dan söz ediyordu, görselde kapı yoktu (yol + anahtar vardı).
- 18 Ağustos: iki tarot kartı gösteriliyordu, metin kartların adını bile anmıyordu.

> **Temel sorun:** içerik "makul" görünüyordu ama **doğrulanabilir değildi**. Okuyucunun
> takip edebileceği bir mantık yoktu; bir astrolog incelese savunulamazdı.

---

## 2. Yeni kural: iddia motordan, üslup editörden

Sitenin zaten sahip olduğu veri katmanları içerik üretimine bağlandı:

| Katman | Kaynak | Hacim |
|---|---|---|
| Gezegen konumları, ay fazı, retro, açılar | Swiss Ephemeris (`computeNatalChart`) | Herhangi bir tarih |
| Rüya sembolleri | `dream_symbols` | 101 kayıt |
| Kahve falı sembolleri | `coffee_symbols` | 50 kayıt |
| Tarot kartları | `tarot_cards` (+ i18n) | 78 kart |
| Günlük burç yorumu | `daily_horoscopes` (LLM) | Günlük |

**İş bölümü net:**

- **Olgu** (hangi burç, hangi ev, sembol ne anlama geliyor) → motordan gelir, elle yazılmaz.
- **Üslup** (nasıl anlatılır, hangi soruyla açılır, CTA ne olur) → editöryel kalır.

### Nasıl uygulandı

**Astroloji:** `packages/shared-backend/modules/astrology/daySky.ts` eklendi. Ay fazını,
lunasyonun burcunu/derecesini, retroları ve en sıkı açıları döndürür. `houseMapByRising()`
ise olayın 12 yükselen için hangi eve düştüğünü hesaplar (whole-sign — doğum saati
gerektirmez, sosyal içerik için doğru araç).

Lunasyon günlerinin caption'ına artık şu blok **hesaplanarak** ekleniyor:

```
🌙 Yeniay • Aslan 15° (2026-08-12)

Yükselenine göre hangi alanın öne çıktığı:
• Aslan yükselen → 1. ev: kimlik ve görünürlük
• Yengeç yükselen → 2. ev: para ve öz değer
• Koç yükselen → 5. ev: yaratıcılık, aşk ve keyif
  … (12'sinin tamamı)
```

**Sembol/kart:** üretim spec'ine `symbols: { source, slugs }` eklendi. Verildiğinde **gövde
metni de görseller de aynı slug listesinden** türer. Metin ile görselin ayrışması artık
yapısal olarak imkânsız. Sözlükte olmayan slug veya eksik görsel → üretim durur (sessizce
jenerik metne düşmez).

Örnek — 25 Ağustos, sözlükten birebir:
> Dağ: zorluk, engel, sabır gerektiren durum. Köprü: zor bir dönemi atlatma, bağlantı kurma.

### Denetim aracı

`scripts/sky-report.ts` bir tarih aralığının efemeris raporunu verir (`--houses` ile ev
dağılımı). **Plan yazılmadan önce çalıştırılır** — metin olgudan türesin, tersi değil.

Ağustos 2026 planının gök tarihleri bu araçla doğrulandı, **dördü de doğru**:

| Plan diyor | Efemeris |
|---|---|
| 6 Ağu — Son dördün | ✅ Son dördün, Boğa 18° |
| 12 Ağu — Yeniay + Güneş tutulması | ✅ Yeniay, Aslan 15° |
| 20 Ağu — İlk dördün | ✅ İlk dördün, Yay 0° |
| 28 Ağu — Dolunay + Ay tutulması | ✅ Dolunay, Balık 7° |

---

## 3. Rakip analizi (8–9 Ağustos 2026)

Ekosistem sosyal medya modülünün rakip analizi ile üretildi.

**Gözlem tarihi:** 8 Ağustos 2026 (ilk analiz), 9 Ağustos'ta tekrar çalıştırıldı — aynı
public veri döndü.

### ⚠️ Yöntemin kapsamı — neyi ölçmedik

Bu analiz **public profil + LLM format çıkarımı**dır, post-seviyesi scrape değildir.

| Yakalanan | Yakalanmayan (veri YOK) |
|---|---|
| Takipçi ve gönderi sayısı | Yayın saatleri ve sıklığı |
| Bio dili ve ton | Post başına etkileşim oranları |
| Format prensipleri | Caption uzunlukları |
| Örnek post başlıkları / format tipleri | Hashtag deseni |

Sağdaki sütun için **elimizde veri yok** ve tahmin yazılmadı. Gerekirse post-seviyesi
scraper taraması ayrıca planlanmalı.

| Hesap | Takipçi | Gönderi | Kaynak |
|---|---|---|---|
| ms_astro | 184.000 | 1.073 | instagram.com/ms_astro |
| advicemycom | 4.427 | 760 | instagram.com/advicemycom |
| betilojiapp | 135 | 109 | instagram.com/betilojiapp |

### ms_astro (184K) — uygulama funnel'lı astroloji markası

Bio: gökyüzü merakı + ücretsiz indirme CTA. Akış: içerik → danışman profili → ücretsiz
analiz → üyelik.

**1. Burç listeleri — en güçlü format.** Gözlenen başlık tipleri: *"Burçların en sevdiği
şeyler"*, *"Burçların sinir uçları"*, *"En sadık burçlar sıralaması"*, *"En iyi dost
burçlar"*, *"Burçlar bir çiçek olsaydı"*.
Mekanizma: **insan kendini listede arıyor** → yorum ("tam ben" / "ben değilim") + etiketleme.
GoldMood uyarlaması: *"Yükselen burcuna göre bu hafta dikkat etmen gereken konu"*, *"Ay
burcuna göre duygusal refleksin"*, *"Venüs burcuna göre ilişki dilin"*.

**2. Part 1 / Part 2 carousel.** İlk içerik eksik bırakılır → ikinciye trafik, hesap içi
dolaşım. Uyarlama: 12 yükseleni ikiye böl ("Koç–Başak 1/2", "Terazi–Balık 2/2"), her
parçada diğerine yönlendir.

**3. Mizah + astroloji** ("sinir uçları", "vazgeçilmezi") → paylaşılabilirlik. Premium
çizgiyi bozmadan uyarlama: *"Bu burcun kırmızı çizgisi"*, *"Bu yükselenin sessiz alarmı"*.

**4. Funnel CTA'ları:** "Link bio'da", "Yükselenini öğren", "Danışmanını seç", "Ücretsiz
numeroloji dene".

### advicemycom (4.4K) — platform güveni benchmark'ı

Astroloji hesabı değil, geniş online **danışmanlık platformu**. Bizim için değeri:
"platform güveni + uzman havuzu + randevu" anlatısı.

1. **Güven dili:** "Alanında uzman danışmanları keşfet", "Randevunu seç", "güvenli ve
   kolay görüşme".
2. **Kategori genişliği:** 35+ kategori, 1.000+ danışman iddiası. GoldMood bu ölçeği
   iddia etmemeli ama çeşitliliği anlatmalı: astroloji / tarot / numeroloji / kahve falı /
   rüya / sinastri / vedik / doğum haritası.
3. **Danışman funnel'ı:** her danışman için ayrı içerik serisi + profil/randevu linki.
4. **Düşük bariyer:** ücretsiz numeroloji/burç/günlük yorum, ilk-soru kampanyası.
5. **Uzman içerikleri:** danışmandan haftalık mini yorum, "haftanın gökyüzü notu",
   "günün kartı", "haftanın sembolü".

### betilojiapp (135) — biçim ve ton dersi

Bio dili mistik, kısa, merak uyandırıcı ("cevap sende"). Ton: kişisel farkındalık +
astrolojik sezgi + sade çağrı.

- Tek ana duygu: *"Bugün neyi fark edeceksin?"*
- Başlık **3–6 kelime**; görselde **az metin** (başlık + 1 cümle + CTA)
- Uzun açıklama caption'da
- CTA'lar: "Kaydet", "Yükselenini oku", "Profildeki linkten danışman seç", "Yorumlara
  burcunu yaz"
- İçerik kolonları: günlük burç/yükselen, dolunay/yeniay, tarot, numeroloji, kahve falı,
  sinastri, danışman tanıtımı

### Konumlandırma farkı

**ms_astro = keşfet / viral / liste.** **advicemycom = güven / dönüşüm.**
GoldMood ikisini birlikte kullanmalı: büyüme için ms_astro tarzı merak formatları,
dönüşüm için advicemy tarzı platform ve danışmanlık anlatısı.

> **Kural:** birebir kopyalama yok. Format öğrenilir, içerik mor-altın premium mistik
> GoldMood dilinde özgün üretilir.

---

## 4. Rakip bulgularının bizim yöntemle kesişimi

En önemli bulgu, kurduğumuz yapıyı doğruluyor:

**ms_astro'nun en çok işe yarayan formatı "burç listesi" — bizim lunasyon caption'ımız tam
olarak bu.** Fark şu: onlarınki editöryel bir liste, bizimki **hesaplanmış** bir liste.
Okuyucu kendini listede buluyor (etkileşim mekanizması aynı) ama arkasında savunulabilir
bir yöntem var (güven mekanizması ek).

Bu, "premium mistik" konumlandırmayla da tutarlı: rakip eğlendiriyor, biz **eğlendirip
kanıtlıyoruz**.

---

## 5. Uygulanacak içerik kuralları

**Hemen uygulanan:**

1. Lunasyon günlerinde caption'a 12 yükselenin ev dağılımı (hesaplanmış) → *uygulandı*
2. Sembol/kart içeriklerinde metin ve görsel tek slug'dan → *uygulandı*
3. Carousel'in 2. slaytı 1.'yi tekrar etmez; ilerletir → *uygulandı, üretimde guard var*
4. Plan yazılmadan önce `sky-report.ts` çalıştırılır → *araç hazır*

**Sırada (öneri):**

5. **Burç listesi formatını çoğalt.** Şu an ayda 2 lunasyon gününde var. Haftalık bir
   "yükselenine göre bu hafta" listesi eklenebilir — motor zaten hesaplıyor.
6. **Görseldeki metni azalt.** Şu anki kartlarda 3–4 satır gövde var; betilojiapp örneği
   3–6 kelime başlık + tek cümle diyor. Uzun açıklama zaten caption'da.
7. **Part 1 / Part 2'yi ek içeriğe de taşı.** Günlük burçta var (12 burç ikiye bölünmüş),
   ek içerikte yok.
8. **Danışman serisi.** advicemycom her danışman için ayrı seri yapıyor; bizde tek
   danışman tanıtımı var (16 Ağustos). Danışman sayısı arttıkça seriye çevrilmeli.

---

## 6. Açık kalan / doğrulanmamış

### "Part 2 daha çok etkileşim alıyor" — ZAYIF SİNYAL, bulgu değil

Ekosistem ölçümü (goldmoodastro `content_catalog` insights):

| | n | Ortalama etkileşim |
|---|---|---|
| series_part 1 | 19 | 0,58 |
| series_part 2 | 19 | 0,89 |

Oran 1,53× (~%53). Tarih aralığı: 31 Tem – 9 Ağu 2026 (~10 gün).

⚠️ **Örneklem 19+19 yeterli görünse de mutlak etkileşim post başına 1'in altında**
(0,58 vs 0,89). Yüzde büyük duruyor ama sayılar minik — gürültüye sonuna kadar açık.
Karar: buna **eğilim** denir, **bulgu denmez**. Erişim büyüdükçe yeniden ölçülmeli.
Şu haliyle içerik stratejisinde tek başına dayanak yapılmamalı.

### Diğer açıklar

- **Post-seviyesi rakip metrikleri yok** (yayın saati, etkileşim oranı, caption uzunluğu,
  hashtag deseni). Mevcut analiz bunları ölçmüyor. Gerekirse scraper ile ayrı tarama.
- **Numeroloji motoru** (`calculateLifePath`) henüz içeriğe bağlanmadı. Aylık "yaşam yolu"
  içeriği hesaplanabilir; Eylül planında uygulanmalı.
- **Rüya sembolü günleri** (8, 9, 23 Ağustos) editöryel metinle kaldı — sözlükle çelişmiyor
  ama sözlükten türemiyor da. Yayınlanmış oldukları için dokunulmadı.

---

## 7. Eylül planı için kontrol listesi

1. `bun run scripts/sky-report.ts 2026-09-01 2026-09-30 --houses` → planın omurgası
2. Lunasyon günlerine `lunationDate` ver (caption'a ev dağılımı otomatik gelir)
3. Sembol/kart günlerine `symbols: { source, slugs }` ver (metin+görsel tek kaynak)
4. Her carousel'in 2. slaytına kendi içeriğini yaz (guard zaten zorunlu kılıyor)
5. Eylül için `AUGUST_2026_DAILY_PLAN` muadili gün tablosunu yaz — yoksa günlük burç
   kartları jenerik havuza düşer
6. Numeroloji içeriğini `calculateLifePath` ile hesapla
