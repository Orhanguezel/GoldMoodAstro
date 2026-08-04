# CODEX GÖREV — Sosyal Medya & Site Görselleri Üretimi

> **Hazırlayan:** Claude Code · **Tarih:** 2026-07-19
> **Bağlam:** `../ekosistem-sosyal-medya/docs/GOLDMOOD-VIRAL-ICERIK-GENISLETME-2026-07-19.md`
> **Neden:** Sosyal medya otomasyonu kahve falı gönderisine yengeç burcu resmi koyuyordu —
> çünkü bu konular için görsel yok. İçerik havuzu derin (78 tarot + 101 rüya + 50 kahve
> sembolü), tek eksik görsel.

---

## 0. Bu görev neden dikkat ister

Görseller **canlı sitede ve müşterinin sosyal medya hesabında** yayınlanacak. Daha önce
şu hatalar yaşandı, tekrarlanmasın:

1. **Görselin içine yazı gömüldü.** Mevcut zodyak görsellerinde alt bantta "AQUARIUS /
   THE WATER BEARER" yazıyor. Sosyal medya şablonu üstüne Türkçe başlık basınca **iki yazı
   üst üste bindi**; görseli %18 büyütüp o bandı kadraj dışına iterek çözüldü. Yeni
   görsellerde **hiç yazı olmayacak.**
2. **Kart kadraja sığmadı.** Tarot görsellerinin 56'sı kesik/kaymış (`EKSIK-GORSELLER.md`).
   Kırpmayla kurtarılamıyor çünkü kaynakta piksel yok. Özne **kenar boşluğu bırakarak**
   ortalanmalı.
3. **Placeholder görseller gerçek sanılıp yayınlandı.** Birkaç tarot dosyası mor/altın iç içe
   halkalardan ibaret. Üretim sonrası **gözle bakılmadan** tamam denmeyecek.

---

## 1. Görsel stili — mevcut zodyak setinden çıkarıldı

Referans: `backend/uploads/zodiac/*.png` (12 adet, 1024×1024, hepsi sağlam).
Yeni görseller **bu setle yan yana konduğunda aynı aileden görünmeli.**

| Öğe | Tanım |
|-----|-------|
| Özne | Cilalı **altın/pirinç metalik**, 3B render, heykelsi, yüksek detay, sıcak highlight'lar |
| Arka plan | Derin kozmik nebula — mor/menekşe, koyu lacivert, magenta vurgular |
| Detaylar | Dağınık yıldızlar, küçük sarmal galaksiler, soluk takımyıldız çizgileri |
| Kompozisyon | Özne **ortada**, hafif glow ile yüzer gibi, kenarlarda boşluk |
| Kontrast | Sıcak altın × soğuk mor — yüksek kontrast, premium his |
| Ton | Mistik, zarif, ciddi. Karikatürize/çizgi film DEĞİL. Korkutucu DEĞİL. |
| **Yazı** | **YOK.** Harf, rakam, isim plakası, filigran — hiçbiri. |

**Palet:** koyu mor `#160D2A` → `#4E2A8A`, altın `#E8C674`, vurgu magenta/menekşe.

**Ortak prompt eki (her üretimde sonuna eklenecek):**

```
Style: polished golden-brass 3D sculptural rendering, deep cosmic purple and violet nebula
background, scattered stars, small spiral galaxies, faint constellation lines, warm gold
highlights against cool purple, high contrast, mystical and elegant, premium quality,
centered composition with generous margin, square 1:1.
ABSOLUTELY NO TEXT, no letters, no numbers, no captions, no watermark, no signature.
```

---

## 2. Teknik gereksinimler

| | |
|---|---|
| Ölçü | **1024×1024** PNG |
| Konum | `backend/uploads/topics/` ve `backend/uploads/symbols/{coffee,dream}/` |
| Ad | **DB slug'ı ile birebir** — `bird.png`, `water.png`. Slug uydurma, aşağıdaki listeyi kullan |
| Üretim | `OPENAI_API_KEY` `backend/.env` içinde mevcut (satır 79) |
| Script | `backend/scripts/generate-topic-images.ts` — idempotent: dosya varsa **atla**, `--force` ile ez |

Script şunları desteklemeli: `--only <slug>`, `--set topics|coffee|dream|numerology`,
`--force`, `--dry` (ne üretileceğini yazar, API çağırmaz).

