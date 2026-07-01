# Theming — GoldMoodAstro Token Sistemi

GoldMoodAstro mobile'da tema zaten kuruludur. Yeni kod bu sistemi genişletir; paralel token sistemi oluşturmaz.

## Ana Dosyalar

- `src/theme/tokens.ts`
- `src/theme/appTheme.ts`
- `src/theme/ThemeContext.tsx`
- `src/theme/index.ts`

## Kullanım

```tsx
import { useAppTheme } from '@/theme';

export function Example() {
  const { colors, spacing, radius, font, shadows } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderWidth: 1,
        borderRadius: radius.lg,
        padding: spacing.md,
        ...shadows.card,
      }}
    >
      <Text style={{ color: colors.text, fontFamily: font.displayBold }}>
        GoldMoodAstro
      </Text>
    </View>
  );
}
```

## Renk Ailesi

- `gold`: premium CTA, vurgu, yıldız/astro hissi
- `ink`: sıcak koyu zemin
- `cream`: okunabilir açık ton
- `plum`: mistik ikincil vurgu
- `surface`: kart yüzeyi
- `surfaceHigh`: yükseltilmiş yüzey
- `line` / `lineSoft`: border

Yeni komponentlerde eski alias'lar yerine semantik adlar kullan:

- `colors.text` yerine `colors.stardust` kullanma
- `colors.bg` yerine `colors.midnight` kullanma
- `colors.gold` yerine `colors.amethyst` kullanma

Alias'lar sadece eski ekranları kırmamak için var.

## Gradient Kullanımı

`expo-linear-gradient` premium yüzeylerde tercih edilir:

```tsx
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={[colors.surfaceHigh, colors.surface]}
  style={{
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card,
  }}
>
  {children}
</LinearGradient>
```

## Typography

- Display / marka: `font.display`, `font.displayMedium`, `font.displayBold`
- Editorial body: `font.serif`, `font.serifMedium`
- UI body: `font.sans`, `font.sansMedium`, `font.sansBold`
- Sayı/fiyat/kod: `font.mono`

Hero-scale tipografi sadece onboarding, feature hero ve büyük brand anlarında kullanılır. Kart ve tab gibi küçük alanlarda 14-20pt aralığı korunur.

## Spacing ve Radius

- Compact internal gap: `spacing.sm`
- Normal padding: `spacing.md`
- Section padding: `spacing.lg`
- Hero spacing: `spacing.xl` ve üstü
- Kart radius: `radius.lg` veya `radius.xl`
- Icon button radius: `radius.pill`

## Shadow

React Native shadow platform farkı taşır. Mevcut token shadow'ları kullan:

- `shadows.soft`: küçük yüzey
- `shadows.card`: ana kart
- `shadows.gold`: CTA / premium vurgu
- `shadows.glowGold`: nadiren hero/premium highlight

## Design Anti-Drift

Yapma:

- yeni `tokens2.ts`
- local palette sabitleri
- component içinde marka hex kodu
- kart içinde kart
- tek renge boğulmuş ekran

Yap:

- `useAppTheme()`
- ortak premium bileşenler
- semantik renk adları
- küçük ekranlarda metin taşma kontrolü
