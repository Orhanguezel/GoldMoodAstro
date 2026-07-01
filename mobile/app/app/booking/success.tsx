import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAppTheme, type AppTheme } from '@/theme';

function buildScreenStyles(t: AppTheme) {
  const { colors, spacing, font, radius, shadows } = t;
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  iconContainer: { 
    width: 100, height: 100, borderRadius: 50, 
    backgroundColor: colors.surface, 
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xxl,
    borderWidth: 2, borderColor: colors.gold + '40',
    ...shadows.soft
  },
  icon: { fontSize: 48 },
  title: { 
    fontSize: 28, 
    fontFamily: font.display, 
    color: colors.gold, 
    textAlign: 'center', 
    marginBottom: spacing.md 
  },
  subtitle: { 
    fontSize: 16, 
    color: colors.stardustDim, 
    textAlign: 'center', 
    fontFamily: font.sans, 
    lineHeight: 24,
    marginBottom: spacing.xxl
  },
  actions: { width: '100%', gap: spacing.md },
  primaryBtn: { 
    backgroundColor: colors.amethyst, 
    paddingVertical: spacing.md, 
    borderRadius: radius.pill, 
    alignItems: 'center',
    ...shadows.soft
  },
  primaryBtnText: { color: colors.stardust, fontFamily: font.sansBold, fontSize: 16 },
  secondaryBtn: { 
    paddingVertical: spacing.md, 
    borderRadius: radius.pill, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line
  },
  secondaryBtnText: { color: colors.stardustDim, fontFamily: font.sansMedium, fontSize: 16 },
});
}



export default function BookingSuccessScreen() {
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);

  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✨</Text>
        </View>
        
        <Text style={styles.title}>{t('booking.successTitle', 'Randevunuz Alındı!')}</Text>
        <Text style={styles.subtitle}>
          {t('booking.successSubtitle', "Yıldızlar harika bir görüşme için hizalandı. Randevu detaylarınıza 'Randevularım' sekmesinden ulaşabilirsiniz.")}
        </Text>

        <View style={styles.actions}>
          <Pressable 
            style={styles.primaryBtn} 
            onPress={() => router.replace('/(tabs)/bookings')}
          >
            <Text style={styles.primaryBtnText}>{t('booking.viewBookings', 'Randevularıma Git')}</Text>
          </Pressable>

          <Pressable 
            style={styles.secondaryBtn} 
            onPress={() => router.replace('/(tabs)/today')}
          >
            <Text style={styles.secondaryBtnText}>{t('common.backToHome', 'Ana Sayfaya Dön')}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

