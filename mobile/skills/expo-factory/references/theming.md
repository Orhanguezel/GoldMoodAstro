# Theming — Token Bazli Tema Sistemi

Tum uygulamalar bu desen ile baslar. Tokenlar merkezi, kullanim tutarli.

## Neden Token?

- `color: '#0D9488'` yerine `color: tokens.colors.primary` — marka degistiginde tek yerden duzeltirsin
- Dark mode eklemek 10 dakika surer (token overrides)
- Farkli markalar icin runtime brand switching mumkun (tarim vs hayvancilik)
- Designer'in Figma variable'lari ile bire-bir eslenir

## Temel Yapi: `src/theme/tokens.ts`

```typescript
// src/theme/tokens.ts

export const palette = {
  // Ana renkler
  paper: '#F5F1E8',        // Background light
  pine: '#2D3E32',          // Text dark / primary dark
  terra: '#D4A373',         // Warm accent
  
  teal: {
    50:  '#F0FDFA',
    100: '#CCFBF1',
    400: '#2DD4BF',
    500: '#14B8A6',          // Primary
    600: '#0D9488',          // Primary strong
    700: '#0F766E',          // Primary darker
    900: '#134E4A',
  },
  
  amber: {
    400: '#FBBF24',
    500: '#F59E0B',          // Secondary
    600: '#D97706',
  },
  
  coral: {
    400: '#FB7185',          // Accent
    500: '#F43F5E',
  },
  
  gray: {
    50:  '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    400: '#94A3B8',
    500: '#64748B',
    700: '#334155',
    900: '#0F172A',
  },
  
  semantic: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
} as const;

export const tokens = {
  colors: {
    primary: palette.teal[600],
    primaryLight: palette.teal[400],
    primaryDark: palette.teal[700],
    secondary: palette.amber[500],
    accent: palette.coral[400],
    
    background: palette.paper,
    surface: '#FFFFFF',
    surfaceAlt: '#F5F1E8',
    surfaceOverlay: 'rgba(45, 62, 50, 0.6)',  // modal backdrop
    
    textPrimary: palette.pine,
    textSecondary: palette.gray[500],
    textMuted: palette.gray[400],
    textInverse: '#FFFFFF',
    
    border: palette.gray[200],
    borderStrong: palette.gray[400],
    
    success: palette.semantic.success,
    warning: palette.semantic.warning,
    error: palette.semantic.error,
    info: palette.semantic.info,
  },
  
  gradients: {
    primary: [palette.teal[500], palette.teal[700]] as const,
    hero: ['#F5F1E8', '#FFFFFF'] as const,
    danger: [palette.coral[400], palette.semantic.error] as const,
    success: [palette.teal[400], palette.semantic.success] as const,
    night: ['#1E293B', palette.gray[900]] as const,
  },
  
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  shadows: {
    card: {
      shadowColor: palette.pine,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    elevated: {
      shadowColor: palette.pine,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 8,
    },
    pressed: {
      shadowColor: palette.pine,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
  },
  
  typography: {
    heading: {
      family: 'Fraunces-Bold',
      sizes: { sm: 20, md: 24, lg: 28, xl: 32, xxl: 40 },
    },
    body: {
      family: 'InterTight-Regular',
      familyBold: 'InterTight-SemiBold',
      sizes: { xs: 11, sm: 13, md: 15, lg: 17, xl: 20 },
    },
    mono: {
      family: 'JetBrainsMono-Bold',
      sizes: { sm: 16, md: 24, lg: 32, xl: 48, xxl: 64 },
    },
  },
  
  durations: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  
  easings: {
    // react-native-reanimated icin
    spring: { damping: 15, stiffness: 150 },
    gentleSpring: { damping: 20, stiffness: 100 },
    bounce: { damping: 8, stiffness: 200 },
  },
} as const;

export type Tokens = typeof tokens;
export type ColorToken = keyof typeof tokens.colors;
```

## Font Yukleme

```typescript
// app/_layout.tsx
import { useFonts } from 'expo-font';
import {
  Fraunces_700Bold,
  Fraunces_400Regular,
} from '@expo-google-fonts/fraunces';
import {
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
  InterTight_700Bold,
} from '@expo-google-fonts/inter-tight';
import {
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Fraunces-Regular': Fraunces_400Regular,
    'Fraunces-Bold': Fraunces_700Bold,
    'InterTight-Regular': InterTight_400Regular,
    'InterTight-Medium': InterTight_500Medium,
    'InterTight-SemiBold': InterTight_600SemiBold,
    'InterTight-Bold': InterTight_700Bold,
    'JetBrainsMono-Bold': JetBrainsMono_700Bold,
  });
  
  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);
  
  if (!loaded && !error) return null;
  
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

Package:
```bash
bun add expo-font @expo-google-fonts/fraunces @expo-google-fonts/inter-tight @expo-google-fonts/jetbrains-mono
```

## Stillenmis Typography Bilesenleri

```tsx
// src/components/Text.tsx
import { Text as RNText, StyleSheet, TextStyle } from 'react-native';
import { tokens } from '@/src/theme/tokens';

