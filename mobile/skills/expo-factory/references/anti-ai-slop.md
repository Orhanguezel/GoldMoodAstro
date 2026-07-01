# Anti-AI-Slop — GoldMoodAstro React Native Kalite Kuralları

GoldMoodAstro premium astroloji uygulamasıdır. Ekranlar Expo tutorial'i, düz admin paneli veya web sayfası kopyası gibi görünmemelidir.

## Hemen Reddedilen Desenler

### 1. Düz ve ruhsuz arka plan

Yanlış:

```tsx
<View style={{ flex: 1, backgroundColor: '#fff' }} />
```

Doğru:

```tsx
const { colors } = useAppTheme();
<View style={{ flex: 1, backgroundColor: colors.bg }} />
```

Hero/onboarding gibi ekranlarda:

```tsx
<LinearGradient colors={[colors.inkDeep, colors.bg, colors.surface]} style={{ flex: 1 }}>
  {children}
</LinearGradient>
```

### 2. Stillenmemiş Pressable

Yanlış:

```tsx
<Pressable onPress={onPress}>
  <Text>Devam</Text>
</Pressable>
```

Doğru:

```tsx
<PrimaryButton label={t('common.continue')} onPress={onPress} />
```

Primary CTA kendi içinde haptic, pressed scale, disabled/loading state ve accessibility taşır.

### 3. Emoji ikonları

Yanlış:

```tsx
<Text>✨</Text>
```

Doğru:

```tsx
import { Sparkles } from 'lucide-react-native';

<Sparkles size={28} color={colors.gold} strokeWidth={1.8} />
```

Emoji sadece içerik/metin karakteri olarak anlamlıysa kullanılabilir; UI icon sistemi için `lucide-react-native` tercih edilir.

### 4. Default list rows

Yanlış:

```tsx
<FlatList data={items} renderItem={({ item }) => <Text>{item.name}</Text>} />
```

Doğru:

```tsx
<FlatList
  data={items}
  renderItem={({ item, index }) => (
    <Animated.View entering={FadeInDown.delay(index * 50)}>
      <PremiumCard>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.body}>{item.subtitle}</Text>
      </PremiumCard>
    </Animated.View>
  )}
/>
```

### 5. Spinner-only ekran

Yanlış:

```tsx
return <ActivityIndicator />;
```

Doğru:

```tsx
return <LoadingState title={t('loading.title')} subtitle={t('loading.subtitle')} />;
```

### 6. Tek satır empty state

Yanlış:

```tsx
<Text>Veri yok</Text>
```

Doğru:

```tsx
<EmptyState
  icon={Sparkles}
  title={t('bookings.emptyTitle')}
  body={t('bookings.emptyBody')}
  actionLabel={t('bookings.findConsultant')}
  onAction={() => router.push('/(tabs)/connect' as any)}
/>
```

### 7. Haptics olmayan kritik CTA

Kritik CTA'lar:

- onboarding continue/start
- login/register submit
- booking create
- payment start
- call join/leave
- review submit
- subscription purchase/restore

Bu aksiyonlarda `expo-haptics` kullanılır.

### 8. Accessibility eksikleri

Kritik Pressable'larda:

```tsx
<Pressable
  accessibilityRole="button"
  accessibilityLabel={t('booking.payNow')}
  hitSlop={8}
/>
```

Dokunma alanı minimum 44x44 olmalıdır.

### 9. Hardcoded renk ve font

Yanlış:

```tsx
color: '#C9A961'
fontFamily: 'Fraunces_700Bold'
```

Doğru:

```tsx
const { colors, font } = useAppTheme();
color: colors.gold
fontFamily: font.displayBold
```

### 10. Web sayfası gibi ekran

Mobil ekranlarda:

- hero metni kompakt olmalı
- button metni taşmamalı
- tab bar safe area'ya saygılı olmalı
- card içinde card yapılmamalı
- uzun açıklama yerine scannable başlık/kısa body kullanılmalı

## Kabul Kriteri

Bir ekran premium kabul edilmeden önce:

- token kullanıyor
- en az bir anlamlı motion var
- CTA haptic veriyor
- loading/empty/error state düşünülmüş
- accessibility label/role var
- küçük ekranlarda metin taşmıyor
- `bun run lint` geçiyor
