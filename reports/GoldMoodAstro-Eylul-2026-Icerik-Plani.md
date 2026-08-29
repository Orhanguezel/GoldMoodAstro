# GoldMoodAstro — Eylül 2026 Sosyal İçerik Planı

Üretim tarihi: 2026-08-29

Kapsam: 1–30 Eylül, her gün 1 ana carousel + 1 Instagram story

Ana hedef: marka dışı keşfi desteklemek ve kullanıcıyı yeni SEO konu kümelerine taşımak

## Kaynak ve güvenlik

- Gökyüzü omurgası `bun run scripts/sky-report.ts 2026-09-01 2026-09-30 --houses`
  çıktısından ve üretim anında `getDaySky()` / `houseMapByRising()` çağrılarından gelir.
- 11 Eylül yeniayı Başak 22°, 26 Eylül dolunayı Balık 29° olarak motor tarafından
  hesaplandı. İki lunasyonun 12 yükselen için ev dağılımı caption'a otomatik eklenir.
- Rüya ve kahve sembolü metinleri `dream_symbols` / `coffee_symbols` tablolarından
  okunur; sözlük kaydı veya görsel yoksa üretim durur.
- Numeroloji örneği `calculateLifePath()` ile hesaplanır.
- Her caption kanonik `findRiskyTopics()` listesiyle taranır; fail veya warn eşleşmesinde
  üretim durur. Kesin sonuç, korku, sağlık, finans ve benzeri yasak iddialar kullanılmaz.
- Astrolojik iddia içeren kayıtlar `lunationDate` veya `skyDate` olmadan üretilemez.

## Takvim

| Gün | Ana içerik | Kaynak / hedef |
|---:|---|---|
| 1 | Eylül için tek niyet | Blog kümesi |
| 2 | Yükselen burç nedir? | Yükselen hesaplayıcı |
| 3 | Rüyada kapı | Rüya sözlüğü |
| 4 | İkizler son dördün | `getDaySky(2026-09-04)` |
| 5 | 78 burç uyumu | Uyum hub |
| 6 | Doğum haritası için 3 bilgi | Doğum haritası |
| 7 | Fincanda yol ve anahtar | Kahve sözlüğü |
| 8 | Sinastri ne değildir? | Sinastri aracı |
| 9 | Yaşam yolu hesabı | Numeroloji motoru |
| 10 | Yeniay hazırlığı | Günlük gökyüzü |
| 11 | Başak yeniayı, 12 ev | `getDaySky` + `houseMapByRising` |
| 12 | Burç uyumu nasıl okunur? | Uyum hub |
| 13 | Doğum saati bilinmiyorsa | Yükselen hesaplayıcı |
| 14 | Rüyada deniz | Rüya sözlüğü |
| 15 | Tarot sorusu nasıl kurulur? | Tarot rehberi |
| 16 | Burç detayları ve 12 kombinasyon | Burç hub |
| 17 | İlk dördün hazırlığı | Blog kümesi |
| 18 | Yay ilk dördün | `getDaySky(2026-09-18)` |
| 19 | Retro ne demek? | `getDaySky(2026-09-19)` |
| 20 | Uyumdan önce iki profil | Uyum hub |
| 21 | Fincanda kuş | Kahve sözlüğü |
| 22 | Terazi geçişi hazırlığı | `getDaySky(2026-09-23)` |
| 23 | Güneş Terazi'de | `getDaySky(2026-09-23)` |
| 24 | Dolunay hazırlığı | Günlük gökyüzü |
| 25 | İki tarot kartını birlikte okumak | Tarot rehberi |
| 26 | Balık dolunayı, 12 ev | `getDaySky` + `houseMapByRising` |
| 27 | Dolunay sonrası not | Blog kümesi |
| 28 | Rüyada ev | Rüya sözlüğü |
| 29 | Güneş, Ay ve yükselen | Üç büyük hesaplayıcı |
| 30 | Eylül kapanış değerlendirmesi | Blog kümesi |

## Yayın ritmi

- Ana carousel: her gün 10:00 UTC (Türkiye 13:00).
- Story: her gün 16:00 UTC (Türkiye 19:00).
- Her ana içerik iki farklı bilgi slaytı taşır; ikinci slayt ilk metni tekrarlamaz.
- CTA'lar genel ana sayfa yerine ilgili canlı kümeye gider: uyum hub, yükselen
  hesaplayıcı, doğum haritası, sinastri, numeroloji, rüya/kahve/tarot rehberleri.

## Üretim ve kabul

- Script: `scripts/prepare-september-2026-social-drafts.ts`
- Manifest: `references/monthly-content/2026-09/09-01-30-drafts.json`
- Medya dizini: `backend/uploads/social/september-2026-v1/`
- Beklenen: 60 kayıt, 90 PNG; 60 adet 1080×1350 ve 30 adet 1080×1920.
- Temsilî dokuz farklı gün yan yana gözle kontrol edildi. Dönem etiketi EYLÜL 2026,
  gömülü yabancı başlık yok, metin kesilmiyor, CTA görünür.
- Veritabanı yazımı idempotenttir ve aynı ayda farklı kaynaktan kayıt görürse durur.
