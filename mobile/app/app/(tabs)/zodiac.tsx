import React, { useMemo } from 'react';
import type { ImageSourcePropType } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { useAppTheme, type AppTheme } from '@/theme';

function buildScreenStyles(t: AppTheme) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  headerText: { flex: 1, minWidth: 0 },
  headerTitle: { fontFamily: font.display, fontSize: 32, color: colors.gold, marginBottom: 8 },
  headerSubtitle: { fontFamily: font.serif, fontSize: 16, color: colors.textMuted, fontStyle: 'italic' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md, gap: 12 },
  gridItem: { 
    width: (width - spacing.md * 2 - 24) / 3, 
    backgroundColor: colors.surface, 
    borderRadius: radius.xl, 
    padding: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lineSoft,
    marginBottom: 4,
  },
  imageContainer: { width: 60, height: 60, marginBottom: 12 },
  signImage: { width: '100%', height: '100%' },
  signLabel: { fontFamily: font.sansBold, fontSize: 14, color: colors.text, marginBottom: 2 },
  signDate: { fontFamily: font.sans, fontSize: 10, color: colors.textMuted },
  toolsSection: { paddingHorizontal: spacing.lg, marginTop: spacing['2xl'] },
  sectionTitle: { fontFamily: font.sansBold, fontSize: 10, color: colors.goldDeep, letterSpacing: 2, marginBottom: spacing.lg },
  toolList: { gap: 12 },
  toolItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.surface, 
    padding: 16, 
    borderRadius: radius.lg, 
    gap: 16, 
    borderWidth: 1, 
    borderColor: colors.lineSoft 
  },
  toolIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  toolBody: { flex: 1 },
  toolTitle: { fontFamily: font.sansBold, fontSize: 16, color: colors.text },
  toolDesc: { fontFamily: font.sans, fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
}

import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Sparkles, Zap, Star } from 'lucide-react-native';


import { MenuHeaderButton } from '@/components/MenuHeaderButton';

const { width } = Dimensions.get('window');

const SIGN_IDS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

const ZODIAC_IMAGES: Record<string, ImageSourcePropType> = {
  aries: require('../../assets/zodiac/aries.png'),
  taurus: require('../../assets/zodiac/taurus.png'),
  gemini: require('../../assets/zodiac/gemini.png'),
  cancer: require('../../assets/zodiac/cancer.png'),
  leo: require('../../assets/zodiac/leo.png'),
  virgo: require('../../assets/zodiac/virgo.png'),
  libra: require('../../assets/zodiac/libra.png'),
  scorpio: require('../../assets/zodiac/scorpio.png'),
  sagittarius: require('../../assets/zodiac/sagittarius.png'),
  capricorn: require('../../assets/zodiac/capricorn.png'),
  aquarius: require('../../assets/zodiac/aquarius.png'),
  pisces: require('../../assets/zodiac/pisces.png'),
};

export default function ZodiacHubScreen() {
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <MenuHeaderButton />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Burçlar</Text>
              <Text style={styles.headerSubtitle}>Kozmik kimliğinizi ve günlük enerjinizi keşfedin.</Text>
            </View>
          </View>

          <View style={styles.grid}>
            {SIGN_IDS.map((signId) => (
              <Pressable
                key={signId}
                style={styles.gridItem}
                onPress={() => router.push(`/zodiac/${signId}` as any)}
              >
                <View style={styles.imageContainer}>
                  <Image
                    source={ZODIAC_IMAGES[signId]}
                    style={styles.signImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.signLabel}>{t(`zodiacSign.${signId}.name`)}</Text>
                <Text style={styles.signDate}>{t(`zodiacSign.${signId}.datesShort`)}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.toolsSection}>
            <Text style={styles.sectionTitle}>ASTROLOJİK ARAÇLAR</Text>
            <View style={styles.toolList}>
              <Pressable
                style={styles.toolItem}
                onPress={() => router.push('/zodiac/big-three' as any)}
              >
                <View style={[styles.toolIconWrap, { backgroundColor: colors.gold + '15' }]}>
                  <Zap size={20} color={colors.gold} />
                </View>
                <View style={styles.toolBody}>
                  <Text style={styles.toolTitle}>Yükselen Burç Hesapla</Text>
                  <Text style={styles.toolDesc}>Doğum tarihi, saati ve yeri ile Büyük Üçlü.</Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.toolItem}
                onPress={() => router.push('/unluler' as any)}
              >
                <View style={[styles.toolIconWrap, { backgroundColor: colors.amethyst + '22' }]}>
                  <Star size={20} color={colors.amethyst} />
                </View>
                <View style={styles.toolBody}>
                  <Text style={styles.toolTitle}>Ünlüler ve Burçları</Text>
                  <Text style={styles.toolDesc}>Ünlü isimlerin burç yorumları.</Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.toolItem}
                onPress={() => router.push('/(tabs)/birth-chart' as any)}
              >
                <View style={[styles.toolIconWrap, { backgroundColor: colors.goldDim + '15' }]}>
                  <Sparkles size={20} color={colors.goldDim} />
                </View>
                <View style={styles.toolBody}>
                  <Text style={styles.toolTitle}>Doğum Haritası</Text>
                  <Text style={styles.toolDesc}>Tam natal harita ve gezegen listesi.</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

