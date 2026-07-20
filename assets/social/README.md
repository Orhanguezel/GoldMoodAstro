# Sosyal medya görsel varlıkları

Üretim tarihi: 2026-07-18 · Marka paleti: koyu mor gradyan (#160D2A → #4E2A8A) + altın (#E8C674)

## `highlights/` — Instagram öne çıkan hikâye kapakları

1080×1920 (hikâye ölçüsü). Instagram bu görseli **merkezden dairesel kırpar**, bu yüzden
sembol ve etiket merkeze hizalı; kenarlarda önemli bir şey yok.

| Dosya | Sembol | Etiket |
|-------|--------|--------|
| `burclar.png` | ♒ | BURÇLAR |
| `tarot.png` | ✦ | TAROT |
| `numeroloji.png` | № | NUMEROLOJİ |
| `uyum.png` | ♡ | UYUM |
| `danismanlar.png` | ☾ | DANIŞMANLAR |
| `yorumlar.png` | ★ | YORUMLAR |

**Nasıl kullanılır:** Instagram uygulaması → profil → Öne Çıkanlar → `+` → hikâye seç →
`Kapağı Düzenle` → bu görseli galeriden yükle. **Öne çıkan oluşturmak için önce en az bir
hikâye paylaşılmış olmalı** — hesap şu an boş (`media_count=0`), o yüzden ilk içerikler
yayınlandıktan sonra yapılır.

## Fontlar hakkında — dikkat

Görseller `frontend/public/fonts/*-static.ttf` ile üretiliyor (variable font DEĞİL, bkz.
`frontend/src/lib/fonts/og-fonts.ts` başındaki uyarı).

⚠️ **Cinzel ve Fraunces'te zodyak glifleri ve emoji YOK.** İlk denemede ♈-♓ ve 🔮 tofu
kutusu (▯) olarak çıktı. Sembol gerektiren yerlerde **DejaVuSans** kullanılıyor ve her sembol
öncesinde varlığı doğrulanıyor:

```bash
python3 -c "from fontTools.ttLib import TTFont; \
  print(ord('♒') in TTFont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf').getBestCmap())"
```

Emoji (🔮 💞 🔢) DejaVu'da **yok** — renkli emoji fontu gerekir. Bunun yerine tipografik
karşılıkları seçildi (✦ ♡ №).

## Facebook kapağı

1640×624 üretilip API ile atandı. Tasarım kısıtı: **masaüstünde profil fotoğrafı kapağın
sol-alt köşesini örter**; bu yüzden logo kapağa konmadı (profil fotoğrafında zaten var,
üstelik örtülen bölgeye denk geliyordu) ve metin yatayda ortalandı — mobil kenarlardan
kırptığı için merkez tek güvenli alan.
