# Expo Factory — Claude Code Skill

Otonom **Expo (React Native + TypeScript)** mobil uygulama fabrikasi. Tek cumlelik aciklamadan production-ready uygulamaya.

App Printer'dan (hrrcne/app-printer — iOS-only) adapte edilmistir. Orhan'in tarim + hayvancilik + nutuya ekosistemleri icin ozellestirilmistir.

## Ne Yapar

Kullanici "Hava durumu uygulamasi yap, don uyarisi ve 7 gunluk tahmin olsun" dedigi an:

1. Spec uretir
2. Mimari karar verir (Expo Router, Zustand, TanStack Query, Reanimated, vb.)
3. Expo projesini olusturur (veya var olan projeyi genisletir)
4. Her dosyayi tek tek yazar, her yazimdan sonra TypeScript type-check eder
5. Hatalari otomatik duzeltir (self-heal)
6. Test yazar, calistirir
7. Simulator'da ekran goruntusu alir, gorsel degerlendirir
8. EAS Build + store metadata + submission hazirlar

Sonuc: Onboarding + Paywall + Premium tasarim icerir komple Expo projesi. App Store + Play Store'a gonderilmeye hazir.

## Kurulum

### Secenek 1: Bu projeye ozel (local)
Bu dizindeki skill dogrudan **nutuya/tarimiklim/mobile** calismalari icin bir referans olarak kullanilir. Claude Code acikken "bu skill'i oku" veya "expo-factory stratejisini uygula" dersen yururlugun girer.

### Secenek 2: Global skill (tum Claude Code oturumlarinda kullan)

```bash
# Bu klasoru ~/.claude/skills/expo-factory/ olarak kopyala
cp -r /home/orhan/Documents/Projeler/nutuya/tarimiklim/mobile/skills/expo-factory ~/.claude/skills/

# Veya symlink (degisiklikleri otomatik yansitsin)
ln -s /home/orhan/Documents/Projeler/nutuya/tarimiklim/mobile/skills/expo-factory ~/.claude/skills/expo-factory
```

Sonra Claude Code icinde:
```
/expo-factory
```
Veya dogal dille:
```
"TarimIKlim mobil uygulamasina 14 gunluk tahmin ekle"
"Hayvancilik icin besi maliyet hesaplayici mobil uygulama yap"
"Bereket Fide mobil uygulamasi ozu"
```

## Dosya Yapisi

```
skills/expo-factory/
├── README.md              # Bu dosya
├── SKILL.md               # Ana pipeline skill (Claude Code okur)
└── references/
    ├── anti-ai-slop.md    # Gorsel kalite kurallari
    ├── theming.md         # Token bazli tema sistemi
    ├── monetization.md    # IAP + Iyzico hybrid
    ├── expo-router.md     # Navigasyon konvansiyonlari
    └── i18n.md            # Coklu dil
```

## Farkli Projelerde Yeniden Kullanim

### TarimIKlim (nutuya) — mevcut

Bu skill `nutuya/tarimiklim/mobile/` icin hazirlandi. Mevcut Expo projesinde devam et:
- Yeni ekran ekleme: skill'i takip et, her dosyadan sonra type-check
- Yeni feature: SPEC -> MIMARI -> KODLA stagelerini tekrarla

### Tarim Dijital Ekosistem

Tarim'da mobil uygulama gelecek icin: (sera-yonetim, hastalik-erken-uyari vb.)

```bash
# Tarim ekosisteminde yeni mobil proje
cd ~/Documents/Projeler/tarim-dijital-ekosistem/projects/<proje>
mkdir -p mobile
cd mobile
# Skill'i klonla
cp -r ~/Documents/Projeler/nutuya/tarimiklim/mobile/skills skills
# veya symlink
# Sonra Claude Code'a "expo-factory skill'ini kullan, yeni uygulama yap" de
```

### Hayvancilik Dijital Ekosistem

Hayvancilik icin mobile projeler planda:
- `hayvan-borsa-fiyatlari/mobile/` (Faz 3-4)
- `canli-hayvan-pazaryeri/mobile/` (Faz 5)
- `hayvancilik-ansiklopedisi/mobile/` (opsiyonel)

Ayni sekilde skill klonlanir veya symlink edilir.

### Onerilen Central Location

Ileride skill'i tek kaynaktan beslemek icin:

```bash
# Shared-ecosystem-packages repo'suna ekle
cd ~/Documents/Projeler/tarim-dijital-ekosistem/packages
mkdir -p mobile-skills
# skill'i oraya tasi (veya kopyala)
cp -r ~/Documents/Projeler/nutuya/tarimiklim/mobile/skills/expo-factory mobile-skills/
git add mobile-skills
git commit -m "feat: expo-factory mobil skill eklendi"
git push
```

Sonra:
- Hayvancilik symlink ile gorur (`packages/mobile-skills/expo-factory`)
- Nutuya submodule veya ayri clone ile gorur
- VPS'te deploy edilirken ayni mantik

Bu cozum **ikinci iterasyon**da uygulanir, simdi nutuya'da dene.

## Skill'i Claude Code'un Anlamasini Saglamak

`SKILL.md` dosyasinin en ustundeki YAML frontmatter Claude Code'un skill'i tanimasini saglar:

```yaml
---
name: expo-factory
user-invocable: true
description: "Otonom Expo/React Native uygulama fabrikasi..."
---
```

- `name: expo-factory` -> `/expo-factory` slash komutu
- `user-invocable: true` -> kullanici acikca cagirabilir
- `description` -> Claude ne zaman kullanacagini bilir

Global kuruluma gectigin anda (`~/.claude/skills/expo-factory/`) `/expo-factory` otomatik aktif olur.

## Nasil Gelistirilir

Bu skill canli bir dokumandir. Kullandigin her proje sonrasinda geri besleme saglar:

1. **Yeni learning ortaya ciktiysa** — `SKILL.md`'nin "Ogrenimler" bolumune ekle
2. **Bir referans gerekli goruluyorsa** — `references/` altina yeni .md ekle ve SKILL.md'de link ver
3. **Yeni stack/kutuphane** — `Mimari` bolumune ekle
4. **Anti-slop ornek cogalt** — `references/anti-ai-slop.md`

## Lisans

Orjinal App Printer: Hurricane (github.com/hrrcne/app-printer)
Bu adapte edilmis surum: Orhan Guzel (tarim + hayvancilik ekosistem ozel)