---

## 3. FAZ A — 5 hero görsel (ÖNCELİK, bunlar olmadan gönderiler doğru görselle çıkamaz)

`backend/uploads/topics/{ad}.png`

| Dosya | Konu | Prompt çekirdeği (ortak stil eki ile birleştir) |
|-------|------|--------------------------------------------------|
| `kahve-fali.png` | Kahve falı | An ornate golden Turkish coffee cup and saucer, swirling coffee grounds forming mystical patterns rising as smoke |
| `ruya-tabiri.png` | Rüya tabiri | A serene sleeping figure sculpted in gold, surrounded by floating dream imagery, crescent moon and starry clouds, surreal |
| `numeroloji.png` | Numeroloji | Golden sacred geometry — interlocking circles and polygons forming a mystical numerological diagram (NO digits) |
| `sinastri.png` | Sinastri | Two interlocking golden astrological birth-chart wheels overlapping, connected by delicate light threads |
| `yildizname.png` | Yıldızname | An ancient golden manuscript scroll unrolled, star maps and celestial diagrams engraved on it |

⚠️ `numeroloji.png` için **rakam çizdirme** — model rakam yazmaya çok meyilli. Prompt'ta
açıkça yasakla, çıktıyı kontrol et.

## 4. FAZ B1 — Numeroloji 1-9

`backend/uploads/symbols/numerology/{1..9}.png` — her sayı için farklı kutsal geometri
kompozisyonu (üçgen, kare, beşgen…). **Rakamın kendisi çizilmeyecek**, kompozisyon o sayıdaki
öğeden oluşacak (örn. 5 → beş kollu yıldız/beş öğe).

## 5. FAZ B2 — Kahve falı sembolleri (50)

`backend/uploads/symbols/coffee/{slug}.png` — özne, sembolün kendisi (altın heykel formunda).

