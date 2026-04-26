# Anti-AI-Slop — React Native Gorsel Kalite Kurallari

Default Expo tutorial'i gibi durmamak icin detayli rehber. SKILL.md'deki "Anti-AI-Slop" kurallarinin genis hali.

## Hemen Reddedilen 12 Desen

### 1. Duz Beyaz Arka Plan

❌ **Yanlis:**
```tsx
<View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
```

✅ **Dogru:**
```tsx
<View style={{ 
  flex: 1, 
  backgroundColor: tokens.colors.background  // #F5F1E8 paper, veya subtle tint
}}>
```

Veya gradient:
```tsx
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={['#F5F1E8', '#FFFFFF']}
  style={{ flex: 1 }}
>
```

### 2. Default `TouchableOpacity`

❌ **Yanlis:**
```tsx
<TouchableOpacity onPress={onPress}>
  <Text>Devam</Text>
</TouchableOpacity>
```

✅ **Dogru:**
```tsx
<Pressable
  onPress={onPress}
  style={({ pressed }) => ({
    backgroundColor: tokens.colors.primary,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    borderRadius: tokens.radius.lg,
    opacity: pressed ? 0.9 : 1,
    transform: [{ scale: pressed ? 0.98 : 1 }],
    ...tokens.shadows.card,
  })}
>
  <Text style={{ color: 'white', fontWeight: '600', fontSize: 17 }}>
    Devam
  </Text>
</Pressable>
```

Daha da iyisi: `PrimaryButton` bileseni `react-native-reanimated` ile spring animasyonlu.

### 3. Icon'lar Renksiz ve Kucuk

❌ **Yanlis:**
```tsx
<Ionicons name="add" size={20} />
```

✅ **Dogru:**
```tsx
<Ionicons 
  name="add-circle" 
  size={28} 
  color={tokens.colors.primary}
/>
```

Feature icon'lari icin 48-72pt, gradient fill:
```tsx
import MaskedView from '@react-native-masked-view/masked-view';

<MaskedView
  maskElement={<Ionicons name="leaf" size={64} color="black" />}
>
  <LinearGradient
    colors={[tokens.colors.primary, tokens.colors.secondary]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={{ width: 64, height: 64 }}
  />
</MaskedView>
```

### 4. Generic Selamlama

❌ **Yanlis:**
```tsx
<Text>Hello, User</Text>
```

✅ **Dogru:**
```tsx
<Text style={{ fontFamily: tokens.typography.heading, fontSize: 28 }}>
  {hourGreeting()}, {user?.firstName ?? 'Ciftci'}
</Text>
// hourGreeting() -> "Gunaydin", "Iyi ogleden sonralar", "Iyi aksamlar"
```

Kultur + gunluk bagli hissettirir. "Hello, User" tutorial'dan kalma.

### 5. Default `FlatList` Satir

❌ **Yanlis:**
```tsx
<FlatList
  data={items}
  renderItem={({ item }) => <Text>{item.name}</Text>}
/>
```

✅ **Dogru:**
```tsx
<FlatList
  data={items}
  renderItem={({ item, index }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 80)}
      style={{
        backgroundColor: tokens.colors.surface,
        borderRadius: tokens.radius.lg,
        padding: tokens.spacing.md,
        marginHorizontal: tokens.spacing.md,
        marginBottom: tokens.spacing.sm,
        ...tokens.shadows.card,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Ionicons name={item.icon} size={32} color={tokens.colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', fontSize: 16 }}>{item.name}</Text>
          <Text style={{ fontSize: 13, color: tokens.colors.textSecondary }}>
            {item.subtitle}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={tokens.colors.textSecondary} />
      </View>
    </Animated.View>
  )}
  contentContainerStyle={{ paddingVertical: tokens.spacing.md }}
/>
```

Staggered enter animation, shadow, gradient kart, icon, chevron. Tam Card.

### 6. Animsiz Ekran Gecisi

❌ Expo Router default stack gecisi "fade" — bu Ok ama ekran icindeki elementler animsiz olmamali.

✅ Her ekranda giris animasyonu:
```tsx
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

<Animated.View entering={FadeInUp.duration(400)}>
  <Text>{title}</Text>
</Animated.View>

<Animated.View entering={FadeInDown.duration(400).delay(200)}>
  <ContentBlock />
</Animated.View>
```

### 7. Empty State = "Veri yok" Tek Satir

❌ **Yanlis:**
```tsx
{items.length === 0 && <Text>Henuz veri yok</Text>}
```

