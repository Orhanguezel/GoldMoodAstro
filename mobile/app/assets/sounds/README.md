# Sounds

Ses dosyalari bu klasore koyulur.

## Beklenen dosyalar

- `frost-alert.mp3` — Don uyari bildirim sesi (3-5 saniye, MP3, 44.1kHz, max 500KB)
  - iOS: Ayni zamanda `frost-alert.caf` formatinda da olmali (APNS icin). Bu cevrim Xcode'da veya `afconvert` komutuyla yapilir.
  - Android: MP3 yeterli. Bildirim channel'i `don-uyari` kullanir.

## Placeholder

Baslangicta sessiz veya kisa bir test sesi koyulabilir. Uretim oncesi gercek telif haksiz ses dosyasi eklenmelidir.

Onerilen kaynaklar:
- freesound.org (CC lisansli ses effect'leri)
- zapsplat.com (ucretsiz account ile)
- Kendi uretilen — GarageBand/Audacity

## Ses secimi kriterleri

- **Dikkat cekici ama panik yaratmayan** — 3 saniye, yukselir-alcalir
- **Temiz** — backgroundda gurultu olmasin
- **Karakter sahibi** — generic "ding" yerine don/sogukla cagristiran (bell, glass tinkle, chime)
- **Telefona yakismali** — hem iOS hem Android default notification sounds'un uzerine konumlanabilecek