type Variant = 
  | 'display' | 'heading' | 'subheading' 
  | 'body' | 'bodySmall' 
  | 'caption' | 'overline'
  | 'numeric';

interface Props {
  variant?: Variant;
  color?: keyof typeof tokens.colors;
  children: React.ReactNode;
  style?: TextStyle;
}

export function Text({ variant = 'body', color = 'textPrimary', children, style }: Props) {
  return (
    <RNText style={[styles[variant], { color: tokens.colors[color] }, style]}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  display: {
    fontFamily: tokens.typography.heading.family,
    fontSize: tokens.typography.heading.sizes.xxl,
    lineHeight: 48,
  },
  heading: {
    fontFamily: tokens.typography.heading.family,
    fontSize: tokens.typography.heading.sizes.lg,
    lineHeight: 36,
  },
  subheading: {
    fontFamily: tokens.typography.body.familyBold,
    fontSize: tokens.typography.body.sizes.xl,
    lineHeight: 28,
  },
  body: {
    fontFamily: tokens.typography.body.family,
    fontSize: tokens.typography.body.sizes.md,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: tokens.typography.body.family,
    fontSize: tokens.typography.body.sizes.sm,
    lineHeight: 18,
  },
  caption: {
    fontFamily: tokens.typography.body.family,
    fontSize: tokens.typography.body.sizes.xs,
    lineHeight: 14,
  },
  overline: {
    fontFamily: tokens.typography.body.familyBold,
    fontSize: tokens.typography.body.sizes.xs,
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  numeric: {
    fontFamily: tokens.typography.mono.family,
    fontSize: tokens.typography.mono.sizes.lg,
    lineHeight: 36,
  },
});
```

Kullanim:
```tsx
import { Text } from '@/src/components/Text';

<Text variant="heading">Hava Durumu</Text>
<Text variant="body" color="textSecondary">Antalya, Muratpasa</Text>
<Text variant="numeric">{temp}°</Text>
```

## Dark Mode (Ileri Iterasyon)

```typescript
// src/theme/colorSchemes.ts
import { palette } from './tokens';

export const lightColors = {
  background: palette.paper,
  surface: '#FFFFFF',
  textPrimary: palette.pine,
  // ...
};

export const darkColors = {
  background: palette.gray[900],
  surface: palette.gray[700],
  textPrimary: '#FFFFFF',
  // ...
};
```

```tsx
// src/hooks/useTheme.ts
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from '@/src/theme/colorSchemes';

export function useTheme() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}
```

## Multi-Brand (Tarim vs Hayvancilik)

Ayni kod tabanindan farkli brand uygulamalar uretmek icin:

```typescript
// src/theme/brands.ts

export const brands = {
  tarimiklim: {
    name: 'TarimIKlim',
    logo: require('@/assets/logos/tarimiklim.png'),
    palette: {
      primary: '#0D9488',  // teal
      secondary: '#F59E0B', // amber
      accent: '#FB7185',    // coral
    },
  },
  hayvanborsa: {
    name: 'Hayvan Borsa',
    logo: require('@/assets/logos/hayvanborsa.png'),
    palette: {
      primary: '#7C2D12',  // deep brown (toprak)
      secondary: '#EAB308', // gold
      accent: '#DC2626',    // red
    },
  },
  bereketfide: {
    name: 'Bereket Fide',
    palette: {
      primary: '#D4A373',  // wheat gold
      secondary: '#8B6B3E', 
      accent: '#B5E48C',    
    },
  },
} as const;

export type BrandKey = keyof typeof brands;
```

Runtime secim:
```tsx
// src/hooks/useBrand.ts
import { useState } from 'react';
import { brands, BrandKey } from '@/src/theme/brands';

const DEFAULT: BrandKey = 'tarimiklim';  // build time veya .env

export function useBrand() {
  const [brandKey] = useState<BrandKey>(DEFAULT);
  return brands[brandKey];
}
```

## Figma -> Token Sync

Designer tokenlari Figma Variables veya Tokens Studio'da tanimlarsa:

1. Figma plugin: "Tokens Studio for Figma"
2. Export: `design-tokens.json`
3. CI'da (GitHub Actions): `style-dictionary build`
4. Cikti: `src/theme/tokens.generated.ts`
5. Manuel tokenlari inherit et

Bu akis ilerde kurulabilir — simdilik manuel senkronizasyon yeterli.