| slug | Ad | Anlam (prompt'a bağlam olarak ver) |
|------|-----|------------------------------------|
| `bird` | Kuş | Haber, müjde, sevinçli bir gelişme. |
| `road` | Yol | Yolculuk, yeni bir başlangıç, uzun bir süreç. |
| `heart` | Kalp | Aşk, sevgi, duygusal bağlılık. |
| `ring` | Yüzük | Evlilik, nişan, sözleşme, bağlılık. |
| `moon` | Ay | Huzur, duygusal derinlik, gizli sırlar. |
| `sun` | Güneş | Başarı, aydınlanma, her şeyin yoluna girmesi. |
| `mountain` | Dağ | Zorluk, engel, sabır gerektiren durum. |
| `fish` | Balık | Kısmet, rızık, maddi bolluk. |
| `snake` | Yılan | Düşman, haset, gizli tehlike. |
| `eye` | Göz | Nazar, izlenme, birinin dikkati üzerinizde. |
| `key` | Anahtar | Çözüm, yeni bir kapı açılması, mülk edinme. |
| `tree` | Ağaç | Aile, köklü değişim, sağlık, uzun ömür. |
| `horse` | At | Murat, asalet, hızlı gerçekleşecek istek. |
| `camel` | Deve | Zenginlik, yük taşıma, büyük kısmet. |
| `butterfly` | Kelebek | Kısa süreli sevinç, değişim, flört. |
| `ship` | Gemi | Uzaklardan gelecek kısmet, deniz aşırı yolculu |
| `anchor` | Çapa | Güven, yerleşik düzen, sağlam temel. |
| `bell` | Çan | Önemli bir haber, duyuru, dikkat çekme. |
| `bridge` | Köprü | Zor bir dönemi atlatma, bağlantı kurma. |
| `candle` | Mum | Dileklerin kabulü, aydınlanma, umut. |
| `cross` | Haç | Fedakarlık, inanç, zor bir sınav. |
| `cup` | Kupa | Kutlama, başarı, sosyal başarı. |
| `dog` | Köpek | Sadık dost, koruma, güven. |
| `cat` | Kedi | Nankörlük, kurnazlık, sezgi. |
| `eagle` | Kartal | Güç, zafer, yüksek hedefler. |
| `elephant` | Fil | Şans, güç, bilge bir kişi. |
| `flower` | Çiçek | Mutluluk, hediye, nezaket. |
| `gate` | Kapı | Fırsat, yeni bir hayat, geçiş. |
| `hammer` | Çekiç | Çalışma, inşa etme, zor bir işin üstesinden ge |
| `hand` | El | Yardım, destek, birinden gelecek el. |
| `ladder` | Merdiven | Yükseliş, terfi, gelişim. |
| `lamp` | Lamba | Fikir, çözüm, karanlığın bitişi. |
| `leaf` | Yaprak | Şans, yenilenme, mevsimsel değişim. |
| `lion` | Aslan | Cesaret, liderlik, prestij. |
| `mouse` | Fare | Küçük kayıp, hırsızlık, kemiren düşünceler. |
| `owl` | Baykuş | Bilgelik, gece haberi, gizem. |
| `peacock` | Tavuskuşu | Gösteriş, gurur, miras. |
| `rabbit` | Tavşan | Hız, korku, bereket. |
| `scissors` | Makas | Ayrılık, keskin karar, tartışma. |
| `star` | Yıldız | Şöhret, ilham, büyük şans. |
| `swan` | Kuğu | Zarafet, sadık eş, huzur. |
| `sword` | Kılıç | Mücadele, keskin zeka, zafer. |
| `umbrella` | Şemsiye | Korunma, sığınma, geçici kalkan. |
| `vase` | Vazo | Mülk, birikim, estetik değer. |
| `wall` | Duvar | Engel, iletişim kopukluğu, sınır. |
| `window` | Pencere | Bakış açısı, merak, dış dünyadan haber. |
| `wing` | Kanat | Özgürlük, koruyucu melek, manevi destek. |
| `wolf` | Kurt | Bağımsızlık, sadakat, strateji. |
| `box` | Kutu | Sürpriz, gizli bir sır, hediye. |
| `crown` | Taç | Onur, rütbe, itibar kazanma. |

## 6. FAZ B3 — Rüya sembolleri (101)

`backend/uploads/symbols/dream/{slug}.png`

| slug | Ad | Anlam |
|------|-----|-------|
| `water` | Su | Duygusal durum, saflık, yenilenme veya belirsi |
| `snake` | Yılan | Düşman, haset, şifa veya dönüşüm. |
| `flying` | Uçmak | Özgürlük, kontrol kaybı veya yüksek hedefler. |
| `falling` | Düşmek | Kontrol kaybı, güvensizlik, başarısızlık korku |
| `teeth_falling` | Diş Dökülmesi | Güç kaybı, yaşlanma korkusu veya sözlerin ağır |
| `fire` | Ateş | Tutku, öfke, yıkım veya arınma. |
| `death` | Ölüm | Bir dönemin bitişi, yeni başlangıçlar, değişim |
| `baby` | Bebek | Yeni fikirler, masumiyet, korunmaya muhtaç dur |
| `money` | Para | Özdeğer, güç, fırsatlar veya maddi kaygı. |
| `dog` | Köpek | Sadakat, koruma, arkadaşlık veya içgüdüler. |
| `cat` | Kedi | Bağımsızlık, sezgi, nankörlük veya gizem. |
| `house` | Ev | Benlik, zihin, aile veya güvenlik. |
| `mountain` | Dağ | Büyük hedefler, zorluklar, başarı veya engel. |
| `sea` | Deniz | Bilinçaltı, sonsuzluk, huzur veya fırtına. |
| `rain` | Yağmur | Arınma, hüzün, bereket veya duygusal boşalım. |
| `sun` | Güneş | Aydınlanma, enerji, yaşam gücü, başarı. |
| `moon` | Ay | Dişil enerji, döngüler, gizli sırlar, sezgiler |
| `stars` | Yıldızlar | Umut, rehberlik, kader, ilham. |
| `bridge` | Köprü | Geçiş dönemi, bağlantı, karar anı. |
| `road` | Yol | Yaşam yolu, yön seçimi, süreç. |
| `door` | Kapı | Yeni fırsatlar, sırlar, engeller veya geçiş. |
| `key` | Anahtar | Çözüm, yetki, gizli bilgi, mülk. |
| `forest` | Orman | Bilinçaltının derinlikleri, kafa karışıklığı v |
| `flower` | Çiçek | Güzellik, gelişim, kısa süreli mutluluk. |
| `tree` | Ağaç | Soy, büyüme, sağlamlık, uzun ömür. |
| `bird` | Kuş | Maneviyat, özgürlük, haber, ruh. |
| `lion` | Aslan | Cesaret, liderlik, saldırganlık veya güç. |
| `wolf` | Kurt | Yalnızlık, sadakat, vahşi doğa, strateji. |
| `horse` | At | Enerji, dürtüler, zafer, asalet. |
| `spider` | Örümcek | Manipülasyon, yaratıcılık, tuzak veya sabır. |
| `bee` | Arı | Çalışkanlık, topluluk, tatlı sonuçlar. |
| `butterfly` | Kelebek | Dönüşüm, kırılganlık, ruhsal gelişim. |
| `fish` | Balık | Bereket, bilinçaltı mesajları, kısmet. |
| `car` | Araba | Yaşamın kontrolü, motivasyon, sosyal statü. |
| `plane` | Uçak | Hızlı değişim, yüksekten bakış, kaçış. |
| `train` | Tren | Kader yolu, toplumsal akış, kaçırılan fırsatla |
| `ship` | Gemi | Duygusal yolculuk, uzaklar, ticari işler. |
| `wedding` | Düğün | Birlik, taahhüt, yeni bir evre veya kaygı. |
| `ring` | Yüzük | Sonsuzluk, bağlılık, söz verme. |
| `mirror` | Ayna | Öz-yüzleşme, gerçekler, narsizm. |
| `clock` | Saat | Zaman baskısı, ömür, geç kalma korkusu. |
| `ladder` | Merdiven | Yükseliş, çaba, sosyal basamaklar. |
| `wall` | Duvar | Sınırlar, koruma, engellenmiş hissetme. |
| `window` | Pencere | Dış dünyaya bakış, umut, fırsat kollama. |
| `knife` | Bıçak | Keskin kararlar, saldırganlık, ayrılık. |
| `blood` | Kan | Yaşam gücü, acı, fedakarlık, soy. |
| `gold` | Altın | Değerli olan, manevi zenginlik, başarı. |
| `bread` | Ekmek | Temel ihtiyaçlar, rızık, paylaşım. |
| `shoes` | Ayakkabı | Yolculuk hazırlığı, duruş, hazırlık. |
| `hat` | Şapka | Düşünceler, gizleme, statü. |
| `nakedness` | Çıplaklık | Savunmasızlık, utanç veya gerçek benlik. |
| `chase` | Kovalanmak | Kaçılan gerçekler, stres, tehdit altındaki his |
| `test` | Sınava Girmek | Yetersizlik korkusu, hazırlıksız hissetme. |
| `being_lost` | Kaybolmak | Yön kaybı, kafa karışıklığı, belirsizlik. |
| `pregnant` | Hamilelik | Potansiyel, yeni bir projenin doğuşu, büyüme. |
| `tears` | Gözyaşı | Duygusal boşalım, şifa, hüzün. |
| `smile` | Gülümsemek | Huzur, kabul, olumlu süreç. |
| `crowd` | Kalabalık | Toplum baskısı, yalnızlık korkusu, kargaşa. |
| `tunnel` | Tünel | Zor bir geçiş, daralma, tünelin sonundaki ışık |
| `elevator` | Asansör | Hızlı iniş çıkışlar, kontrolsüz değişim. |
| `crying` | Ağlamak | İçsel rahatlama, dertlerin bitişi. |
| `storm` | Fırtına | Kaos, öfke, büyük değişim dalgası. |
| `snow` | Kar | Saflık, duygusal soğukluk, örtülen sırlar. |
| `ice` | Buz | Donmuş duygular, durağanlık, risk. |
| `desert` | Çöl | Yalnızlık, kuraklık, manevi susuzluk. |
| `island` | Ada | Tecrit, huzur, kendine yetme. |
| `bridge_collapsing` | Köprü Yıkılması | Kesilen bağlantılar, tehlikeli geçiş. |
| `falling_stars` | Yıldız Kayması | Dileklerin kabulü, büyük değişim, mucize. |
| `earthquake` | Deprem | Temellerin sarsılması, ani değişim, şok. |
| `flood` | Sel | Kontrol edilemeyen duygular, her şeyi silip sü |
| `rainbow` | Gökkuşağı | Fırtına sonrası huzur, barış, umut. |
| `black_color` | Siyah | Bilinmezlik, yas, güç veya gizem. |
| `white_color` | Beyaz | Saflık, başlangıç, netlik. |
| `red_color` | Kırmızı | Tutku, öfke, enerji veya tehlike. |
| `green_color` | Yeşil | Şifa, büyüme, kıskançlık veya denge. |
| `blue_color` | Mavi | Huzur, iletişim, ruhsallık. |
| `yellow_color` | Sarı | Zeka, hastalık, dikkat veya neşe. |
| `old_person` | Yaşlı Kişi | Bilgelik, geçmiş, deneyim. |
| `priest_imam` | Din Görevlisi | Manevi rehberlik, vicdan, toplumsal kurallar. |
| `teacher` | Öğretmen | Öğrenilmesi gereken ders, otorite, rehber. |
| `king_queen` | Kral/Kraliçe | Otorite, başarı, ego veya sorumluluk. |
| `thief` | Hırsız | Enerji emen durum, kayıp korkusu, gizli düşman |
| `prison` | Hapishane | Sıkışmışlık, suçluluk, kısıtlama. |
| `hospital` | Hastane | Şifa ihtiyacı, bakım, zayıflık. |
| `school` | Okul | Hayat dersleri, sosyal kaygılar, gelişim. |
| `war` | Savaş | İçsel çatışma, kaos, büyük mücadele. |
| `flying_carpet` | Uçan Halı | Manevi yükseliş, hayal gücü, kolaylık. |
| `giant` | Dev | Büyük sorunlar veya ezici güç. |
| `dwarf` | Cüce | Küçümsenmiş hisler, detaylar, kurnazlık. |
| `ghost` | Hayalet | Geçmişin izleri, bitmemiş işler, korkular. |
| `angel` | Melek | Korunma, ilahi mesaj, yüksek bilinç. |
| `devil` | Şeytan | Nefis, gölge yanlar, ayartılma. |
| `snake_biting` | Yılan Isırması | Beklenmedik darbe, ihanet, ani uyanış. |
| `running_away` | Kaçmak | Sorumluluktan kaçış, korkuyla yüzleşememe. |
| `singing` | Şarkı Söylemek | Kendini ifade, neşe, uyum. |
| `dancing` | Dans Etmek | Yaşam enerjisi, kutlama, akışta olma. |
| `fighting` | Kavga Etmek | Öfke birikimi, zıt fikirler, savunma. |
| `killing` | Öldürmek | Bir huyu veya alışkanlığı bitirme, öfke. |
| `saving_someone` | Birini Kurtarmak | Yardımseverlik, sorumluluk, öz-kahramanlık. |
| `laughing` | Gülmek | Hafifleme, sorunların çözümü. |
| `climbing` | Tırmanmak | Zahmetli başarı, gelişim çabası. |

---

## 7. Teslim kriteri — bunlar yapılmadan "bitti" deme

1. `python3 -c "from PIL import Image; im=Image.open(P); print(im.size)"` → **(1024, 1024)**
2. **Yazı kontrolü:** her görsele gözle bak. Harf/rakam varsa **yeniden üret**.
3. **Kadraj kontrolü:** özne kenardan kesilmiş mi? Kesikse yeniden üret.
4. **Aile kontrolü:** rastgele 5 yeni görseli `backend/uploads/zodiac/leo.png` ile yan yana
   koy. Aynı setten görünmüyorsa stil prompt'unu düzelt.
5. Faz A biter bitmez **haber ver** — sosyal medya motoru (Claude Code tarafı) onu bekliyor,
   B fazları sürerken devreye alınabilir.
6. **Duygusal ton / ilk bakış kontrolü:** sembol yalnızca nesne olarak doğru olmakla
   kalmamalı, tablodaki anlamı ilk bakışta doğru tonda iletmeli. Örneğin aşk/sevgi için
   anatomik veya karanlık kalp değil klasik romantik kalp formu; tehlike sembollerinde
   (göz, yılan vb.) anlam korunurken korku/gerilim tonu abartılmamalı.

## 8. Kapsam dışı

- Tarot kartlarının yeniden üretimi — **kullanıcı kendisi yapıyor** (`EKSIK-GORSELLER.md`).
- `card-back.png` eksik (404) ama onu da kullanıcı üretiyor.
- Görsellerin DB'ye kaydı gerekmez; dosya yolu slug'dan türetiliyor.
