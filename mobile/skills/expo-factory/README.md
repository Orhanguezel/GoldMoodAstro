# GoldMoodAstro Expo Premium Skill

Bu skill, GoldMoodAstro mobile uygulamasını premium seviyeye taşımak için yazılmış Expo/React Native talimat paketidir.

App Printer'dan alınan fikir: uygulama üretirken kalite çıtasını baştan koymak.  
Bu repodaki uygulama: **SwiftUI değil, Expo + React Native + Expo Router**.

## Ne İçin Kullanılır?

- Onboarding'i premium 3 aşamalı akışa çevirmek
- Ortak mobil UI bileşenlerini çıkarmak
- Paywall/subscription tarafını production planına taşımak
- iOS HIG'e göre tab bar, sheet/modal, accessibility, motion ve haptic audit yapmak
- Kritik mobil akışı smoke test etmek

## Temel Karşılıklar

| App Printer | Bu Skill |
|---|---|
| SwiftUI | React Native + Expo |
| XcodeGen | Expo Router file tree |
| StoreKit 2 native manager | `src/lib/iap.ts` adapter |
| SF Symbols | `lucide-react-native` |
| SwiftUI haptics | `expo-haptics` |
| SwiftUI transitions | Reanimated / RN `Animated` |
| Theme.swift | `src/theme/tokens.ts` + `useAppTheme()` |

## Ana Dosya

- [SKILL.md](SKILL.md)

## Referanslar

- [references/premium-mobile-qa.md](references/premium-mobile-qa.md)
- [references/anti-ai-slop.md](references/anti-ai-slop.md)
- [references/theming.md](references/theming.md)
- [references/monetization.md](references/monetization.md)
- [references/expo-router.md](references/expo-router.md)
- [references/i18n.md](references/i18n.md)

## Kullanım

Codex/Cursor/Claude oturumunda:

```text
GoldMoodAstro Expo Premium Mobile Skill'i uygula.
Önce mobile/AGENTS.md ve skills/expo-factory/SKILL.md oku.
```

Önerilen çalışma sırası:

1. `PrimaryButton`, `PremiumCard`, `ScreenShell`, `EmptyState`, `LoadingState`
2. Premium onboarding
3. Paywall/subscription production plan
4. HIG navigation/accessibility/motion/haptic audit
5. Critical flow smoke

## Kurallar

- Mobile dışı backend/frontend/admin dosyalarına dokunma.
- Yeni paket eklemeden önce mevcut dependency'leri kontrol et.
- Kullanıcı metinleri i18n'e eklenir.
- `bun run lint` çalıştırmadan tamamlandı deme.
- Store submit veya production build açık onay ister.