✅ **Dogru:**
```tsx
{items.length === 0 && (
  <View style={{ 
    alignItems: 'center', 
    padding: tokens.spacing.xl,
    gap: tokens.spacing.md,
  }}>
    <LinearGradient
      colors={tokens.gradients.primary}
      style={{
        width: 96, 
        height: 96, 
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="leaf-outline" size={48} color="white" />
    </LinearGradient>
    <Text style={{ fontSize: 20, fontWeight: '600', textAlign: 'center' }}>
      Henuz tarla eklemediniz
    </Text>
    <Text style={{ 
      fontSize: 15, 
      color: tokens.colors.textSecondary, 
      textAlign: 'center',
    }}>
      Ilk tarlanizi ekleyin, hava ve don uyarilari gelsin
    </Text>
    <PrimaryButton label="Tarla ekle" onPress={addField} />
  </View>
)}
```

### 8. Default Font (System)

❌ **Yanlis:**
```tsx
<Text>Baslik</Text>  // System font
```

✅ **Dogru:**
Fontlari yukle (app/_layout.tsx):
```tsx
import { useFonts, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { InterTight_400Regular, InterTight_600SemiBold } from '@expo-google-fonts/inter-tight';

const [loaded] = useFonts({
  'Fraunces-Bold': Fraunces_700Bold,
  'InterTight-Regular': InterTight_400Regular,
  'InterTight-SemiBold': InterTight_600SemiBold,
});

if (!loaded) return <SplashScreen />;
```

Kullan:
```tsx
<Text style={{ fontFamily: 'Fraunces-Bold', fontSize: 28 }}>Baslik</Text>
<Text style={{ fontFamily: 'InterTight-Regular', fontSize: 15 }}>Body</Text>
```

### 9. Haptic Feedback Yok

❌ Butonlar sessiz.

✅ Her etkilesim haptic:
```tsx
import * as Haptics from 'expo-haptics';

// Button tap (hafif)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Onemli eylem (orta)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Success (gostergeli)
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Warning (uyari)
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

// Error
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

// Toggle/switch
Haptics.selectionAsync();
```

### 10. Shadow Yok

Her Card mutlaka shadow'a sahip olmali (iOS + Android):

```tsx
const cardShadow = {
  // iOS
  shadowColor: '#2D3E32',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  // Android
  elevation: 4,
};
```

### 11. Numaralar Plain Text

❌ **Yanlis:**
```tsx
<Text>{temp}°C</Text>  // 22°C
```

✅ **Dogru:**
```tsx
<Text style={{ 
  fontFamily: 'JetBrainsMono-Bold',
  fontSize: 48,
  color: tokens.colors.textPrimary,
}}>
  {temp}
  <Text style={{ fontSize: 24 }}>°C</Text>
</Text>
```

Sayi daha onemli, birim daha kucuk. Mono font sayilari hizali tutar.

### 12. Status Renkleri Default Kullanim

❌ **Yanlis:**
```tsx
<View style={{ backgroundColor: 'red' }}>
```

✅ **Dogru:**
```tsx
<View style={{ 
  backgroundColor: tokens.colors.error,
  opacity: 0.1,  // semi-transparent
}}>
  <Ionicons name="warning" color={tokens.colors.error} />
  <Text style={{ color: tokens.colors.error, fontWeight: '600' }}>
    Don riski yuksek
  </Text>
</View>
```

Tokenlar dan gelen renk, subtle (opacity 0.1 arka plan), semantic.

---

## 5 Altin Kural

1. **Asla raw color kullanma** — daima `tokens.colors.{x}`
2. **Asla raw spacing kullanma** — daima `tokens.spacing.{x}`
3. **Asla stillenmemis Pressable kullanma** — her dokunulabilir stil + haptic
4. **Asla icon'u stillenmemis birakma** — boyut + renk + opsiyonel gradient
5. **Asla animsiz ekran yapma** — en azindan mount'ta FadeIn

---

## Gorsel Kontrol Listesi (QA Asama 7)

Ekran goruntusu alindiktan sonra sor:
- [ ] En az 1 gradient var mi? (background veya CTA)
- [ ] En az 1 shadow'lu card var mi?
- [ ] Herhangi bir element animasyonla mi girdi?
- [ ] Icon kullanimi var mi? Renkli mi?
- [ ] Empty state varsa zenginlestirildi mi?
- [ ] Tipografi hiyerarsisi var mi (3+ seviye)?
- [ ] Buton Pressed state'inde scale-down yapiyor mu?
- [ ] Renk paleti tokenlardan mi geliyor?
- [ ] Dark mode destek var mi (gelecek iterasyon)?
- [ ] Tablet boyutunda bozuluyor mu?

**Hepsi "evet" olmaliysa ekran gecer. Birisi "hayir" — yeniden tasarla.**
