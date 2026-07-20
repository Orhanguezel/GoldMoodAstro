# EKSIK/BOZUK GORSELLER — URETILECEK

> **Tarih:** 2026-07-19 · Tespit: sosyal medya otomasyonu icin gorsel kaynagi taranirken cikti.
> **Etki:** `/tr/tarot` sayfasinda kartlar kirik/kesik goruntuleniyor; sosyal medya
> gonderilerinde kullanilabilecek saglam kart sayisi cok az.

## 1. Tarot destesi — `frontend` uzerinden `/uploads/tarot/{slug}.png`

79 varlik tarandi (`backend/src/db/sql/142_tarot_assets_seed.sql`), **hepsi 1:1 kare**.

| Durum | Adet | Aciklama |
|-------|-----:|----------|
| ✅ Gercek + duzgun kadraj | 19 | Kullanilabilir |
| ⚠️ Gercek ama **KESIK/KAYMIS** | 56 | Kart kadraja sigmamis; bir kismi kenardan kirpilmis |
| 🟣 **Placeholder** (mor/altin ic ice halkalar, kart cizimi yok) | 3+ | Gozle bakildiginda daha fazlasi placeholder olabilir |
| ❌ **Dosya YOK (404)** | 1 | `card-back` — kart acilmadan once gosterilen ARKA YUZ |

### ❌ Once bu: `card-back.png` sunucuda yok
```
https://goldmoodastro.com/uploads/tarot/card-back.png  →  404
```
Seed dosyasinda tanimli (`142_tarot_assets_seed.sql:6`, 1.031.901 byte) ama dosya sunucuda
yok. Tarot akisinda kart cevrilmeden once bu gosterildigi icin kullanici **kirik gorsel**
goruyor. En yuksek oncelik.

### ⚠️ Kesik/kaymis kartlar (56 adet)

Bunlar **kirpilarak duzeltilemez** — kaynak dosyada kartin kenari zaten yok, olmayan piksel
geri getirilemez. Yeniden uretilmeli. Otomatik kirpma denendi: `seven-of-swords` duzeldi ama
`seven-of-pentacles` kesik kalmaya devam etti.

- `ace-of-cups`
- `death`
- `eight-of-pentacles`
- `eight-of-swords`
- `eight-of-wands`
- `five-of-pentacles`
- `five-of-swords`
- `five-of-wands`
- `four-of-pentacles`
- `four-of-swords`
- `four-of-wands`
- `judgement`
- `justice`
- `king-of-cups`
- `king-of-pentacles`
- `king-of-swords`
- `knight-of-pentacles`
- `knight-of-swords`
- `nine-of-swords`
- `nine-of-wands`
- `page-of-pentacles`
- `page-of-swords`
- `queen-of-pentacles`
- `queen-of-swords`
- `seven-of-pentacles`
- `seven-of-swords`
- `seven-of-wands`
- `six-of-swords`
- `six-of-wands`
- `strength`
- `temperance`
- `ten-of-pentacles`
- `ten-of-swords`
- `ten-of-wands`
- `the-chariot`
- `the-devil`
- `the-emperor`
- `the-empress`
- `the-fool`
- `the-hanged-man`
- `the-hermit`
- `the-hierophant`
- `the-high-priestess`
- `the-lovers`
- `the-magician`
- `the-moon`
- `the-star`
- `the-sun`
- `the-tower`
- `the-world`
- `three-of-swords`
- `three-of-wands`
- `two-of-pentacles`
- `two-of-swords`
- `two-of-wands`
- `wheel-of-fortune`

### 🟣 Placeholder oldugu tespit edilenler
`ace-of-wands`, `king-of-wands`, `page-of-wands`

### ✅ Saglam olanlar (referans — yeni uretimde bu kadraj ornek alinmali)
`ace-of-pentacles`, `ace-of-swords`, `eight-of-cups`, `five-of-cups`, `four-of-cups`, `knight-of-cups`, `knight-of-wands`, `nine-of-cups`, `nine-of-pentacles`, `page-of-cups`, `queen-of-cups`, `queen-of-wands`, `seven-of-cups`, `six-of-cups`, `six-of-pentacles`, `ten-of-cups`, `three-of-cups`, `three-of-pentacles`, `two-of-cups`

## 2. Hedef spesifikasyon

- Olcu: **1024x1024** (mevcut saglamlar 512x512; zodyak gorselleri 1024x1024)
- Kart, kareyi **kenar boslugu birakarak** doldurmali; hicbir kenardan kirpilmamali
- Arka plan marka paletiyle uyumlu koyu mor/lacivert
- Kart adi gorselin icinde gomulu ise **Ingilizce** olmamali ya da hic olmamali
  (sosyal gorsellerde Turkce baslik uzerine biniyor — zodyak gorsellerinde bu sorun
  yasandi, %18 buyutup alt serit kadraj disina itilerek cozuldu)

## 3. Zodyak gorselleri — SORUN YOK

`/uploads/zodiac/{sign}.png` — 12 burc, 1024x1024, hepsi saglam. Sosyal medya gorselleri
bunlari kullaniyor (`frontend/src/app/[locale]/social-image/route.tsx`).

## 4. Bu tamamlanana kadar

Sosyal medya tarot gonderisi gozle dogrulanmis tek bir kart kullaniyor: **`queen-of-cups`**.
Deste duzelince `social-image` route'unda cesitlendirilebilir (gunun karti / uc kartlik acilim).
